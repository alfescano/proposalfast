import { inngest } from "./client";
import { runProposalPipeline } from "@/lib/ai/pipeline";
import { persistGeneratedVersion } from "@/lib/proposals/persist-generation";
import { getEmailAdapter, mail } from "@/lib/email";
import { prisma } from "@/lib/db";
import { renderProposalPdf } from "@/lib/pdf/render";
import { getStorage } from "@/lib/storage/s3";
import { absoluteUrl } from "@/lib/site";

export const generateProposalJob = inngest.createFunction(
  { id: "proposal-generate", triggers: { event: "proposal/generate" } },
  async ({ event, step }) => {
    const { proposalId, brief, facts, organizationId, userId } = event.data as {
      proposalId: string;
      brief: string;
      facts?: string[];
      organizationId: string;
      userId: string;
    };

    const result = await step.run("pipeline", async () =>
      runProposalPipeline({ brief, facts, organizationId, userId }),
    );

    await step.run("persist", async () =>
      persistGeneratedVersion({
        proposalId,
        organizationId,
        userId,
        result,
      }),
    );

    return { ok: true };
  },
);

export const sendEmailJob = inngest.createFunction(
  { id: "email-send", triggers: { event: "email/send" } },
  async ({ event }) => {
    const adapter = getEmailAdapter();
    return adapter.send(event.data as import("@/lib/email/adapter").EmailMessage);
  },
);

export const renderPdfJob = inngest.createFunction(
  { id: "proposal-pdf", triggers: { event: "proposal/pdf" } },
  async ({ event, step }) => {
    const { proposalId, organizationId } = event.data as {
      proposalId: string;
      organizationId: string;
    };

    const bytes = await step.run("render", async () => {
      const buffer = await renderProposalPdf(proposalId);
      return Array.from(buffer);
    });
    const stored = await step.run("upload", async () => {
      const storage = getStorage();
      const key = `org/${organizationId}/proposals/${proposalId}.pdf`;
      return storage.put({
        key,
        body: Buffer.from(bytes),
        contentType: "application/pdf",
      });
    });
    return stored;
  },
);

export const followUpJob = inngest.createFunction(
  { id: "proposal-follow-up", triggers: { event: "proposal/follow-up" } },
  async ({ event }) => {
    const { followUpId } = event.data as { followUpId: string };
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: { proposal: { include: { client: true, organization: true } } },
    });
    if (!followUp || followUp.status !== "SCHEDULED") return { skipped: true };

    const settings = await prisma.settings.findUnique({
      where: { organizationId: followUp.organizationId },
    });
    if (!followUp.proposal.followUpOptIn || !settings?.followUpOptIn) {
      await prisma.followUp.update({
        where: { id: followUpId },
        data: { status: "CANCELED" },
      });
      return { skipped: true, reason: "opt-in-required" };
    }

    const adapter = getEmailAdapter();
    if (!followUp.proposal.client?.email) {
      await prisma.followUp.update({
        where: { id: followUpId },
        data: { status: "FAILED" },
      });
      return { skipped: true };
    }

    const template = mail.templates.followUpEmail({
      clientName: followUp.proposal.client.name,
      senderName: followUp.proposal.organization.name,
      title: followUp.proposal.title,
      portalUrl: absoluteUrl(`/p/${followUp.proposal.publicId}`),
    });
    await adapter.send({ to: followUp.proposal.client.email, ...template });

    await prisma.followUp.update({
      where: { id: followUpId },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { ok: true };
  },
);

export const inngestFunctions = [
  generateProposalJob,
  sendEmailJob,
  renderPdfJob,
  followUpJob,
];

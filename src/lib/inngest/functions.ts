import { inngest } from "./client";
import { runProposalPipeline } from "@/lib/ai/pipeline";
import { getEmailAdapter } from "@/lib/email";
import { prisma } from "@/lib/db";
import { renderProposalPdf } from "@/lib/pdf/render";
import { getStorage } from "@/lib/storage/s3";

export const generateProposalJob = inngest.createFunction(
  { id: "proposal-generate" },
  { event: "proposal/generate" },
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

    await step.run("persist", async () => {
      const proposal = await prisma.proposal.findFirst({
        where: { id: proposalId, organizationId, deletedAt: null },
        include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      });
      if (!proposal) throw new Error("Proposal not found for this organization.");

      const nextVersion = (proposal.versions[0]?.version ?? 0) + 1;
      await prisma.proposalVersion.create({
        data: {
          proposalId,
          version: nextVersion,
          content: result as object,
          createdById: userId,
          sections: {
            create: result.sections.map((section, index) => ({
              type: section.type,
              title: section.title,
              sortOrder: index,
              content: {
                body: section.body,
                placeholders: section.placeholders,
              },
            })),
          },
        },
      });

      await prisma.proposal.update({
        where: { id: proposalId },
        data: { status: "REVIEW" },
      });
    });

    return { ok: true };
  },
);

export const sendEmailJob = inngest.createFunction(
  { id: "email-send" },
  { event: "email/send" },
  async ({ event }) => {
    const adapter = getEmailAdapter();
    return adapter.send(event.data);
  },
);

export const renderPdfJob = inngest.createFunction(
  { id: "proposal-pdf" },
  { event: "proposal/pdf" },
  async ({ event, step }) => {
    const { proposalId, organizationId } = event.data as {
      proposalId: string;
      organizationId: string;
    };

    const bytes = await step.run("render", async () => renderProposalPdf(proposalId));
    const stored = await step.run("upload", async () => {
      const storage = getStorage();
      const key = `org/${organizationId}/proposals/${proposalId}.pdf`;
      return storage.put({
        key,
        body: bytes,
        contentType: "application/pdf",
      });
    });
    return stored;
  },
);

export const followUpJob = inngest.createFunction(
  { id: "proposal-follow-up" },
  { event: "proposal/follow-up" },
  async ({ event }) => {
    const { followUpId } = event.data as { followUpId: string };
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: { proposal: { include: { client: true, organization: true } } },
    });
    if (!followUp || followUp.status !== "SCHEDULED") return { skipped: true };

    const adapter = getEmailAdapter();
    if (!followUp.proposal.client?.email) {
      await prisma.followUp.update({
        where: { id: followUpId },
        data: { status: "FAILED" },
      });
      return { skipped: true };
    }

    await adapter.send({
      to: followUp.proposal.client.email,
      subject: `Following up: ${followUp.proposal.title}`,
      text: `A reminder that ${followUp.proposal.organization.name} sent you a proposal. Reply to this thread if you have questions.`,
      html: `<p>A reminder that ${followUp.proposal.organization.name} sent you a proposal.</p>`,
    });

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

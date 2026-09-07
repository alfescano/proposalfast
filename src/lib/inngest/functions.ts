import { inngest } from "./client";
import { runProposalPipeline } from "@/lib/ai/pipeline";
import { persistGeneratedVersion } from "@/lib/proposals/persist-generation";
import { getEmailAdapter } from "@/lib/email";
import { renderProposalPdf } from "@/lib/pdf/render";
import { getStorage } from "@/lib/storage/s3";

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
    const { processScheduledFollowUp } = await import("@/lib/proposals/follow-up");
    return processScheduledFollowUp(followUpId);
  },
);

export const inngestFunctions = [
  generateProposalJob,
  sendEmailJob,
  renderPdfJob,
  followUpJob,
];

import { prisma } from "@/lib/db";
import { getEmailAdapter, mail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

export async function processScheduledFollowUp(followUpId: string) {
  const followUp = await prisma.followUp.findUnique({
    where: { id: followUpId },
    include: { proposal: { include: { client: true, organization: true } } },
  });
  if (!followUp || followUp.status !== "SCHEDULED") return { skipped: true as const };

  const settings = await prisma.settings.findUnique({
    where: { organizationId: followUp.organizationId },
  });
  if (!followUp.proposal.followUpOptIn || !settings?.followUpOptIn) {
    await prisma.followUp.update({
      where: { id: followUpId },
      data: { status: "CANCELED" },
    });
    return { skipped: true as const, reason: "opt-in-required" };
  }

  if (!followUp.proposal.client?.email) {
    await prisma.followUp.update({
      where: { id: followUpId },
      data: { status: "FAILED" },
    });
    return { skipped: true as const, reason: "missing-client-email" };
  }

  const adapter = getEmailAdapter();
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
  return { ok: true as const };
}

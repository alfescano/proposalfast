import { prisma } from "@/lib/db";
import { hashIp } from "@/lib/crypto";
import { mail, sendMail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

export async function recordProposalView(input: {
  proposalId: string;
  organizationId: string;
  title: string;
  status: string;
  viewedAt: Date | null;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}) {
  const priorViews = await prisma.proposalView.count({
    where: { proposalId: input.proposalId },
  });

  await prisma.proposalView.create({
    data: {
      proposalId: input.proposalId,
      ipHash: hashIp(input.ip),
      userAgent: input.userAgent,
      referrer: input.referrer,
    },
  });
  await prisma.proposalEvent.create({
    data: { proposalId: input.proposalId, type: "viewed" },
  });

  if (input.status === "SENT") {
    await prisma.proposal.update({
      where: { id: input.proposalId },
      data: { status: "VIEWED", viewedAt: input.viewedAt ?? new Date() },
    });
  }

  if (priorViews === 0 && (input.status === "SENT" || input.status === "VIEWED")) {
    const owner = await prisma.organizationMember.findFirst({
      where: { organizationId: input.organizationId, role: "OWNER" },
      include: { user: true },
    });
    const client = await prisma.proposal.findUnique({
      where: { id: input.proposalId },
      include: { client: true },
    });
    if (owner?.user.email) {
      await sendMail(
        owner.user.email,
        mail.templates.proposalOpenedEmail({
          ownerName: owner.user.name ?? "there",
          clientName: client?.client?.name ?? "A client",
          title: input.title,
          dashboardUrl: absoluteUrl(`/proposals/${input.proposalId}`),
        }),
      );
    }
  }
}

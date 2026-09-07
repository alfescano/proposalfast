import { prisma } from "@/lib/db";
import { buildFunnel, buildMonthlyTrends } from "@/lib/analytics";

export async function loadOrgAnalytics(organizationId: string) {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 6);

  const [events, payments, created, sent, opened, accepted, paid, memberCount] = await Promise.all([
    prisma.proposalEvent.findMany({
      where: {
        createdAt: { gte: since },
        proposal: { organizationId, deletedAt: null },
      },
      select: { type: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { organizationId, status: "SUCCEEDED", createdAt: { gte: since } },
      select: { amountCents: true, createdAt: true },
    }),
    prisma.proposal.count({ where: { organizationId, deletedAt: null } }),
    prisma.proposal.count({ where: { organizationId, deletedAt: null, sentAt: { not: null } } }),
    prisma.proposal.count({ where: { organizationId, deletedAt: null, viewedAt: { not: null } } }),
    prisma.proposal.count({ where: { organizationId, deletedAt: null, acceptedAt: { not: null } } }),
    prisma.proposal.count({
      where: { organizationId, deletedAt: null, payments: { some: { status: "SUCCEEDED" } } },
    }),
    prisma.organizationMember.count({ where: { organizationId } }),
  ]);

  return {
    trends: buildMonthlyTrends({ events, payments }),
    funnel: buildFunnel({
      signups: memberCount,
      firstProposal: created,
      sent,
      opened,
      accepted,
      paid,
    }),
  };
}

import { prisma } from "@/lib/db";
import { buildFunnel, buildMonthlyTrends } from "@/lib/analytics";

export async function loadAdminOverview() {
  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - 6);

  const [
    users,
    orgs,
    proposals,
    clients,
    aiUsage,
    subscriptions,
    payments,
    events,
    supportOpen,
    failedFollowUps,
    recentUsers,
    recentOrgs,
    recentSupport,
    usersWithProposal,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.organization.count({ where: { deletedAt: null } }),
    prisma.proposal.count({ where: { deletedAt: null } }),
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.aIUsage.aggregate({
      _sum: { inputTokens: true, outputTokens: true, costCents: true },
      _count: true,
    }),
    prisma.subscription.findMany({
      where: { organization: { deletedAt: null } },
      include: { plan: true, organization: { select: { name: true, slug: true } } },
    }),
    prisma.payment.findMany({
      where: { status: "SUCCEEDED", createdAt: { gte: since } },
      select: { amountCents: true, createdAt: true },
    }),
    prisma.proposalEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { type: true, createdAt: true },
    }),
    prisma.supportRequest.count({ where: { status: "open" } }),
    prisma.followUp.count({ where: { status: "FAILED" } }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        memberships: { include: { organization: { select: { name: true } } } },
        _count: { select: { createdProposals: true } },
      },
    }),
    prisma.organization.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        subscription: { include: { plan: true } },
        _count: { select: { members: true, proposals: true, clients: true } },
      },
    }),
    prisma.supportRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.count({
      where: { deletedAt: null, createdProposals: { some: {} } },
    }),
  ]);

  const paidOrgs = subscriptions.filter((item) => item.plan.tier !== "FREE" && item.status !== "CANCELED");
  const mrrCents = paidOrgs.reduce((sum, item) => sum + item.plan.monthlyPriceCents, 0);
  const revenueCents = payments.reduce((sum, item) => sum + item.amountCents, 0);

  const sent = await prisma.proposal.count({ where: { deletedAt: null, sentAt: { not: null } } });
  const opened = await prisma.proposal.count({ where: { deletedAt: null, viewedAt: { not: null } } });
  const accepted = await prisma.proposal.count({ where: { deletedAt: null, acceptedAt: { not: null } } });
  const paid = await prisma.proposal.count({
    where: { deletedAt: null, payments: { some: { status: "SUCCEEDED" } } },
  });

  return {
    counts: {
      users,
      orgs,
      proposals,
      clients,
      aiCalls: aiUsage._count,
      aiTokens: (aiUsage._sum.inputTokens ?? 0) + (aiUsage._sum.outputTokens ?? 0),
      aiCostCents: aiUsage._sum.costCents ?? 0,
      supportOpen,
      failedFollowUps,
      paidOrgs: paidOrgs.length,
      mrrCents,
      revenueCents,
    },
    subscriptions,
    recentUsers,
    recentOrgs,
    recentSupport,
    trends: buildMonthlyTrends({ events, payments }),
    funnel: buildFunnel({
      signups: users,
      firstProposal: usersWithProposal,
      sent,
      opened,
      accepted,
      paid,
    }),
  };
}

import { prisma } from "@/lib/db";
import { PLAN_CATALOG, isWithinLimit } from "@/lib/plans";
import { PlanLimitError } from "@/lib/rbac";

export async function assertPlanCapacity(
  organizationId: string,
  resource: "proposals" | "clients" | "members",
) {
  const ctx = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });
  const tier = ctx?.plan.tier ?? "FREE";
  const limits = PLAN_CATALOG[tier].limits;

  if (resource === "proposals") {
    const used = await prisma.proposal.count({
      where: { organizationId, deletedAt: null, status: { not: "ARCHIVED" } },
    });
    if (!isWithinLimit(used, limits.maxProposals)) {
      throw new PlanLimitError(
        `The ${tier} plan allows ${limits.maxProposals} active proposals. Upgrade to add more.`,
      );
    }
  }

  if (resource === "clients") {
    const used = await prisma.client.count({
      where: { organizationId, deletedAt: null },
    });
    if (!isWithinLimit(used, limits.maxClients)) {
      throw new PlanLimitError(
        `The ${tier} plan allows ${limits.maxClients} clients. Upgrade to add more.`,
      );
    }
  }

  if (resource === "members") {
    const used = await prisma.organizationMember.count({ where: { organizationId } });
    if (!isWithinLimit(used, limits.maxMembers)) {
      throw new PlanLimitError(
        `The ${tier} plan allows ${limits.maxMembers} seats. Upgrade to invite the team.`,
      );
    }
  }
}

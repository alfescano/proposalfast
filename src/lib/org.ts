import { cache } from "react";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { AuthorizationError, TenantError, canWriteProposals, hasRole } from "@/lib/rbac";
import { PLAN_CATALOG, isWithinLimit } from "@/lib/plans";
import { PlanLimitError } from "@/lib/rbac";
import { getPreferredOrgId } from "@/lib/org-cookie";
export { slugify, uniqueOrgSlug } from "@/lib/slug";

export const getSessionUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
});

export const getCurrentOrgContext = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: session.user.id, organization: { deletedAt: null } },
    include: {
      organization: {
        include: {
          settings: true,
          subscription: { include: { plan: true } },
        },
      },
      user: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (!memberships.length) return null;

  const preferred = await getPreferredOrgId();
  const membership =
    memberships.find((item) => item.organizationId === preferred) ?? memberships[0];

  return {
    user: membership.user,
    membership,
    memberships,
    organization: membership.organization,
    role: membership.role,
    plan: membership.organization.subscription?.plan ?? null,
  };
});

export async function requireOrg(minimum: Role = "VIEWER") {
  const ctx = await getCurrentOrgContext();
  if (!ctx) {
    throw new AuthorizationError("Sign in to continue.");
  }
  if (!hasRole(ctx.role, minimum)) {
    throw new AuthorizationError();
  }
  return ctx;
}

export async function requireWritableOrg() {
  const ctx = await requireOrg("MEMBER");
  if (!canWriteProposals(ctx.role)) {
    throw new AuthorizationError();
  }
  return ctx;
}

export async function assertSameOrg<T extends { organizationId: string }>(
  record: T | null,
  organizationId: string,
): Promise<T> {
  if (!record || record.organizationId !== organizationId) {
    throw new TenantError();
  }
  return record;
}

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


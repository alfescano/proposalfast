import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "./db";
import { PLAN_CATALOG, stripePriceEnvFor } from "./plans";

type PlanClient = { plan: PrismaClient["plan"] };

function catalogRow(plan: (typeof PLAN_CATALOG)[keyof typeof PLAN_CATALOG]): Prisma.PlanCreateInput {
  return {
    tier: plan.tier,
    name: plan.name,
    description: plan.description,
    monthlyPriceCents: plan.monthlyPriceCents,
    yearlyPriceCents: plan.yearlyPriceCents,
    stripePriceIdMonthly: stripePriceEnvFor(plan.tier, "month"),
    stripePriceIdYearly: stripePriceEnvFor(plan.tier, "year"),
    maxProposals: plan.limits.maxProposals,
    maxClients: plan.limits.maxClients,
    maxMembers: plan.limits.maxMembers,
    maxAiGenerationsPerMonth: plan.limits.maxAiGenerationsPerMonth,
    features: plan.features,
  };
}

/**
 * Idempotent FREE / PRO / BUSINESS upsert from PLAN_CATALOG.
 * Safe in production: catalog rows only, never sample users.
 */
export async function ensureDefaultPlans(db: PlanClient = defaultPrisma) {
  const plans = [];
  for (const definition of Object.values(PLAN_CATALOG)) {
    const data = catalogRow(definition);
    const row = await db.plan.upsert({
      where: { tier: definition.tier },
      create: data,
      update: {
        name: data.name,
        description: data.description,
        monthlyPriceCents: data.monthlyPriceCents,
        yearlyPriceCents: data.yearlyPriceCents,
        stripePriceIdMonthly: data.stripePriceIdMonthly,
        stripePriceIdYearly: data.stripePriceIdYearly,
        maxProposals: data.maxProposals,
        maxClients: data.maxClients,
        maxMembers: data.maxMembers,
        maxAiGenerationsPerMonth: data.maxAiGenerationsPerMonth,
        features: data.features,
      },
    });
    plans.push(row);
  }

  const free = plans.find((plan) => plan.tier === "FREE");
  if (!free) {
    throw new Error("FREE plan missing after ensureDefaultPlans.");
  }

  return { free, plans };
}

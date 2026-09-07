"use server";

import { PlanTier } from "@prisma/client";
import { requireOrg } from "@/lib/org";
import { canManageBilling } from "@/lib/rbac";
import {
  createCustomerPortalSession,
  createSubscriptionCheckout,
} from "@/lib/stripe/client";
import { PLAN_CATALOG } from "@/lib/plans";

export async function startPlanCheckout(tier: Exclude<PlanTier, "FREE">, interval: "month" | "year") {
  const ctx = await requireOrg("OWNER");
  if (!canManageBilling(ctx.role)) {
    return { ok: false as const, error: "Only the owner can change billing." };
  }
  if (!PLAN_CATALOG[tier]) {
    return { ok: false as const, error: "Choose Pro or Business." };
  }

  try {
    const session = await createSubscriptionCheckout({
      organizationId: ctx.organization.id,
      customerEmail: ctx.user.email,
      stripeCustomerId: ctx.organization.subscription?.stripeCustomerId,
      tier,
      interval,
    });
    if (!session.url) return { ok: false as const, error: "Stripe did not return a Checkout URL." };
    return { ok: true as const, url: session.url };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not start Checkout.",
    };
  }
}

export async function openCustomerPortal() {
  const ctx = await requireOrg("OWNER");
  const customerId = ctx.organization.subscription?.stripeCustomerId;
  if (!customerId) {
    return { ok: false as const, error: "No Stripe customer yet. Upgrade once to create one." };
  }
  try {
    const session = await createCustomerPortalSession(customerId);
    return { ok: true as const, url: session.url };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not open the customer portal.",
    };
  }
}

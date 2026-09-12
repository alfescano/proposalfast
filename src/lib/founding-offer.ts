import type { PlanTier } from "@prisma/client";
import { PLAN_CATALOG } from "@/lib/plans";

/**
 * Founding Pro — Product Hunt / launch offer (Sep 2026).
 *
 * Price: $29/month (regular Pro is $49/month). Chosen as a clear early-adopter
 * discount (~41% off) without a fake “90% off” launch gimmick. Same Pro limits
 * and features. Monthly only; yearly Pro stays at the catalog price.
 *
 * Limits (whichever comes first):
 *   1. End of September 2026 Pacific (exclusive: 2026-10-01 00:00 America/Los_Angeles)
 *   2. First 50 paid Pro workspaces (ACTIVE, TRIALING, or PAST_DUE)
 *
 * Stripe: do not invent a Price id. Create a recurring $29/month Price on the
 * existing Pro product and set STRIPE_PRICE_FOUNDING_PRO_MONTHLY. Checkout
 * refuses to start Founding while the offer is advertised unless that env is set.
 */
export const FOUNDING_PRO_MONTHLY_CENTS = 2900;
export const FOUNDING_PRO_CAP = 50;
export const FOUNDING_PRO_PRICE_ENV = "STRIPE_PRICE_FOUNDING_PRO_MONTHLY";

/** Exclusive end: midnight Oct 1, 2026 Pacific (PDT, UTC−7). */
export const FOUNDING_PRO_ENDS_AT = new Date("2026-10-01T07:00:00.000Z");

export const FOUNDING_PRO_ENDS_LABEL = "September 30, 2026, 11:59 p.m. Pacific";

export type FoundingOfferState = {
  active: boolean;
  windowOpen: boolean;
  capOpen: boolean;
  claimed: number | null;
  remaining: number | null;
  monthlyPriceCents: number;
  regularMonthlyPriceCents: number;
  endsAt: string;
  endsLabel: string;
  cap: number;
  checkoutConfigured: boolean;
};

export function foundingPriceId() {
  const value = process.env[FOUNDING_PRO_PRICE_ENV]?.trim();
  return value || undefined;
}

export function isFoundingWindowOpen(now = new Date()) {
  return now.getTime() < FOUNDING_PRO_ENDS_AT.getTime();
}

export function evaluateFoundingOffer(input: {
  now?: Date;
  claimed: number | null;
  priceConfigured: boolean;
}): FoundingOfferState {
  const now = input.now ?? new Date();
  const windowOpen = isFoundingWindowOpen(now);
  const capOpen = input.claimed === null ? true : input.claimed < FOUNDING_PRO_CAP;
  const remaining =
    input.claimed === null ? null : Math.max(0, FOUNDING_PRO_CAP - input.claimed);

  return {
    active: windowOpen && capOpen,
    windowOpen,
    capOpen,
    claimed: input.claimed,
    remaining,
    monthlyPriceCents: FOUNDING_PRO_MONTHLY_CENTS,
    regularMonthlyPriceCents: PLAN_CATALOG.PRO.monthlyPriceCents,
    endsAt: FOUNDING_PRO_ENDS_AT.toISOString(),
    endsLabel: FOUNDING_PRO_ENDS_LABEL,
    cap: FOUNDING_PRO_CAP,
    checkoutConfigured: input.priceConfigured,
  };
}

export function foundingOfferCopy(state: FoundingOfferState) {
  const remainingText =
    state.remaining === null
      ? `the first ${state.cap} Pro workspaces`
      : state.remaining === 1
        ? "1 Founding Pro spot left"
        : `${state.remaining} of ${state.cap} Founding Pro spots left`;

  return {
    badge: "Founding offer",
    headline: `Founding Pro is ${formatUsd(state.monthlyPriceCents)}/month`,
    limit: `Available until ${state.endsLabel}, or ${remainingText} — whichever comes first.`,
    lockIn: `Same Pro features. The ${formatUsd(state.monthlyPriceCents)}/month Stripe price stays on this subscription until you change plans or cancel. Regular Pro is ${formatUsd(state.regularMonthlyPriceCents)}/month.`,
    yearly: `Yearly Pro stays ${formatUsd(PLAN_CATALOG.PRO.yearlyPriceCents)}/year (not part of this offer).`,
  };
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function selectSubscriptionPriceId(input: {
  tier: Exclude<PlanTier, "FREE">;
  interval: "month" | "year";
  founding: FoundingOfferState;
  regularPriceId?: string;
}): { priceId: string; founding: boolean } {
  if (input.tier === "PRO" && input.interval === "month" && input.founding.active) {
    const foundingId = foundingPriceId();
    if (!foundingId) {
      throw new Error(
        "Founding Pro is on offer, but STRIPE_PRICE_FOUNDING_PRO_MONTHLY is not set. Create the $29/month Stripe Price and set that env var before taking Founding checkouts.",
      );
    }
    return { priceId: foundingId, founding: true };
  }

  if (!input.regularPriceId) {
    throw new Error(
      `Missing Stripe price id for ${input.tier} ${input.interval}. Set STRIPE_PRICE_${input.tier}_${input.interval === "month" ? "MONTHLY" : "YEARLY"}.`,
    );
  }

  return { priceId: input.regularPriceId, founding: false };
}

export function isFoundingProPriceId(priceId: string | undefined) {
  if (!priceId) return false;
  return foundingPriceId() === priceId;
}

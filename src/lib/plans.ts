import { PlanTier } from "@prisma/client";

export type PlanLimits = {
  maxProposals: number;
  maxClients: number;
  maxMembers: number;
  maxAiGenerationsPerMonth: number;
};

export type PlanDefinition = {
  tier: PlanTier;
  name: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  limits: PlanLimits;
  features: string[];
  highlighted?: boolean;
};

/** -1 means unlimited. Limits are enforced in server actions, never only in the UI. */
export const UNLIMITED = -1;

export const PLAN_CATALOG: Record<PlanTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    name: "Free",
    description: "Send your first branded proposals and see if clients open them.",
    monthlyPriceCents: 0,
    yearlyPriceCents: 0,
    limits: {
      maxProposals: 5,
      maxClients: 10,
      maxMembers: 1,
      maxAiGenerationsPerMonth: 10,
    },
    features: [
      "5 active proposals",
      "10 clients",
      "1 seat",
      "10 AI drafts / month",
      "Client portal + view tracking",
      "System templates",
    ],
  },
  PRO: {
    tier: "PRO",
    name: "Pro",
    description: "For independents and small studios that close work every week.",
    monthlyPriceCents: 4900,
    yearlyPriceCents: 49000,
    highlighted: true,
    limits: {
      maxProposals: 100,
      maxClients: 500,
      maxMembers: 5,
      maxAiGenerationsPerMonth: 200,
    },
    features: [
      "100 active proposals",
      "500 clients",
      "5 seats",
      "200 AI drafts / month",
      "E-sign + Stripe checkout",
      "Custom brand + PDF export",
      "Follow-up sequences",
    ],
  },
  BUSINESS: {
    tier: "BUSINESS",
    name: "Business",
    description: "For agencies that need team workflows and higher AI volume.",
    monthlyPriceCents: 14900,
    yearlyPriceCents: 149000,
    limits: {
      maxProposals: UNLIMITED,
      maxClients: UNLIMITED,
      maxMembers: 25,
      maxAiGenerationsPerMonth: 1000,
    },
    features: [
      "Unlimited proposals and clients",
      "25 seats",
      "1,000 AI drafts / month",
      "Everything in Pro",
      "Shared templates",
      "Audit log + role controls",
      "Priority email support",
    ],
  },
};

export function isWithinLimit(used: number, max: number) {
  if (max === UNLIMITED) return true;
  return used < max;
}

export function remaining(used: number, max: number) {
  if (max === UNLIMITED) return UNLIMITED;
  return Math.max(0, max - used);
}

export function formatLimit(max: number) {
  return max === UNLIMITED ? "Unlimited" : String(max);
}

export function formatPrice(cents: number) {
  if (cents === 0) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function stripePriceEnvFor(tier: PlanTier, interval: "month" | "year") {
  if (tier === "FREE") return undefined;
  const key =
    interval === "month"
      ? `STRIPE_PRICE_${tier}_MONTHLY`
      : `STRIPE_PRICE_${tier}_YEARLY`;
  return process.env[key] || undefined;
}

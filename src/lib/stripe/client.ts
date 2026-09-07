import Stripe from "stripe";
import { PlanTier } from "@prisma/client";
import { stripePriceEnvFor } from "@/lib/plans";
import { absoluteUrl } from "@/lib/site";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Refusing to mock a payment.");
  }
  return new Stripe(key);
}

export async function createSubscriptionCheckout(input: {
  organizationId: string;
  customerEmail: string;
  stripeCustomerId?: string | null;
  tier: Exclude<PlanTier, "FREE">;
  interval: "month" | "year";
}) {
  const stripe = getStripe();
  const price = stripePriceEnvFor(input.tier, input.interval);
  if (!price) {
    throw new Error(
      `Missing Stripe price id for ${input.tier} ${input.interval}. Set STRIPE_PRICE_${input.tier}_${input.interval === "month" ? "MONTHLY" : "YEARLY"}.`,
    );
  }

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer: input.stripeCustomerId ?? undefined,
    customer_email: input.stripeCustomerId ? undefined : input.customerEmail,
    line_items: [{ price, quantity: 1 }],
    success_url: absoluteUrl("/settings?billing=success"),
    cancel_url: absoluteUrl("/pricing?billing=canceled"),
    client_reference_id: input.organizationId,
    metadata: {
      organizationId: input.organizationId,
      tier: input.tier,
      kind: "subscription",
    },
    subscription_data: {
      metadata: {
        organizationId: input.organizationId,
        tier: input.tier,
      },
    },
  });
}

export async function createCustomerPortalSession(stripeCustomerId: string) {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: absoluteUrl("/settings"),
  });
}

export async function createProposalPaymentCheckout(input: {
  organizationId: string;
  proposalId: string;
  publicId: string;
  amountCents: number;
  currency: string;
  title: string;
  customerEmail?: string;
}) {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountCents,
          product_data: { name: input.title },
        },
      },
    ],
    success_url: absoluteUrl(`/p/${input.publicId}?paid=1`),
    cancel_url: absoluteUrl(`/p/${input.publicId}?paid=0`),
    client_reference_id: input.proposalId,
    metadata: {
      organizationId: input.organizationId,
      proposalId: input.proposalId,
      kind: "proposal_payment",
    },
  });
}

export function constructWebhookEvent(rawBody: string, signature: string) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set. Refusing unverified events.");
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

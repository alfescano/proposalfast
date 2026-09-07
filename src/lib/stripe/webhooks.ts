import Stripe from "stripe";
import { PlanTier, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { PLAN_CATALOG } from "@/lib/plans";
import { writeAuditLog } from "@/lib/audit";

const STATUS_MAP: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
  incomplete: "INCOMPLETE",
  incomplete_expired: "CANCELED",
  trialing: "TRIALING",
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELED",
  unpaid: "UNPAID",
  paused: "PAUSED",
};

export async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "invoice.paid":
    case "invoice.payment_failed":
      break;
    default:
      break;
  }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  if (kind === "proposal_payment") {
    const proposalId = session.metadata?.proposalId;
    const organizationId = session.metadata?.organizationId;
    if (!proposalId || !organizationId) return;

    await prisma.payment.upsert({
      where: { stripeCheckoutSessionId: session.id },
      create: {
        organizationId,
        proposalId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        amountCents: session.amount_total ?? 0,
        currency: (session.currency ?? "usd").toUpperCase(),
        status: session.payment_status === "paid" ? "SUCCEEDED" : "PROCESSING",
        description: "Proposal checkout",
      },
      update: {
        status: session.payment_status === "paid" ? "SUCCEEDED" : "PROCESSING",
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      },
    });

    await writeAuditLog({
      organizationId,
      action: "payment.checkout_completed",
      entityType: "Payment",
      entityId: proposalId,
      metadata: { sessionId: session.id },
    });
    return;
  }

  if (session.mode === "subscription" && session.subscription) {
    // Subscription records are written from customer.subscription.* events.
    const organizationId =
      session.metadata?.organizationId ?? session.client_reference_id ?? undefined;
    if (organizationId && session.customer && typeof session.customer === "string") {
      await prisma.subscription.update({
        where: { organizationId },
        data: { stripeCustomerId: session.customer },
      });
    }
  }
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const organizationId = sub.metadata?.organizationId;
  if (!organizationId) return;

  const tier = (sub.metadata?.tier as PlanTier | undefined) ?? inferTier(sub);
  const plan = await prisma.plan.findUnique({ where: { tier } });
  if (!plan) return;

  const period = sub.items.data[0]?.current_period_end;
  const periodStart = sub.items.data[0]?.current_period_start;

  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      planId: plan.id,
      status: STATUS_MAP[sub.status] ?? "INCOMPLETE",
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : null,
      stripeSubscriptionId: sub.id,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: period ? new Date(period * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
    update: {
      planId: plan.id,
      status: STATUS_MAP[sub.status] ?? "INCOMPLETE",
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : null,
      stripeSubscriptionId: sub.id,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: period ? new Date(period * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    },
  });

  await writeAuditLog({
    organizationId,
    action: "subscription.upserted",
    entityType: "Subscription",
    entityId: sub.id,
    metadata: { status: sub.status, tier },
  });
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const organizationId = sub.metadata?.organizationId;
  if (!organizationId) return;
  const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
  if (!free) return;

  await prisma.subscription.update({
    where: { organizationId },
    data: {
      planId: free.id,
      status: "CANCELED",
      stripeSubscriptionId: sub.id,
      cancelAtPeriodEnd: false,
    },
  });
}

function inferTier(sub: Stripe.Subscription): PlanTier {
  const priceId = sub.items.data[0]?.price.id;
  for (const tier of Object.keys(PLAN_CATALOG) as PlanTier[]) {
    if (tier === "FREE") continue;
    if (
      process.env[`STRIPE_PRICE_${tier}_MONTHLY`] === priceId ||
      process.env[`STRIPE_PRICE_${tier}_YEARLY`] === priceId
    ) {
      return tier;
    }
  }
  return "PRO";
}

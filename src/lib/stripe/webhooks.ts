import Stripe from "stripe";
import { PlanTier, Prisma, SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isFoundingProPriceId } from "@/lib/founding-offer";
import { PLAN_CATALOG } from "@/lib/plans";
import { writeAuditLog } from "@/lib/audit";
import { mail, sendMail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { notifyWorkspace } from "@/lib/notifications";

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

export async function claimStripeEvent(event: { id: string; type: string }) {
  const existing = await prisma.stripeEvent.findUnique({ where: { id: event.id } });
  if (existing) return false;
  try {
    await prisma.stripeEvent.create({
      data: { id: event.id, type: event.type },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

export async function handleStripeEvent(event: Stripe.Event) {
  const claimed = await claimStripeEvent(event);
  if (!claimed) {
    return { duplicate: true as const };
  }

  try {
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
      case "invoice.payment_failed":
        await onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
    return { duplicate: false as const, type: event.type };
  } catch (error) {
    await prisma.stripeEvent.delete({ where: { id: event.id } }).catch(() => undefined);
    throw error;
  }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  if (kind === "proposal_payment") {
    const proposalId = session.metadata?.proposalId;
    const organizationId = session.metadata?.organizationId;
    if (!proposalId || !organizationId) return;

    const payment = await prisma.payment.upsert({
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
      entityId: payment.id,
      metadata: { sessionId: session.id, proposalId },
    });

    if (payment.status === "SUCCEEDED") {
      const proposal = await prisma.proposal.findUnique({
        where: { id: proposalId },
        include: {
          organization: { include: { members: { where: { role: "OWNER" }, include: { user: true } } } },
        },
      });
      const owner = proposal?.organization.members[0]?.user;
      if (owner?.email && proposal) {
        const amountLabel = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: payment.currency,
        }).format(payment.amountCents / 100);
        await sendMail(
          owner.email,
          mail.templates.paymentReceivedEmail({
            recipientName: owner.name ?? "there",
            title: proposal.title,
            amountLabel,
            url: absoluteUrl(`/proposals/${proposal.id}`),
          }),
        );
      }
      await notifyWorkspace({
        organizationId,
        type: "paid",
        title: "Payment received",
        body: `A client paid for “${proposal?.title ?? "a proposal"}”.`,
        actionUrl: proposal ? `/proposals/${proposal.id}` : "/dashboard",
      });
    }
    return;
  }

  if (session.mode === "subscription" && session.subscription) {
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

  const previous = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  });

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

  const becamePaid =
    (sub.status === "active" || sub.status === "trialing") &&
    previous?.plan.tier === "FREE" &&
    tier !== "FREE";

  if (becamePaid) {
    const owner = await orgOwner(organizationId);
    if (owner?.email) {
      await sendMail(
        owner.email,
        mail.templates.subscriptionStartedEmail({
          name: owner.name ?? "there",
          planName: PLAN_CATALOG[tier].name,
          settingsUrl: absoluteUrl("/settings"),
        }),
      );
    }
  }
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

  const owner = await orgOwner(organizationId);
  if (owner?.email) {
    await sendMail(owner.email, mail.templates.subscriptionCanceledEmail({
      name: owner.name ?? "there",
      settingsUrl: absoluteUrl("/settings"),
    }));
  }
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!subscription) return;

  const owner = await orgOwner(subscription.organizationId);
  if (owner?.email) {
    await sendMail(
      owner.email,
      mail.templates.subscriptionFailedEmail({
        name: owner.name ?? "there",
        settingsUrl: absoluteUrl("/settings"),
      }),
    );
  }
  await notifyWorkspace({
    organizationId: subscription.organizationId,
    type: "subscription_failed",
    title: "Subscription payment failed",
    body: "Stripe reported a failed subscription charge. Update the payment method in Settings.",
    actionUrl: "/settings",
  });
}

async function orgOwner(organizationId: string) {
  const member = await prisma.organizationMember.findFirst({
    where: { organizationId, role: "OWNER" },
    include: { user: true },
  });
  return member?.user ?? null;
}

function inferTier(sub: Stripe.Subscription): PlanTier {
  const priceId = sub.items.data[0]?.price.id;
  if (isFoundingProPriceId(priceId)) return "PRO";
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

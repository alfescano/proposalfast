import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";
import { claimStripeEvent, handleStripeEvent } from "./webhooks";

const prisma = new PrismaClient();

describe("Stripe webhook idempotency", () => {
  it("claims an event id only once", async () => {
    const id = `evt_test_${Date.now()}`;
    expect(await claimStripeEvent({ id, type: "checkout.session.completed" })).toBe(true);
    expect(await claimStripeEvent({ id, type: "checkout.session.completed" })).toBe(false);
  });

  it("does not apply a subscription event twice", async () => {
    const org = await prisma.organization.findFirst({
      where: { deletedAt: null },
      include: { subscription: { include: { plan: true } } },
    });
    expect(org).toBeTruthy();
    const pro = await prisma.plan.findUnique({ where: { tier: "PRO" } });
    expect(pro).toBeTruthy();

    const eventId = `evt_sub_${Date.now()}`;
    const now = Math.floor(Date.now() / 1000);
    const subscription = {
      id: `sub_${Date.now()}`,
      status: "active",
      customer: "cus_test_idem",
      cancel_at_period_end: false,
      metadata: { organizationId: org!.id, tier: "PRO" },
      items: {
        data: [
          {
            current_period_start: now,
            current_period_end: now + 30 * 24 * 3600,
            price: { id: "price_test" },
          },
        ],
      },
    };

    const event = {
      id: eventId,
      type: "customer.subscription.updated",
      data: { object: subscription },
    } as unknown as Stripe.Event;

    const first = await handleStripeEvent(event);
    const second = await handleStripeEvent(event);

    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);

    const updated = await prisma.subscription.findUnique({
      where: { organizationId: org!.id },
      include: { plan: true },
    });
    expect(updated?.plan.tier).toBe("PRO");
    expect(updated?.stripeSubscriptionId).toBe(subscription.id);

    if (org?.subscription) {
      await prisma.subscription.update({
        where: { organizationId: org.id },
        data: { planId: org.subscription.planId, stripeSubscriptionId: org.subscription.stripeSubscriptionId },
      });
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

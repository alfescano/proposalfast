import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/db";
import {
  evaluateFoundingOffer,
  foundingPriceId,
  type FoundingOfferState,
} from "@/lib/founding-offer";

type SubscriptionCounter = Pick<PrismaClient, "subscription">;

export async function countPaidProSubscriptions(db: SubscriptionCounter = defaultPrisma) {
  return db.subscription.count({
    where: {
      plan: { tier: "PRO" },
      status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] },
    },
  });
}

export async function getFoundingOfferState(
  now = new Date(),
  db: SubscriptionCounter = defaultPrisma,
): Promise<FoundingOfferState> {
  const claimed = await countPaidProSubscriptions(db);
  return evaluateFoundingOffer({
    now,
    claimed,
    priceConfigured: Boolean(foundingPriceId()),
  });
}

/** Marketing pages: if the count query fails, still show the date-based offer. */
export async function getFoundingOfferStateSafe(
  now = new Date(),
  db: SubscriptionCounter = defaultPrisma,
): Promise<FoundingOfferState> {
  try {
    return await getFoundingOfferState(now, db);
  } catch {
    return evaluateFoundingOffer({
      now,
      claimed: null,
      priceConfigured: Boolean(foundingPriceId()),
    });
  }
}

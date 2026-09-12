import { afterEach, describe, expect, it } from "vitest";
import {
  FOUNDING_PRO_CAP,
  FOUNDING_PRO_ENDS_AT,
  FOUNDING_PRO_MONTHLY_CENTS,
  FOUNDING_PRO_PRICE_ENV,
  evaluateFoundingOffer,
  foundingOfferCopy,
  foundingPriceId,
  isFoundingProPriceId,
  isFoundingWindowOpen,
  selectSubscriptionPriceId,
} from "./founding-offer";

const originalFoundingPrice = process.env[FOUNDING_PRO_PRICE_ENV];

afterEach(() => {
  if (originalFoundingPrice === undefined) delete process.env[FOUNDING_PRO_PRICE_ENV];
  else process.env[FOUNDING_PRO_PRICE_ENV] = originalFoundingPrice;
});

describe("founding offer window and cap", () => {
  it("is $29/month against $49 regular Pro, capped at 50", () => {
    expect(FOUNDING_PRO_MONTHLY_CENTS).toBe(2900);
    expect(FOUNDING_PRO_CAP).toBe(50);
    expect(FOUNDING_PRO_ENDS_AT.toISOString()).toBe("2026-10-01T07:00:00.000Z");
  });

  it("is open before the Pacific end of September 2026", () => {
    expect(isFoundingWindowOpen(new Date("2026-09-15T17:00:00.000Z"))).toBe(true);
    expect(isFoundingWindowOpen(new Date("2026-10-01T06:59:59.000Z"))).toBe(true);
    expect(isFoundingWindowOpen(new Date("2026-10-01T07:00:00.000Z"))).toBe(false);
  });

  it("closes when 50 paid Pro workspaces are claimed", () => {
    const open = evaluateFoundingOffer({
      now: new Date("2026-09-20T00:00:00.000Z"),
      claimed: 49,
      priceConfigured: true,
    });
    expect(open.active).toBe(true);
    expect(open.remaining).toBe(1);

    const full = evaluateFoundingOffer({
      now: new Date("2026-09-20T00:00:00.000Z"),
      claimed: 50,
      priceConfigured: true,
    });
    expect(full.active).toBe(false);
    expect(full.capOpen).toBe(false);
    expect(full.remaining).toBe(0);
  });

  it("stays date-active when the claimed count is unknown", () => {
    const state = evaluateFoundingOffer({
      now: new Date("2026-09-20T00:00:00.000Z"),
      claimed: null,
      priceConfigured: false,
    });
    expect(state.active).toBe(true);
    expect(state.remaining).toBeNull();
    expect(state.checkoutConfigured).toBe(false);
  });
});

describe("founding checkout price selection", () => {
  it("uses the founding env price for monthly Pro while the offer is active", () => {
    process.env[FOUNDING_PRO_PRICE_ENV] = "price_founding_test";
    const founding = evaluateFoundingOffer({
      now: new Date("2026-09-16T00:00:00.000Z"),
      claimed: 3,
      priceConfigured: true,
    });
    expect(
      selectSubscriptionPriceId({
        tier: "PRO",
        interval: "month",
        founding,
        regularPriceId: "price_1UEK4K05EDRKjSG1p7OWwW4M",
      }),
    ).toEqual({ priceId: "price_founding_test", founding: true });
  });

  it("refuses to start Founding checkout without STRIPE_PRICE_FOUNDING_PRO_MONTHLY", () => {
    delete process.env[FOUNDING_PRO_PRICE_ENV];
    const founding = evaluateFoundingOffer({
      now: new Date("2026-09-16T00:00:00.000Z"),
      claimed: 0,
      priceConfigured: false,
    });
    expect(() =>
      selectSubscriptionPriceId({
        tier: "PRO",
        interval: "month",
        founding,
        regularPriceId: "price_1UEK4K05EDRKjSG1p7OWwW4M",
      }),
    ).toThrow(/STRIPE_PRICE_FOUNDING_PRO_MONTHLY/);
  });

  it("uses regular Pro monthly after the offer ends, and yearly is never founding", () => {
    process.env[FOUNDING_PRO_PRICE_ENV] = "price_founding_test";
    const ended = evaluateFoundingOffer({
      now: new Date("2026-10-02T00:00:00.000Z"),
      claimed: 10,
      priceConfigured: true,
    });
    expect(
      selectSubscriptionPriceId({
        tier: "PRO",
        interval: "month",
        founding: ended,
        regularPriceId: "price_1UEK4K05EDRKjSG1p7OWwW4M",
      }),
    ).toEqual({ priceId: "price_1UEK4K05EDRKjSG1p7OWwW4M", founding: false });

    const active = evaluateFoundingOffer({
      now: new Date("2026-09-16T00:00:00.000Z"),
      claimed: 1,
      priceConfigured: true,
    });
    expect(
      selectSubscriptionPriceId({
        tier: "PRO",
        interval: "year",
        founding: active,
        regularPriceId: "price_pro_yearly",
      }),
    ).toEqual({ priceId: "price_pro_yearly", founding: false });
  });

  it("maps only the configured founding price id", () => {
    process.env[FOUNDING_PRO_PRICE_ENV] = "price_founding_test";
    expect(foundingPriceId()).toBe("price_founding_test");
    expect(isFoundingProPriceId("price_founding_test")).toBe(true);
    expect(isFoundingProPriceId("price_1UEK4K05EDRKjSG1p7OWwW4M")).toBe(false);
  });
});

describe("founding copy", () => {
  it("states the real limits without a fake countdown", () => {
    const copy = foundingOfferCopy(
      evaluateFoundingOffer({
        now: new Date("2026-09-16T00:00:00.000Z"),
        claimed: 12,
        priceConfigured: true,
      }),
    );
    expect(copy.headline).toContain("$29");
    expect(copy.limit).toContain("September 30, 2026");
    expect(copy.limit).toContain("38 of 50");
    expect(copy.lockIn).toContain("$49");
    expect(copy.yearly).toContain("Yearly Pro");
  });
});

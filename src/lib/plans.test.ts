import { describe, expect, it } from "vitest";
import { PLAN_CATALOG, UNLIMITED, formatLimit, isWithinLimit, remaining } from "./plans";

describe("plan limits", () => {
  it("defines Free / Pro / Business", () => {
    expect(Object.keys(PLAN_CATALOG)).toEqual(["FREE", "PRO", "BUSINESS"]);
    expect(PLAN_CATALOG.FREE.limits.maxProposals).toBe(5);
    expect(PLAN_CATALOG.BUSINESS.limits.maxProposals).toBe(UNLIMITED);
  });

  it("enforces numeric caps and treats -1 as unlimited", () => {
    expect(isWithinLimit(4, 5)).toBe(true);
    expect(isWithinLimit(5, 5)).toBe(false);
    expect(isWithinLimit(10_000, UNLIMITED)).toBe(true);
    expect(remaining(3, 5)).toBe(2);
    expect(formatLimit(UNLIMITED)).toBe("Unlimited");
  });
});

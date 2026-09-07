import { describe, expect, it } from "vitest";
import {
  acceptanceRate,
  buildFunnel,
  buildMonthlyTrends,
  lastNMonthKeys,
  monthKey,
  openRate,
} from "./analytics";

describe("analytics aggregates", () => {
  it("builds six month keys ending at now", () => {
    const now = new Date("2026-09-07T12:00:00Z");
    expect(lastNMonthKeys(3, now)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(monthKey(now)).toBe("2026-09");
  });

  it("rolls events and payments into monthly trends", () => {
    const now = new Date("2026-09-15T00:00:00Z");
    const points = buildMonthlyTrends({
      months: 2,
      now,
      events: [
        { type: "created", createdAt: new Date("2026-08-02T00:00:00Z") },
        { type: "sent", createdAt: new Date("2026-08-03T00:00:00Z") },
        { type: "viewed", createdAt: new Date("2026-08-04T00:00:00Z") },
        { type: "accepted", createdAt: new Date("2026-09-01T00:00:00Z") },
      ],
      payments: [{ amountCents: 25000, createdAt: new Date("2026-09-02T00:00:00Z") }],
    });
    expect(points).toHaveLength(2);
    expect(points[0]?.created).toBe(1);
    expect(points[0]?.sent).toBe(1);
    expect(points[1]?.accepted).toBe(1);
    expect(points[1]?.revenueCents).toBe(25000);
    expect(openRate(10, 4)).toBe(40);
    expect(acceptanceRate(0, 1)).toBe(0);
  });

  it("builds the signup-to-paid funnel", () => {
    const steps = buildFunnel({
      signups: 10,
      firstProposal: 6,
      sent: 4,
      opened: 3,
      accepted: 2,
      paid: 1,
    });
    expect(steps.map((step) => step.key)).toEqual([
      "signup",
      "first_proposal",
      "sent",
      "opened",
      "accepted",
      "paid",
    ]);
    expect(steps[5]?.value).toBe(1);
  });
});

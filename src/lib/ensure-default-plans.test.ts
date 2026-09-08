import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLAN_CATALOG } from "./plans";
import { ensureDefaultPlans } from "./ensure-default-plans";

const prisma = new PrismaClient();

describe("ensureDefaultPlans", () => {
  it("upserts FREE / PRO / BUSINESS without creating users", async () => {
    const first = await ensureDefaultPlans(prisma);
    const second = await ensureDefaultPlans(prisma);
    expect(first.plans.map((plan) => plan.tier).sort()).toEqual(["BUSINESS", "FREE", "PRO"]);
    expect(second.free.id).toBe(first.free.id);
    expect(second.free.maxProposals).toBe(PLAN_CATALOG.FREE.limits.maxProposals);
    expect(second.plans.find((plan) => plan.tier === "PRO")?.name).toBe(PLAN_CATALOG.PRO.name);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

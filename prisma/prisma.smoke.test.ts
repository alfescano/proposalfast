import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

describe("prisma smoke", () => {
  it("connects and can read plans after seed/migrate", async () => {
    await prisma.$queryRaw`SELECT 1`;
    const plans = await prisma.plan.findMany({ orderBy: { tier: "asc" } });
    expect(plans.length).toBeGreaterThanOrEqual(3);
    expect(plans.map((plan) => plan.tier).sort()).toEqual(["BUSINESS", "FREE", "PRO"]);
  });

  it("keeps organization members scoped to an organization", async () => {
    const member = await prisma.organizationMember.findFirst({
      include: { organization: true, user: true },
    });
    if (!member) {
      expect(member).toBeNull();
      return;
    }
    expect(member.organizationId).toBe(member.organization.id);
    expect(member.user.email).toBeTruthy();
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

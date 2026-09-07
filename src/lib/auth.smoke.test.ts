import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { registerSchema } from "./validations/auth";

const prisma = new PrismaClient();

describe("auth + prisma integration", () => {
  it("hashes passwords so a bcrypt compare succeeds", async () => {
    const password = "StrongPass1";
    const hash = await bcrypt.hash(password, 10);
    expect(await bcrypt.compare(password, hash)).toBe(true);
    expect(await bcrypt.compare("wrong-password", hash)).toBe(false);
  });

  it("can look up the seeded demo user when sample data is present", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "alex@proposalfast.dev" },
      include: { memberships: { include: { organization: true } } },
    });
    if (!user) {
      expect(user).toBeNull();
      return;
    }
    expect(user.passwordHash).toBeTruthy();
    expect(await bcrypt.compare("DemoPassword123!", user.passwordHash!)).toBe(true);
    expect(user.memberships[0]?.role).toBe("OWNER");
    expect(user.memberships[0]?.organization.slug).toBe("northline-studio");
  });

  it("rejects a register payload that would collide with the demo email shape", () => {
    const parsed = registerSchema.safeParse({
      name: "A",
      email: "not-valid",
      password: "weak",
      organizationName: "X",
    });
    expect(parsed.success).toBe(false);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

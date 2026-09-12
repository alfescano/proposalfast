import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { registerAccount } from "./auth/register-account";
import { changePasswordForUser } from "./auth/passwords";
import { resetPasswordWithToken, verifyEmailWithToken } from "./auth/email-password";
import { generateToken, sha256 } from "./crypto";

const prisma = new PrismaClient();
const suffix = nanoid(8);
const email = `lifecycle-${suffix.toLowerCase()}@auth.test`;

describe("auth lifecycle (register → verify → reset → change password)", () => {
  it("creates a workspace, verifies email, resets, then changes password", async () => {
    const registered = await registerAccount({
      name: "Lifecycle User",
      email,
      password: "FirstPassword1",
      organizationName: `Lifecycle Org ${suffix}`,
      acceptTerms: true,
    });
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;

    const createdUser = await prisma.user.findUnique({
      where: { email },
      include: { memberships: { include: { organization: { include: { subscription: true } } } } },
    });
    expect(createdUser?.emailVerified).toBeNull();
    expect(createdUser?.memberships[0]?.role).toBe("OWNER");
    expect(createdUser?.memberships[0]?.organization.subscription?.status).toBe("ACTIVE");

    const verified = await verifyEmailWithToken(registered.verifyToken, email);
    expect(verified.ok).toBe(true);
    const afterVerify = await prisma.user.findUnique({ where: { email } });
    expect(afterVerify?.emailVerified).toBeTruthy();

    const invalidVerify = await verifyEmailWithToken("not-a-real-token-value", email);
    expect(invalidVerify.ok).toBe(false);

    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: {
        userId: createdUser!.id,
        tokenHash: sha256(token),
        expires: new Date(Date.now() + 60_000),
      },
    });
    const reset = await resetPasswordWithToken(token, "SecondPassword1");
    expect(reset.ok).toBe(true);

    const afterReset = await prisma.user.findUnique({ where: { email } });
    expect(await bcrypt.compare("SecondPassword1", afterReset!.passwordHash!)).toBe(true);
    expect(await bcrypt.compare("FirstPassword1", afterReset!.passwordHash!)).toBe(false);

    const wrong = await changePasswordForUser({
      userId: createdUser!.id,
      currentPassword: "WrongPassword1",
      password: "ThirdPassword1",
    });
    expect(wrong.ok).toBe(false);

    const changed = await changePasswordForUser({
      userId: createdUser!.id,
      currentPassword: "SecondPassword1",
      password: "ThirdPassword1",
    });
    expect(changed.ok).toBe(true);

    const afterChange = await prisma.user.findUnique({ where: { email } });
    expect(await bcrypt.compare("ThirdPassword1", afterChange!.passwordHash!)).toBe(true);

    const audit = await prisma.auditLog.findMany({
      where: { userId: createdUser!.id, action: { in: ["user.registered", "user.password_reset", "user.password_changed"] } },
    });
    expect(audit.map((row) => row.action)).toEqual(
      expect.arrayContaining(["user.registered", "user.password_reset", "user.password_changed"]),
    );
  });
});

afterAll(async () => {
  await prisma.organization.deleteMany({ where: { slug: { contains: suffix.toLowerCase() } } });
  await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
  await prisma.$disconnect();
});

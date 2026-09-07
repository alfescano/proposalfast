import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";
import { resetPasswordSchema, verifyEmailSchema } from "@/lib/validations/auth";

export type AuthCoreResult = { ok: true } | { ok: false; error: string };

export async function verifyEmailWithToken(token: string, email: string): Promise<AuthCoreResult> {
  const parsed = verifyEmailSchema.safeParse({ token, email });
  if (!parsed.success) {
    return { ok: false, error: "This verification link is invalid." };
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token: sha256(parsed.data.token) },
  });

  if (!record || record.identifier !== parsed.data.email || record.expires < new Date()) {
    return { ok: false, error: "This verification link is invalid or expired." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email: parsed.data.email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    }),
  ]);

  return { ok: true };
}

export async function resetPasswordWithToken(token: string, password: string): Promise<AuthCoreResult> {
  const parsed = resetPasswordSchema.safeParse({ token, password });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const tokenHash = sha256(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expires < new Date()) {
    return { ok: false, error: "This reset link is invalid or expired." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  await writeAuditLog({
    userId: record.userId,
    action: "user.password_reset",
    entityType: "User",
    entityId: record.userId,
  });

  return { ok: true };
}

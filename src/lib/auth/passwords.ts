import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { changePasswordSchema } from "@/lib/validations/auth";

export type PasswordResult = { ok: true } | { ok: false; error: string };

export async function changePasswordForUser(input: {
  userId: string;
  currentPassword: string;
  password: string;
}): Promise<PasswordResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: input.currentPassword,
    password: input.password,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const user = await prisma.user.findFirst({
    where: { id: input.userId, deletedAt: null },
  });
  if (!user?.passwordHash) {
    return { ok: false, error: "This account uses a sign-in method that has no password." };
  }

  const matches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!matches) {
    return { ok: false, error: "Current password is incorrect." };
  }

  if (parsed.data.currentPassword === parsed.data.password) {
    return { ok: false, error: "Choose a different password than the one you use now." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
  await writeAuditLog({
    userId: user.id,
    action: "user.password_changed",
    entityType: "User",
    entityId: user.id,
  });
  return { ok: true };
}

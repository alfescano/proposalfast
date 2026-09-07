"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/crypto";
import { getEmailAdapter, mail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import { uniqueOrgSlug } from "@/lib/slug";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "@/lib/validations/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function guard(key: string, limit = 8) {
  assertRateLimit(key, limit, 60_000);
}

async function provisionWorkspace(input: {
  userId: string;
  name: string;
  organizationName: string;
}) {
  const slug = await uniqueOrgSlug(input.organizationName);
  const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
  if (!free) {
    throw new Error("Plans are not seeded. Run `npx prisma db seed`.");
  }

  const organization = await prisma.organization.create({
    data: {
      name: input.organizationName,
      slug,
      members: {
        create: { userId: input.userId, role: "OWNER" },
      },
      settings: {
        create: {
          businessName: input.organizationName,
          emailFromName: input.name,
        },
      },
      subscription: {
        create: {
          planId: free.id,
          status: "ACTIVE",
        },
      },
    },
  });

  return organization;
}

export async function registerAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      organizationName: formData.get("organizationName"),
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
    }

    await guard(`register:${parsed.data.email}`);

    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return { ok: false, error: "An account with that email already exists." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
      },
    });

    await provisionWorkspace({
      userId: user.id,
      name: parsed.data.name,
      organizationName: parsed.data.organizationName,
    });

    const token = generateToken();
    await prisma.verificationToken.create({
      data: {
        identifier: user.email,
        token: sha256(token),
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const verifyUrl = absoluteUrl(`/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`);
    const template = mail.templates.verificationEmail(parsed.data.name, verifyUrl);
    await getEmailAdapter().send({
      to: user.email,
      ...template,
    });
    await getEmailAdapter().send({
      to: user.email,
      ...mail.templates.welcomeEmail(parsed.data.name, absoluteUrl("/dashboard")),
    });

    await writeAuditLog({
      userId: user.id,
      action: "user.registered",
      entityType: "User",
      entityId: user.id,
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error(error);
    return { ok: false, error: "Could not create your account." };
  }
}

export async function loginAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  try {
    await guard(`login:${parsed.data.email}`, 10);
    const next = safeRedirectPath(formData.get("next"));
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: next,
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    if (error instanceof AuthError) {
      return { ok: false, error: "Email or password is incorrect." };
    }
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    return { ok: false, error: "Email or password is incorrect." };
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function forgotPasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  try {
    await guard(`forgot:${parsed.data.email}`, 5);
    const user = await prisma.user.findFirst({
      where: { email: parsed.data.email, deletedAt: null },
    });

    // Always succeed so we do not leak whether the email exists.
    if (user) {
      const token = generateToken();
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(token),
          expires: new Date(Date.now() + 1000 * 60 * 60),
        },
      });
      const resetUrl = absoluteUrl(`/reset-password?token=${token}`);
      const template = mail.templates.passwordResetEmail(user.name ?? "there", resetUrl);
      await getEmailAdapter().send({ to: user.email, ...template });
    }

    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Could not start a password reset." };
  }
}

export async function resetPasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const tokenHash = sha256(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
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

export async function verifyEmailAction(token: string, email: string): Promise<ActionResult> {
  const parsed = verifyEmailSchema.safeParse({ token, email });
  if (!parsed.success) {
    return { ok: false, error: "This verification link is invalid." };
  }

  const record = await prisma.verificationToken.findUnique({
    where: {
      token: sha256(parsed.data.token),
    },
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

function safeRedirectPath(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  if (next.startsWith("/invite/") || next === "/dashboard" || next.startsWith("/onboarding") || next === "/settings") {
    return next;
  }
  return "/dashboard";
}

export async function resendVerificationAction(): Promise<ActionResult> {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return { ok: false, error: "Sign in first." };
  }

  await guard(`reverify:${session.user.email}`, 3);
  const token = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: session.user.email,
      token: sha256(token),
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });
  const verifyUrl = absoluteUrl(
    `/verify-email?token=${token}&email=${encodeURIComponent(session.user.email)}`,
  );
  const template = mail.templates.verificationEmail(session.user.name ?? "there", verifyUrl);
  await getEmailAdapter().send({ to: session.user.email, ...template });
  return { ok: true };
}

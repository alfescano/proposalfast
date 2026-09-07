"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/crypto";
import { getEmailAdapter, mail } from "@/lib/email";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import { registerAccount } from "@/lib/auth/register-account";
import { changePasswordForUser } from "@/lib/auth/passwords";
import { resetPasswordWithToken, verifyEmailWithToken } from "@/lib/auth/email-password";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function guard(key: string, limit = 8) {
  await assertRateLimit(key, limit, 60_000);
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

    const created = await registerAccount(parsed.data);
    if (!created.ok) return created;

    const verifyUrl = absoluteUrl(
      `/verify-email?token=${created.verifyToken}&email=${encodeURIComponent(created.user.email)}`,
    );
    const template = mail.templates.verificationEmail(parsed.data.name, verifyUrl);
    await getEmailAdapter().send({
      to: created.user.email,
      ...template,
    });
    await getEmailAdapter().send({
      to: created.user.email,
      ...mail.templates.welcomeEmail(parsed.data.name, absoluteUrl("/dashboard")),
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
  return resetPasswordWithToken(parsed.data.token, parsed.data.password);
}

export async function verifyEmailAction(token: string, email: string): Promise<ActionResult> {
  return verifyEmailWithToken(token, email);
}

export async function changePasswordAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in first." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  try {
    await guard(`changepw:${session.user.id}`, 5);
    return changePasswordForUser({
      userId: session.user.id,
      currentPassword: parsed.data.currentPassword,
      password: parsed.data.password,
    });
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Could not change your password." };
  }
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

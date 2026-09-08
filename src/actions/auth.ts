"use server";

import { AuthError } from "next-auth";
import { signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/crypto";
import { mail } from "@/lib/email";
import { sendTransactionalEmail } from "@/lib/email/send";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";
import { absoluteUrl } from "@/lib/site";
import { registerAccount } from "@/lib/auth/register-account";
import { changePasswordForUser } from "@/lib/auth/passwords";
import { resetPasswordWithToken, verifyEmailWithToken } from "@/lib/auth/email-password";
import { completeCredentialsSignIn } from "@/lib/auth/complete-sign-in";
import { isNextRedirectError } from "@/lib/auth/next-redirect";
import {
  findActiveUserByEmail,
  sendVerificationEmail,
  sendVerificationForAccount,
} from "@/lib/auth/verification-email";
import {
  changePasswordSchema,
  emailSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function guard(key: string, limit = 8) {
  await assertRateLimit(key, limit, 60_000);
}

async function sendWelcomeBestEffort(name: string, email: string) {
  const template = mail.templates.welcomeEmail(name, absoluteUrl("/dashboard"));
  const sent = await sendTransactionalEmail({ to: email, ...template });
  if (!sent.ok) {
    console.error("[email] welcome send failed after register", sent.error);
  }
}

async function resendForExistingAccount(email: string): Promise<ActionResult> {
  const existing = await findActiveUserByEmail(email);
  if (!existing) {
    return { ok: false, error: "An account with that email already exists." };
  }
  if (existing.emailVerified) {
    return { ok: false, error: "An account with that email already exists. Log in." };
  }
  const sent = await sendVerificationForAccount({
    email: existing.email,
    name: existing.name,
  });
  if (!sent.ok) {
    return {
      ok: false,
      error: `An account with that email already exists, but the verification email could not be sent: ${sent.error}`,
    };
  }
  return {
    ok: true,
    message:
      "That email is already registered and still unverified. We sent a new verification link — check inbox and spam.",
  };
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
    if (!created.ok) {
      if ("code" in created && created.code === "EMAIL_TAKEN") {
        return resendForExistingAccount(parsed.data.email);
      }
      return created;
    }

    const sent = await sendVerificationEmail({
      email: created.user.email,
      name: parsed.data.name,
      token: created.verifyToken,
    });
    if (!sent.ok) {
      return {
        ok: false,
        error: `Your workspace was created, but we could not send the verification email: ${sent.error} Request a new link from the log-in page.`,
      };
    }

    await sendWelcomeBestEffort(parsed.data.name, created.user.email);

    return completeCredentialsSignIn({
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    if (isNextRedirectError(error)) throw error;
    console.error(error);
    return { ok: false, error: describePublicError(error, "Could not create your account.") };
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
    return await completeCredentialsSignIn({
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: next,
    });
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    if (isNextRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      return { ok: false, error: "Email or password is incorrect." };
    }
    console.error(error);
    return { ok: false, error: describePublicError(error, "Email or password is incorrect.") };
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
      const sent = await sendTransactionalEmail({ to: user.email, ...template });
      if (!sent.ok) {
        return { ok: false, error: `Could not send the reset email: ${sent.error}` };
      }
    }

    return {
      ok: true,
      message: "If that inbox is registered, a reset link is on its way.",
    };
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: describePublicError(error, "Could not start a password reset.") };
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

function describePublicError(error: unknown, fallback: string) {
  if (error instanceof Error && error.message && !/prisma|database|econn|secret/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}

export async function resendVerificationAction(): Promise<ActionResult> {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.email || !session.user.id) {
    return { ok: false, error: "Sign in first." };
  }

  await guard(`reverify:${session.user.email}`, 3);
  const sent = await sendVerificationForAccount({
    email: session.user.email,
    name: session.user.name,
  });
  if (!sent.ok) {
    return { ok: false, error: `Could not send the verification email: ${sent.error}` };
  }
  return { ok: true, message: "Verification email sent. Check inbox and spam." };
}

export async function requestVerificationEmailAction(
  _prev: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid email." };
  }

  try {
    await guard(`reverify:${parsed.data}`, 3);
    const user = await findActiveUserByEmail(parsed.data);
    if (user && !user.emailVerified) {
      const sent = await sendVerificationForAccount({
        email: user.email,
        name: user.name,
      });
      if (!sent.ok) {
        return { ok: false, error: `Could not send the verification email: ${sent.error}` };
      }
    }
    return {
      ok: true,
      message: "If that inbox is registered and unverified, a new verification link is on its way.",
    };
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: describePublicError(error, "Could not send a verification email.") };
  }
}

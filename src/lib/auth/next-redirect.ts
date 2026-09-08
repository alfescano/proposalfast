export function isNextRedirectError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: unknown }).digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

export function authJsErrorFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url, "http://local.invalid");
    const code = parsed.searchParams.get("error");
    if (!code) return null;
    return messageForAuthJsError(code);
  } catch {
    return null;
  }
}

export function messageForAuthJsError(code: string): string {
  switch (code) {
    case "CredentialsSignin":
      return "Email or password is incorrect.";
    case "AccessDenied":
      return "Access was denied for that sign-in attempt.";
    case "Configuration":
      return "Sign-in is misconfigured. Check AUTH_SECRET and AUTH_URL.";
    case "CallbackRouteError":
      return "Sign-in failed. Try again, or reset your password.";
    case "Verification":
      return "That verification link is invalid or expired.";
    default:
      return `Sign-in failed (${code}).`;
  }
}

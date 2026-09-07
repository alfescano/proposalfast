/**
 * Optional Sentry. No-op unless SENTRY_DSN is set. Never invents events.
 */
export function isSentryEnabled() {
  return Boolean(process.env.SENTRY_DSN);
}

export async function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export async function captureMessage(message: string) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureMessage(message);
}

import { captureException } from "@/lib/sentry";
import type { EmailMessage } from "./adapter";
import { getEmailAdapter } from "./index";

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

export function describeEmailError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Could not send email.";
}

export async function sendTransactionalEmail(message: EmailMessage): Promise<SendEmailResult> {
  try {
    const adapter = getEmailAdapter();
    const result = await adapter.send(message);
    return { ok: true, id: result.id };
  } catch (error) {
    const text = describeEmailError(error);
    console.error("[email] send failed", {
      to: message.to,
      subject: message.subject,
      providerError: text,
    });
    await captureException(error, { to: message.to, subject: message.subject });
    return { ok: false, error: text };
  }
}

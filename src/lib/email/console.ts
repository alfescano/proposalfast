import { randomUUID } from "node:crypto";
import type { EmailAdapter, EmailMessage } from "./adapter";

/**
 * Local-only transport. Used when RESEND_API_KEY is missing in development.
 * Production code paths must use ResendEmailAdapter — this adapter refuses NODE_ENV=production.
 */
export class ConsoleEmailAdapter implements EmailAdapter {
  readonly provider = "console";

  async send(message: EmailMessage) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "ConsoleEmailAdapter cannot send email in production. Set RESEND_API_KEY.",
      );
    }

    const id = `console_${randomUUID()}`;
    console.info("[email:console]", {
      id,
      to: message.to,
      subject: message.subject,
      text: message.text,
    });
    return { id };
  }
}

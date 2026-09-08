import { Resend } from "resend";
import type { EmailAdapter, EmailMessage } from "./adapter";
import { parseResendFromEmail } from "./from";

function resendErrorMessage(error: unknown): string {
  if (!error) return "Resend rejected the email.";
  if (typeof error === "string") return error;
  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Resend rejected the email.";
}

export class ResendEmailAdapter implements EmailAdapter {
  readonly provider = "resend";
  private client: Resend;
  private from: string;

  constructor(apiKey = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM_EMAIL) {
    if (!apiKey?.trim()) {
      throw new Error("RESEND_API_KEY is required to send email.");
    }
    const parsed = parseResendFromEmail(from);
    if (!parsed.ok) {
      throw new Error(parsed.error);
    }
    this.client = new Resend(apiKey.trim());
    this.from = parsed.from;
  }

  async send(message: EmailMessage) {
    const { data, error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      replyTo: message.replyTo,
      headers: message.headers,
    });

    if (error || !data) {
      throw new Error(resendErrorMessage(error));
    }

    return { id: data.id };
  }
}

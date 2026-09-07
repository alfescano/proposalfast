import { Resend } from "resend";
import type { EmailAdapter, EmailMessage } from "./adapter";

export class ResendEmailAdapter implements EmailAdapter {
  readonly provider = "resend";
  private client: Resend;
  private from: string;

  constructor(apiKey = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM_EMAIL) {
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required to send email.");
    }
    if (!from) {
      throw new Error("RESEND_FROM_EMAIL is required to send email.");
    }
    this.client = new Resend(apiKey);
    this.from = from;
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
      throw new Error(error?.message ?? "Resend rejected the email.");
    }

    return { id: data.id };
  }
}

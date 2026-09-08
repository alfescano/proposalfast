import type { EmailAdapter } from "./adapter";
import { ConsoleEmailAdapter } from "./console";
import { isProductionEmailRuntime, parseResendFromEmail } from "./from";
import { ResendEmailAdapter } from "./resend";
import * as templates from "./templates";

export function getEmailAdapter(): EmailAdapter {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (apiKey) {
    const from = parseResendFromEmail(process.env.RESEND_FROM_EMAIL);
    if (!from.ok) {
      throw new Error(from.error);
    }
    return new ResendEmailAdapter(apiKey, from.from);
  }
  if (isProductionEmailRuntime()) {
    throw new Error("RESEND_API_KEY is required in production.");
  }
  return new ConsoleEmailAdapter();
}

export const mail = {
  adapter: getEmailAdapter,
  templates,
};

export async function sendMail(
  to: string,
  template: { subject: string; html: string; text: string },
  replyTo?: string,
) {
  return getEmailAdapter().send({ to, replyTo, ...template });
}

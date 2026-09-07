import type { EmailAdapter } from "./adapter";
import { ConsoleEmailAdapter } from "./console";
import { ResendEmailAdapter } from "./resend";
import {
  passwordResetEmail,
  verificationEmail,
  contactNotificationEmail,
  proposalSentEmail,
} from "./templates";

export function getEmailAdapter(): EmailAdapter {
  if (process.env.RESEND_API_KEY) {
    return new ResendEmailAdapter();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("RESEND_API_KEY is required in production.");
  }
  return new ConsoleEmailAdapter();
}

export const mail = {
  adapter: getEmailAdapter,
  templates: {
    verificationEmail,
    passwordResetEmail,
    contactNotificationEmail,
    proposalSentEmail,
  },
};

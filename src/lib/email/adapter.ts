export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export interface EmailAdapter {
  readonly provider: string;
  send(message: EmailMessage): Promise<{ id: string }>;
}

import { siteConfig } from "@/lib/site";

function wrap(title: string, body: string) {
  return {
    html: `<!doctype html>
<html><body style="margin:0;background:#f6f1e8;font-family:Georgia,serif;color:#152033;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffdf8;border:1px solid #e4d9c5;border-radius:12px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;letter-spacing:.16em;text-transform:uppercase;font-size:11px;color:#8a7040;">ProposalFast</p>
          <h1 style="margin:0 0 16px;font-size:24px;">${title}</h1>
          ${body}
          <p style="margin:28px 0 0;font-size:12px;color:#6b7280;">Sent by ${siteConfig.name}. If you did not expect this, ignore it.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  };
}

export function verificationEmail(name: string, verifyUrl: string) {
  const text = `Hi ${name},\n\nConfirm your ProposalFast email:\n${verifyUrl}\n\nThis link expires in 24 hours.`;
  const { html } = wrap(
    "Confirm your email",
    `<p>Hi ${escapeHtml(name)},</p>
     <p>Confirm this address so we can send proposals and receipts from your workspace.</p>
     <p><a href="${verifyUrl}" style="display:inline-block;background:#152033;color:#fffdf8;text-decoration:none;padding:12px 18px;border-radius:8px;">Verify email</a></p>
     <p style="font-size:13px;color:#6b7280;">Or paste this URL: ${verifyUrl}</p>`,
  );
  return { subject: "Confirm your ProposalFast email", html, text };
}

export function passwordResetEmail(name: string, resetUrl: string) {
  const text = `Hi ${name},\n\nReset your ProposalFast password:\n${resetUrl}\n\nThis link expires in 60 minutes.`;
  const { html } = wrap(
    "Reset your password",
    `<p>Hi ${escapeHtml(name)},</p>
     <p>We received a request to reset your password. The link expires in 60 minutes.</p>
     <p><a href="${resetUrl}" style="display:inline-block;background:#152033;color:#fffdf8;text-decoration:none;padding:12px 18px;border-radius:8px;">Choose a new password</a></p>`,
  );
  return { subject: "Reset your ProposalFast password", html, text };
}

export function contactNotificationEmail(input: {
  name: string;
  email: string;
  company?: string;
  message: string;
}) {
  const text = `From: ${input.name} <${input.email}>\nCompany: ${input.company ?? "—"}\n\n${input.message}`;
  const { html } = wrap(
    "New contact form message",
    `<p><strong>${escapeHtml(input.name)}</strong> (${escapeHtml(input.email)})</p>
     <p>Company: ${escapeHtml(input.company || "—")}</p>
     <p style="white-space:pre-wrap;">${escapeHtml(input.message)}</p>`,
  );
  return { subject: `Contact: ${input.name}`, html, text };
}

export function proposalSentEmail(input: {
  clientName: string;
  senderName: string;
  title: string;
  portalUrl: string;
}) {
  const text = `${input.senderName} sent you a proposal: ${input.title}\nView it here: ${input.portalUrl}`;
  const { html } = wrap(
    input.title,
    `<p>Hi ${escapeHtml(input.clientName)},</p>
     <p>${escapeHtml(input.senderName)} sent you a proposal.</p>
     <p><a href="${input.portalUrl}" style="display:inline-block;background:#152033;color:#fffdf8;text-decoration:none;padding:12px 18px;border-radius:8px;">Open proposal</a></p>`,
  );
  return { subject: `Proposal: ${input.title}`, html, text };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

import { siteConfig } from "@/lib/site";

function wrap(title: string, body: string) {
  return {
    html: `<!doctype html>
<html><body style="margin:0;background:#f6f1e8;font-family:Georgia,'Times New Roman',serif;color:#152033;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fffdf8;border:1px solid #e4d9c5;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#152033;padding:20px 32px;">
          <p style="margin:0;letter-spacing:.2em;text-transform:uppercase;font-size:11px;color:#c9a227;">ProposalFast</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;">${title}</h1>
          ${body}
          <p style="margin:28px 0 0;font-size:12px;color:#6b7280;">Sent by ${siteConfig.name}. If you did not expect this, ignore it.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  };
}

function button(href: string, label: string) {
  return `<p><a href="${href}" style="display:inline-block;background:#152033;color:#fffdf8;text-decoration:none;padding:12px 18px;border-radius:8px;">${label}</a></p>`;
}

export function welcomeEmail(name: string, dashboardUrl: string) {
  const text = `Hi ${name},\n\nYour ProposalFast workspace is ready.\n${dashboardUrl}`;
  const { html } = wrap(
    "Your workspace is ready",
    `<p>Hi ${escapeHtml(name)},</p>
     <p>You can draft from facts you already have, send a client portal, and collect a signature and payment. The model will not invent a fee.</p>
     ${button(dashboardUrl, "Open the dashboard")}`,
  );
  return { subject: "Welcome to ProposalFast", html, text };
}

export function verificationEmail(name: string, verifyUrl: string) {
  const text = `Hi ${name},\n\nConfirm your ProposalFast email:\n${verifyUrl}\n\nThis link expires in 24 hours.`;
  const { html } = wrap(
    "Confirm your email",
    `<p>Hi ${escapeHtml(name)},</p>
     <p>Confirm this address so we can send proposals and receipts from your workspace.</p>
     ${button(verifyUrl, "Verify email")}
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
     ${button(resetUrl, "Choose a new password")}`,
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
     <p>${escapeHtml(input.senderName)} sent you a proposal to review, sign, and — if enabled — pay.</p>
     ${button(input.portalUrl, "Open proposal")}`,
  );
  return { subject: `Proposal: ${input.title}`, html, text };
}

export function proposalOpenedEmail(input: {
  ownerName: string;
  clientName: string;
  title: string;
  dashboardUrl: string;
}) {
  const text = `${input.clientName} opened “${input.title}”.`;
  const { html } = wrap(
    "Your proposal was opened",
    `<p>Hi ${escapeHtml(input.ownerName)},</p>
     <p>${escapeHtml(input.clientName)} opened <em>${escapeHtml(input.title)}</em>.</p>
     ${button(input.dashboardUrl, "See activity")}`,
  );
  return { subject: `Opened: ${input.title}`, html, text };
}

export function proposalAcceptedEmail(input: {
  ownerName: string;
  clientName: string;
  title: string;
  dashboardUrl: string;
}) {
  const text = `${input.clientName} accepted “${input.title}”.`;
  const { html } = wrap(
    "Proposal accepted",
    `<p>Hi ${escapeHtml(input.ownerName)},</p>
     <p>${escapeHtml(input.clientName)} accepted <em>${escapeHtml(input.title)}</em>.</p>
     ${button(input.dashboardUrl, "Open workspace")}`,
  );
  return { subject: `Accepted: ${input.title}`, html, text };
}

export function proposalSignedEmail(input: {
  recipientName: string;
  signerName: string;
  title: string;
  url: string;
}) {
  const text = `${input.signerName} signed “${input.title}”.`;
  const { html } = wrap(
    "Proposal signed",
    `<p>Hi ${escapeHtml(input.recipientName)},</p>
     <p>${escapeHtml(input.signerName)} signed <em>${escapeHtml(input.title)}</em>. The signed version is locked.</p>
     ${button(input.url, "View record")}`,
  );
  return { subject: `Signed: ${input.title}`, html, text };
}

export function paymentReceivedEmail(input: {
  recipientName: string;
  title: string;
  amountLabel: string;
  url: string;
}) {
  const text = `Payment received for “${input.title}”: ${input.amountLabel}`;
  const { html } = wrap(
    "Payment received",
    `<p>Hi ${escapeHtml(input.recipientName)},</p>
     <p>${escapeHtml(input.amountLabel)} posted for <em>${escapeHtml(input.title)}</em>.</p>
     ${button(input.url, "See payment")}`,
  );
  return { subject: `Paid: ${input.title}`, html, text };
}

export function subscriptionStartedEmail(input: {
  name: string;
  planName: string;
  settingsUrl: string;
}) {
  const text = `Your ${input.planName} subscription is active.`;
  const { html } = wrap(
    `${input.planName} is active`,
    `<p>Hi ${escapeHtml(input.name)},</p>
     <p>Stripe confirmed your ${escapeHtml(input.planName)} plan. Limits update from that webhook — not from a button click.</p>
     ${button(input.settingsUrl, "Manage billing")}`,
  );
  return { subject: `ProposalFast ${input.planName}`, html, text };
}

export function subscriptionCanceledEmail(input: { name: string; settingsUrl: string }) {
  const text = `Your paid ProposalFast subscription was canceled. The workspace returns to Free at period end.`;
  const { html } = wrap(
    "Subscription canceled",
    `<p>Hi ${escapeHtml(input.name)},</p>
     <p>Stripe reported a cancellation. The workspace falls back to the Free plan.</p>
     ${button(input.settingsUrl, "Billing settings")}`,
  );
  return { subject: "ProposalFast subscription canceled", html, text };
}

export function followUpEmail(input: {
  clientName: string;
  senderName: string;
  title: string;
  portalUrl: string;
}) {
  const text = `Reminder from ${input.senderName}: ${input.title}\n${input.portalUrl}`;
  const { html } = wrap(
    `Still open: ${input.title}`,
    `<p>Hi ${escapeHtml(input.clientName)},</p>
     <p>${escapeHtml(input.senderName)} asked us to send a single reminder — only because they opted in.</p>
     ${button(input.portalUrl, "Open proposal")}`,
  );
  return { subject: `Reminder: ${input.title}`, html, text };
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

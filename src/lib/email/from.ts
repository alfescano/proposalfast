/**
 * Resend `from` must be a bare address or `Display Name <address>`.
 * The domain has to be verified in Resend or sends are rejected and never appear
 * in the dashboard as delivered.
 */
const NAMED = /^(.+?)\s*<([^<>\s]+@[^<>\s]+)>$/;
const BARE = /^([^<>\s]+@[^<>\s]+)$/;

export function parseResendFromEmail(
  raw: string | undefined | null,
): { ok: true; from: string } | { ok: false; error: string } {
  const value = (raw ?? "").trim();
  if (!value) {
    return {
      ok: false,
      error:
        "RESEND_FROM_EMAIL is required. Use noreply@proposalfast.ai or ProposalFast <noreply@proposalfast.ai> on a verified Resend domain.",
    };
  }
  if (/[\r\n]/.test(value)) {
    return { ok: false, error: "RESEND_FROM_EMAIL cannot contain line breaks." };
  }
  if (NAMED.test(value) || BARE.test(value)) {
    return { ok: true, from: value };
  }
  return {
    ok: false,
    error:
      "RESEND_FROM_EMAIL must look like noreply@proposalfast.ai or ProposalFast <noreply@proposalfast.ai>.",
  };
}

export function isProductionEmailRuntime() {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

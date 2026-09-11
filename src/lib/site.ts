export const siteConfig = {
  name: "ProposalFast",
  domain: "proposalfast.ai",
  tagline: "Win the work. Faster.",
  description:
    "ProposalFast is the AI-powered proposal workspace for agencies and consultants. Draft from your facts, send a branded client portal, track every view, collect an e-signature, and take payment — without inventing a single number.",
  // Production: set NEXT_PUBLIC_APP_URL=https://proposalfast.ai (Auth.js, OG, emails, Stripe redirects).
  url: process.env.NEXT_PUBLIC_APP_URL || "https://proposalfast.ai",
  email: "support@proposalfast.ai",
  supportEmail: "support@proposalfast.ai",
  twitter: "@proposalfast",
};

export function absoluteUrl(path = "/") {
  const base = siteConfig.url.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

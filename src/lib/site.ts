export const siteConfig = {
  name: "ProposalFast",
  domain: "proposalfast.com",
  tagline: "Win the work. Faster.",
  description:
    "ProposalFast is the AI-powered proposal workspace for agencies and consultants. Draft from your facts, send a branded client portal, track every view, collect an e-signature, and take payment — without inventing a single number.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:43127",
  email: "hello@proposalfast.com",
  supportEmail: "support@proposalfast.com",
  twitter: "@proposalfast",
};

export function absoluteUrl(path = "/") {
  const base = siteConfig.url.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

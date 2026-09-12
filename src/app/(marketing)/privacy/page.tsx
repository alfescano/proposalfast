import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How ProposalFast collects, uses, and retains account and proposal data.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="September 12, 2026">
      <p>
        This policy describes how {siteConfig.name} (“we”) handles personal data when you use{" "}
        {siteConfig.domain}.
      </p>
      <h2>Data we collect</h2>
      <ul>
        <li>Account data: name, email, password hash, and optional Google account identifiers.</li>
        <li>Workspace data: organization profile, clients, proposals, signatures, and payment metadata.</li>
        <li>Usage data: audit logs, proposal views (IP hashed), and AI token counts.</li>
        <li>Billing data processed by Stripe. We do not store full card numbers.</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        We use this data to operate the product, send transactional email, enforce plan limits, and
        secure the service. We do not sell personal data.
      </p>
      <h2>Processors</h2>
      <p>
        Depending on configuration: Vercel (hosting), Neon or Supabase (Postgres), Auth.js sessions,
        Resend (email), OpenAI (generation), Stripe (payments), and S3-compatible storage for files.
      </p>
      <p>
        Stripe processes subscription billing and proposal Checkout payments. When you use AI
        drafting, the proposal content you supply (briefs, facts, client names, and draft text) is
        sent to our AI provider (currently OpenAI) to generate outlines and drafts.
      </p>
      <h2>Retention</h2>
      <p>
        Workspace records persist until you delete them or close the account. Soft-deleted records
        remain until a purge job removes them. You can request export or deletion at{" "}
        {siteConfig.supportEmail}.
      </p>
      <h2>Contact</h2>
      <p>{siteConfig.email}</p>
    </LegalPage>
  );
}

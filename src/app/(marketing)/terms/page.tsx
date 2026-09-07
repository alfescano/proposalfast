import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms that govern use of the ProposalFast application.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="September 7, 2026">
      <p>
        By creating a {siteConfig.name} account you agree to these terms. If you use the product on
        behalf of an organization, you represent that you can bind that organization.
      </p>
      <h2>The service</h2>
      <p>
        We provide software to draft, send, track, sign, and collect payment on client proposals.
        AI output is generated from the facts you supply. You remain responsible for reviewing every
        proposal before it is sent, including pricing and legal language.
      </p>
      <h2>Accounts and workspaces</h2>
      <p>
        You must provide an accurate email and keep credentials confidential. Owners control seats
        and billing. We may suspend accounts that abuse the AI quota, probe other tenants, or
        attempt to bypass plan limits.
      </p>
      <h2>Fees</h2>
      <p>
        Paid plans are billed through Stripe. Subscription status in the app follows Stripe webhook
        events. Proposal payments from your clients are processed to the Stripe account you connect.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Do not use the service to send unlawful content, scrape other customers, or feed the model
        data you do not have the right to process.
      </p>
      <h2>Contact</h2>
      <p>{siteConfig.email}</p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "When ProposalFast refunds subscription charges.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund policy" updated="September 7, 2026">
      <p>
        Subscription charges are billed by Stripe. If you cancel, access continues through the end
        of the paid period. We do not prorate unused AI generations.
      </p>
      <h2>When we refund</h2>
      <p>
        If a charge was duplicated, or you were billed after a verified cancellation, email{" "}
        {siteConfig.supportEmail} within 14 days. Approved refunds are issued to the original
        payment method through Stripe.
      </p>
      <h2>Client proposal payments</h2>
      <p>
        Payments your clients make on a proposal are your charges. Refund those from your Stripe
        dashboard. ProposalFast does not take custody of those funds beyond Stripe’s processing.
      </p>
    </LegalPage>
  );
}

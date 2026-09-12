import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "When ProposalFast refunds subscription charges.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund policy" updated="September 12, 2026">
      <p>
        This policy covers fees you pay ProposalFast for a subscription. Paid plans are billed by
        Stripe. Subscription status in the app follows Stripe. You manage payment methods, invoices,
        and cancellation in the Stripe customer portal from workspace settings.
      </p>

      <h2>Cancellation</h2>
      <p>
        If you cancel, you keep access at the paid plan through the end of the current billing
        period. After that, the workspace returns to the Free plan. We do not prorate unused time
        or unused AI generations when you cancel or downgrade.
      </p>

      <h2>When we refund a ProposalFast charge</h2>
      <p>
        Email {siteConfig.supportEmail} within 14 days if a ProposalFast subscription charge was
        duplicated or clearly erroneous (for example, you were billed again after a verified
        cancellation that should have stopped the renewal). Include the workspace email and Stripe
        invoice or receipt. If we confirm the error, we refund the original payment method through
        Stripe.
      </p>
      <p>
        We do not refund because you did not use unused AI generations, changed your mind after a
        successful charge, or did not win a client engagement. Trials, if offered, are controlled
        by the Stripe Checkout session at signup.
      </p>

      <h2>Client proposal payments</h2>
      <p>
        When a client pays a proposal, that is your charge to your client — not a ProposalFast
        subscription fee. You are responsible for refunding your client through Stripe for that
        payment. ProposalFast is not a bank or escrow and does not refund your clients for you.
      </p>

      <h2>Chargebacks and disputes</h2>
      <p>
        If you dispute a ProposalFast subscription charge with your bank or card network instead of
        contacting us first, or if we see repeated chargebacks or disputes on proposal payments, we
        may review, suspend, or terminate the account. Ask {siteConfig.supportEmail} first when a
        charge looks wrong.
      </p>
    </LegalPage>
  );
}

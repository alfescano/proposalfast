import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "Terms that govern use of the ProposalFast application.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="September 12, 2026">
      <p>
        These Terms of Service (“Terms”) are an agreement between you and {siteConfig.name}{" "}
        (“ProposalFast,” “we,” “us”). They govern access to {siteConfig.domain} and the ProposalFast
        application. Creating an account, checking the signup agreement box, or using the service
        means you accept these Terms. If you do not agree, do not use the service.
      </p>
      <p>
        If you use ProposalFast on behalf of a company or other organization, you represent that you
        have authority to bind that organization, and “you” includes that organization.
      </p>

      <h2>The service</h2>
      <p>
        ProposalFast is software for drafting, sending, tracking, signing, and collecting payment on
        client proposals. Features depend on your plan. We may change, limit, or discontinue
        features as we operate the product.
      </p>
      <p>
        Some drafting uses artificial intelligence. AI output is generated from the facts and text
        you supply. It can be incomplete, outdated, or wrong. Fees, prices, dates, scope, legal
        language, and other numbers in a draft are your placeholders until you review and approve
        them. You must review every proposal before it is sent. You are solely responsible for what
        you send to your clients.
      </p>

      <h2>No sales or revenue warranty</h2>
      <p>
        We do not promise that you will win work, close deals, collect payment, or earn any amount
        of revenue. ProposalFast is a drafting and workflow tool, not a sales guarantee.
      </p>
      <p>
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW,
        WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. We do not warrant that the service will be
        uninterrupted, error-free, or free of harmful components, or that AI output will be
        accurate or fit for a legal or commercial purpose.
      </p>

      <h2>Accounts and workspaces</h2>
      <p>
        You must provide an accurate email and keep credentials confidential. You are responsible
        for activity under your account and workspace. Owners control seats and billing. Notify us
        promptly at {siteConfig.supportEmail} if you believe an account has been compromised.
      </p>

      <h2>Your content and responsibility</h2>
      <p>
        You retain ownership of content you submit (briefs, facts, client data, proposal text,
        files, branding, and similar materials). You grant us a limited license to host, process,
        display, and transmit that content as needed to operate the service, including sending it
        to subprocessors such as our AI provider and Stripe.
      </p>
      <p>
        You represent that you have the rights needed to submit that content and to contact the
        people you upload. You are responsible for your proposals, client relationships, pricing,
        contracts, tax, and compliance. ProposalFast is not a party to agreements between you and
        your clients and does not practice law or provide legal, tax, or accounting advice.
      </p>

      <h2>Indemnity</h2>
      <p>
        You will defend and indemnify ProposalFast and its officers, employees, and contractors
        against claims, losses, and reasonable legal fees arising from: (a) your proposals, client
        communications, or professional services; (b) content you submit or send; (c) your use of
        the service in violation of these Terms or applicable law; or (d) a dispute between you and
        a client, including payment, refund, or chargeback disputes on a proposal.
      </p>

      <h2>Acceptable use</h2>
      <p>You may not:</p>
      <ul>
        <li>use the service for unlawful, fraudulent, harassing, or infringing content;</li>
        <li>probe, scan, or access other customers’ workspaces or data;</li>
        <li>bypass plan limits, rate limits, or security controls;</li>
        <li>abuse AI quota, automate scraping, or overload the service;</li>
        <li>submit data you do not have the right to process; or</li>
        <li>resell the service or use it to build a competing product except as allowed by law.</li>
      </ul>
      <p>
        We may suspend or restrict an account immediately if we reasonably believe it is abusing
        the service, creating legal or security risk, or failing to pay. We may also review
        accounts involved in chargebacks or payment disputes.
      </p>

      <h2>Fees, Stripe, and subscriptions</h2>
      <p>
        Paid ProposalFast plans are billed through Stripe. Subscription status in the app follows
        verified Stripe webhook events. You authorize Stripe to charge the payment method you
        provide for recurring fees until you cancel. Taxes may apply. Plan limits are enforced on
        the server.
      </p>
      <p>
        You can change or cancel a paid subscription in the Stripe customer portal from workspace
        settings. Cancellation stops future renewals. You keep paid-plan access through the end of
        the current billing period. We do not prorate unused time or unused AI generations. See
        the refund policy for how we handle duplicate or erroneous charges.
      </p>
      <p>
        Promotional or founding prices, when offered, apply only to new Checkout sessions while
        that offer is open (for Founding Pro: through September 30, 2026, 11:59 p.m. Pacific, or
        the first 50 paid Pro workspaces, whichever comes first). They do not change an existing
        subscription’s Stripe price unless you change plans in the customer portal. Founding and
        regular paid plans follow the same cancellation and refund rules.
      </p>
      <p>
        When your client pays a proposal, that charge is your transaction with that client — not a
        ProposalFast subscription fee. Stripe processes the payment. ProposalFast is not a bank,
        escrow, or custodian of those funds and is not the seller of your professional services.
        You are responsible for refunds, disputes, chargebacks, and tax on those client payments.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROPOSALFAST WILL NOT BE LIABLE FOR INDIRECT,
        INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS,
        LOST REVENUE, LOST BUSINESS, LOST DATA, OR THE COST OF SUBSTITUTE SERVICES, EVEN IF WE WERE
        ADVISED SUCH DAMAGES WERE POSSIBLE.
      </p>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY FOR ALL CLAIMS RELATING TO THE
        SERVICE IS LIMITED TO THE FEES YOU PAID TO PROPOSALFAST FOR THE SERVICE IN THE TWELVE (12)
        MONTHS BEFORE THE CLAIM. IF YOU PAID NO FEES IN THAT PERIOD, OUR TOTAL LIABILITY IS ONE
        HUNDRED U.S. DOLLARS (US $100). These limits do not apply to liability that cannot be
        limited under applicable law.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the service and close your account at any time from settings, subject
        to the refund policy for already-billed periods. We may suspend or terminate access if you
        materially breach these Terms, fail to pay, or create risk to the service or other users.
        After termination we may delete or anonymize workspace data on our ordinary retention
        schedule. Provisions that should survive (including ownership, indemnity, disclaimers,
        limitation of liability, and governing law) remain in effect.
      </p>

      <h2>Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. The “Last updated” date will change when we
        do. Material changes may also be noted in the product or by email to the account address.
        Continued use after the updated Terms take effect constitutes acceptance. If you do not
        agree, stop using the service and close the account.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of California, United States, without
        regard to conflict-of-law rules. You and ProposalFast agree to the exclusive jurisdiction
        of the state and federal courts located in California, except that we may seek injunctive
        relief in any jurisdiction to protect the service or other users.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms: {siteConfig.supportEmail}
      </p>
    </LegalPage>
  );
}

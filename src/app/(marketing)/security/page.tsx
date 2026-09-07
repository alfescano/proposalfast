import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security",
  description: "How ProposalFast isolates organizations, verifies webhooks, and stores secrets.",
};

export default function SecurityPage() {
  return (
    <LegalPage title="Security" updated="September 7, 2026">
      <h2>Organization isolation</h2>
      <p>
        Every client, proposal, file, payment, and AI usage row carries an organizationId. Server
        actions load the caller’s membership first and refuse records from other workspaces.
      </p>
      <h2>Access control</h2>
      <p>Roles are Owner, Admin, Member, and Viewer. Billing changes require Owner.</p>
      <h2>Authentication</h2>
      <p>
        Passwords are hashed with bcrypt (bcryptjs, cost 12). Sessions are signed JWT cookies from
        Auth.js. Email verification and password reset tokens are stored as SHA-256 hashes.
      </p>
      <h2>Payments</h2>
      <p>
        Stripe webhook signatures are verified before any subscription or payment row is written.
        Unsigned events are rejected.
      </p>
      <h2>Report an issue</h2>
      <p>{siteConfig.supportEmail}</p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "Cookies and similar storage used by ProposalFast.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie policy" updated="September 7, 2026">
      <p>
        ProposalFast uses cookies that are required to run the product. We do not run third-party
        advertising pixels on marketing pages.
      </p>
      <h2>Essential cookies</h2>
      <ul>
        <li>Auth.js session cookies (httpOnly, Secure in production, SameSite=Lax).</li>
        <li>CSRF tokens used during sign-in.</li>
      </ul>
      <h2>Local development</h2>
      <p>
        On localhost the Secure flag may be omitted so the session cookie works over HTTP. Production
        deployments must use HTTPS.
      </p>
    </LegalPage>
  );
}

import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/contact-form";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to the ProposalFast team about your workspace, billing, or security questions.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2">
      <div>
        <p className="text-xs tracking-[0.2em] text-accent uppercase">Contact</p>
        <h1 className="mt-3 font-heading text-5xl">Write to us with a real question</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Billing, security reviews, and workspace issues go to {siteConfig.email}. This form uses
          the Resend adapter — in local development it logs to the server console if no API key is
          set.
        </p>
      </div>
      <ContactForm />
    </main>
  );
}

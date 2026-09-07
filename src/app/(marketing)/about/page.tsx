import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: "ProposalFast exists so agencies and consultants can send honest proposals faster.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">About</p>
      <h1 className="mt-3 font-heading text-5xl">A proposal tool that refuses to bluff</h1>
      <div className="mt-8 space-y-5 text-base leading-7 text-muted-foreground">
        <p>
          {siteConfig.name} is built for independent consultants and small agencies who already know
          the work, the fee, and the timeline — and need a faster way to put that on paper, get it
          in front of a client, and collect a signature and a payment.
        </p>
        <p>
          We do not publish invented customer counts or fabricated case studies. The product
          constraint is the same as the marketing constraint: if a fact is missing, it stays a
          placeholder.
        </p>
        <p>
          The company operates the {siteConfig.domain} product. Support is{" "}
          {siteConfig.supportEmail}.
        </p>
      </div>
    </main>
  );
}

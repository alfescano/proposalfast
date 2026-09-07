import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLAN_CATALOG, formatLimit, formatPrice } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ProposalFast plans: Free, Pro, and Business. Limits are enforced on the server. Stripe is the source of truth for paid subscriptions.",
};

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">Pricing</p>
      <h1 className="mt-3 font-heading text-5xl">Simple seats. Honest limits.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Paid plans are created in Stripe Checkout. The app never marks an organization Pro because
        a button was clicked — only because a verified webhook said so.
      </p>
      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {Object.values(PLAN_CATALOG).map((plan) => (
          <article
            key={plan.tier}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-6",
              plan.highlighted ? "border-accent shadow-lg" : "border-border",
            )}
          >
            <p className="text-xs tracking-[0.16em] text-accent uppercase">{plan.name}</p>
            <p className="mt-3 font-heading text-4xl">
              {formatPrice(plan.monthlyPriceCents)}
              <span className="text-base font-sans text-muted-foreground">
                {plan.monthlyPriceCents === 0 ? "" : "/mo"}
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              <li>Proposals: {formatLimit(plan.limits.maxProposals)}</li>
              <li>Clients: {formatLimit(plan.limits.maxClients)}</li>
              <li>Seats: {formatLimit(plan.limits.maxMembers)}</li>
              <li>AI drafts / month: {formatLimit(plan.limits.maxAiGenerationsPerMonth)}</li>
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-4 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: plan.highlighted ? "default" : "outline", size: "lg" }),
                "mt-8 h-11 px-4",
              )}
            >
              {plan.tier === "FREE" ? "Create a free workspace" : "Start and upgrade later"}
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Yearly Pro is {formatPrice(PLAN_CATALOG.PRO.yearlyPriceCents)}. Yearly Business is{" "}
        {formatPrice(PLAN_CATALOG.BUSINESS.yearlyPriceCents)}. See the{" "}
        <Link href="/refund-policy" className="underline">
          refund policy
        </Link>
        .
      </p>
    </main>
  );
}

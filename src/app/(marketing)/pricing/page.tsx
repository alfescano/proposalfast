import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLAN_CATALOG, formatLimit, formatPrice } from "@/lib/plans";
import { foundingOfferCopy } from "@/lib/founding-offer";
import { getFoundingOfferStateSafe } from "@/lib/founding-offer-server";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "ProposalFast plans: Free, Pro, and Business. Founding Pro is $29/month for early adopters through September 30, 2026 or the first 50 Pro workspaces.",
};

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const founding = await getFoundingOfferStateSafe();
  const copy = foundingOfferCopy(founding);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">Pricing</p>
      <h1 className="mt-3 font-heading text-5xl">Simple seats. Honest limits.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Paid plans are created in Stripe Checkout. The app never marks an organization Pro because
        a button was clicked — only because a verified webhook said so.
      </p>

      {founding.active ? (
        <aside className="mt-8 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4">
          <p className="text-xs tracking-[0.16em] text-accent uppercase">{copy.badge}</p>
          <p className="mt-2 font-heading text-2xl">{copy.headline}</p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.limit}</p>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{copy.lockIn}</p>
        </aside>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          The Founding Pro launch price has ended. New Pro checkouts are{" "}
          {formatPrice(PLAN_CATALOG.PRO.monthlyPriceCents)}/month.
        </p>
      )}

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {Object.values(PLAN_CATALOG).map((plan) => {
          const showFounding = founding.active && plan.tier === "PRO";
          return (
            <article
              key={plan.tier}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6",
                plan.highlighted ? "border-accent shadow-lg" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs tracking-[0.16em] text-accent uppercase">
                  {showFounding ? "Founding Pro" : plan.name}
                </p>
                {showFounding ? (
                  <span className="rounded-full border border-accent/40 px-2 py-0.5 text-[11px] tracking-wide text-accent uppercase">
                    Early adopter
                  </span>
                ) : null}
              </div>
              <p className="mt-3 font-heading text-4xl">
                {formatPrice(showFounding ? founding.monthlyPriceCents : plan.monthlyPriceCents)}
                <span className="text-base font-sans text-muted-foreground">
                  {plan.monthlyPriceCents === 0 ? "" : "/mo"}
                </span>
              </p>
              {showFounding ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="line-through">{formatPrice(founding.regularMonthlyPriceCents)}/mo</span>
                  {" "}
                  regular Pro after this offer
                </p>
              ) : null}
              <p className="mt-2 text-sm text-muted-foreground">
                {showFounding
                  ? "Same Pro plan, locked at the founding monthly price while you stay subscribed."
                  : plan.description}
              </p>
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
                {plan.tier === "FREE"
                  ? "Create a free workspace"
                  : showFounding
                    ? "Start Founding Pro"
                    : "Start and upgrade later"}
              </Link>
              {showFounding ? (
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Create a workspace, then choose Founding monthly in Settings → Billing. Already
                  subscribed?{" "}
                  <Link href="/login?next=/settings" className="underline">
                    Open billing
                  </Link>
                  .
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        {founding.active ? `${copy.yearly} ` : null}
        Yearly Pro is {formatPrice(PLAN_CATALOG.PRO.yearlyPriceCents)}. Yearly Business is{" "}
        {formatPrice(PLAN_CATALOG.BUSINESS.yearlyPriceCents)}. Founding and regular paid plans
        follow the same{" "}
        <Link href="/refund-policy" className="underline">
          refund policy
        </Link>
        .
      </p>
    </main>
  );
}

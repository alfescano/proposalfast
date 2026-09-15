import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { type Comparison, COMPARISONS } from "@/lib/marketing/comparisons";
import { siteConfig } from "@/lib/site";
import { formatPrice } from "@/lib/plans";
import {
  FOUNDING_PRO_MONTHLY_CENTS,
  isFoundingWindowOpen,
} from "@/lib/founding-offer";
import { cn } from "@/lib/utils";

const forWhom =
  "ProposalFast is for agencies and consultants who want a fact-bound AI draft, then one client path: branded portal with Q&A, e-sign, and Stripe.";

const differentiators = [
  "Fact-bound AI — fees and timelines stay placeholders until you confirm them",
  "One client path — draft → portal → track views → e-sign → Stripe",
  "Free to start; Founding Pro while the early-team offer is open",
];

export function ComparePage({ comparison }: { comparison: Comparison }) {
  const foundingOpen = isFoundingWindowOpen();
  const others = COMPARISONS.filter((item) => item.slug !== comparison.slug);

  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-accent text-xs tracking-[0.2em] uppercase">Compare</p>
      <h1 className="font-heading mt-3 text-5xl text-balance">
        {comparison.title}
      </h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-7">
        {forWhom}
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="border-accent bg-card rounded-2xl border p-6 shadow-sm">
          <p className="text-accent text-xs tracking-[0.16em] uppercase">
            {siteConfig.name}
          </p>
          <h2 className="font-heading mt-2 text-2xl">
            Early, focused, fact-bound
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            We draft from the facts you provide. The client opens a portal, asks
            questions, signs, and pays with Stripe. We do not claim to match{" "}
            {comparison.competitor} on every dimension — they have been in
            market longer, with a broader feature set.
          </p>
          <ul className="mt-5 space-y-2 text-sm leading-6">
            {differentiators.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="text-accent mt-0.5 size-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
        <article className="border-border bg-card rounded-2xl border p-6">
          <p className="text-accent text-xs tracking-[0.16em] uppercase">
            {comparison.competitor}
          </p>
          <h2 className="font-heading mt-2 text-2xl">
            More mature, broader toolkit
          </h2>
          <p className="text-muted-foreground mt-3 text-sm leading-6">
            {comparison.theyAre}
          </p>
          <p className="text-muted-foreground mt-4 text-sm leading-6">
            Current plans and add-ons live on{" "}
            <a
              href={comparison.competitorSite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline"
            >
              {comparison.competitorSiteLabel}
            </a>
            . We do not invent their prices or a feature-by-feature scorecard.
          </p>
        </article>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <section className="border-border bg-card rounded-2xl border p-6">
          <h2 className="font-heading text-2xl">
            Choose {comparison.competitor} if
          </h2>
          <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            {comparison.chooseThemIf.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="border-border bg-card rounded-2xl border p-6">
          <h2 className="font-heading text-2xl">Choose {siteConfig.name} if</h2>
          <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            {comparison.chooseUsIf.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      <section className="border-border mt-12 rounded-2xl border bg-[#152033] px-6 py-10 text-[#f6f1e8] sm:px-10">
        <h2 className="font-heading text-3xl">Try ProposalFast free</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
          Start on Free.{" "}
          {foundingOpen ? (
            <>
              Founding Pro is {formatPrice(FOUNDING_PRO_MONTHLY_CENTS)}/month
              for early teams while the offer lasts.
            </>
          ) : (
            <>Upgrade to Pro when you are closing proposals weekly.</>
          )}{" "}
          No fake logos, no invented competitor prices.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-5",
            )}
          >
            Start free
          </Link>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 border-white/20 bg-transparent px-5 text-[#f6f1e8] hover:bg-white/10 hover:text-white",
            )}
          >
            {foundingOpen ? "See Founding Pro" : "See pricing"}
          </Link>
        </div>
      </section>

      <nav className="mt-12" aria-label="Other comparisons">
        <p className="text-accent text-xs tracking-[0.18em] uppercase">
          Also compare
        </p>
        <ul className="mt-4 flex flex-wrap gap-3 text-sm">
          <li>
            <Link
              href="/compare"
              className="hover:text-foreground underline underline-offset-4"
            >
              All comparisons
            </Link>
          </li>
          {others.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/compare/${item.slug}`}
                className="hover:text-foreground underline underline-offset-4"
              >
                vs {item.competitor}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}

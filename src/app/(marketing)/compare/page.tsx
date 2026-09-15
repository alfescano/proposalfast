import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { COMPARE_INDEX, COMPARISONS } from "@/lib/marketing/comparisons";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compare",
  description: COMPARE_INDEX.description,
};

export default function CompareIndexPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-accent text-xs tracking-[0.2em] uppercase">Compare</p>
      <h1 className="font-heading mt-3 text-5xl text-balance">
        {COMPARE_INDEX.title}
      </h1>
      <p className="text-muted-foreground mt-4 max-w-2xl text-lg leading-7">
        {siteConfig.name} is an AI proposal workspace for agencies and
        consultants: fact-bound drafts, a branded client portal with Q&A,
        e-sign, and Stripe in one path. PandaDoc, Qwilr, and Proposify are more
        mature products with broader feature sets. These pages are honest
        contrast — not a smear, and not a fake scorecard.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {COMPARISONS.map((item) => (
          <article
            key={item.slug}
            className="border-border bg-card flex flex-col rounded-2xl border p-6"
          >
            <p className="text-accent text-xs tracking-[0.16em] uppercase">
              vs {item.competitor}
            </p>
            <h2 className="font-heading mt-2 text-2xl">{item.title}</h2>
            <p className="text-muted-foreground mt-3 flex-1 text-sm leading-6">
              {item.indexBlurb}
            </p>
            <Link
              href={`/compare/${item.slug}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "mt-6 h-11 px-4",
              )}
            >
              Read the comparison
            </Link>
          </article>
        ))}
      </div>

      <p className="text-muted-foreground mt-10 max-w-2xl text-sm leading-6">
        We do not invent competitor pricing or unpublished feature lists. Check
        each vendor’s site for current plans. Then try {siteConfig.name} free if
        the focused path fits.
      </p>
      <Link
        href="/register"
        className={cn(buttonVariants({ size: "lg" }), "mt-6 h-11 px-5")}
      >
        Start free
      </Link>
    </main>
  );
}

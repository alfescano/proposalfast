import type { Metadata } from "next";
import Link from "next/link";
import { FounderQuote } from "@/components/marketing/founder-quote";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About",
  description:
    "ProposalFast is an AI proposal workspace built by Alfredo Escano for agencies and consultants who are tired of messy Docs, buried questions, and invented numbers.",
};

const principles = [
  {
    title: "Fact-bound by default",
    body: "AI drafts from what you provide. Fees and timelines stay placeholders until you set them.",
  },
  {
    title: "One client path",
    body: "Draft → portal → track views → e-sign → Stripe. Questions stay on the proposal, not buried in email.",
  },
  {
    title: "Free to start",
    body: "Create a workspace on Free. Upgrade when you’re closing proposals weekly.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-accent text-xs tracking-[0.2em] uppercase">About</p>
      <h1 className="font-heading mt-3 text-5xl text-balance">
        Built by someone tired of watching good work lose to a messy Doc.
      </h1>
      <div className="text-muted-foreground mt-8 space-y-5 text-base leading-7">
        <p>
          {siteConfig.name} is an AI proposal workspace for agencies and
          consultants. It drafts from your facts, keeps fees as placeholders
          until you fill them, then carries the deal through a branded portal —
          questions, e-sign, and Stripe — without inventing numbers.
        </p>
      </div>

      <section className="mt-14">
        <h2 className="font-heading text-3xl">Why it exists</h2>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          Most proposal tools help you write faster. The hard part is everything
          after: client questions buried in email, a separate e-sign tool,
          chasing payment. {siteConfig.founder.name} built {siteConfig.name}{" "}
          after watching teams paste last quarter’s PDF and hope the fee was
          still right.
        </p>
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-3xl">How we work</h2>
        <div className="mt-6 space-y-4">
          {principles.map((item) => (
            <article
              key={item.title}
              className="border-border bg-card rounded-2xl border p-6"
            >
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="font-heading text-3xl">Who’s behind it</h2>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          {siteConfig.founder.name} — {siteConfig.founder.role}. Building{" "}
          {siteConfig.name} in public (Product Hunt, Indie Hackers,{" "}
          <a
            href={siteConfig.twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline"
          >
            X {siteConfig.twitter}
          </a>
          ). Support:{" "}
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="text-foreground underline"
          >
            {siteConfig.supportEmail}
          </a>
          .
        </p>
      </section>

      <FounderQuote className="mt-10" />

      <section className="mt-14">
        <h2 className="font-heading text-3xl">Contact</h2>
        <p className="text-muted-foreground mt-4 text-base leading-7">
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="text-foreground underline"
          >
            {siteConfig.supportEmail}
          </a>
          {" · "}
          <a href={siteConfig.url} className="text-foreground underline">
            {siteConfig.domain}
          </a>
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
          >
            Start free
          </Link>
          <Link
            href="/compare"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 px-5",
            )}
          >
            Compare tools
          </Link>
        </div>
      </section>
    </main>
  );
}

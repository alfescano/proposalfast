import Link from "next/link";
import { Check, FileText, PenLine, Signature, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import {
  FOUNDING_PRO_MONTHLY_CENTS,
  isFoundingWindowOpen,
} from "@/lib/founding-offer";
import { PLAN_CATALOG, formatPrice } from "@/lib/plans";
import { ProductDemo } from "@/components/marketing/product-demo";
import { TrustSection } from "@/components/marketing/trust-section";

const steps = [
  {
    title: "Collect the facts",
    body: "Paste the brief, the fee, and the dates you already have. Missing pieces stay visible as [PLACEHOLDER] — the model is not allowed to invent them.",
  },
  {
    title: "Edit the draft",
    body: "Every section is yours to rewrite. Versions stay on the proposal so you can see what went to the client.",
  },
  {
    title: "Send, sign, get paid",
    body: "The client opens a public portal. You see the views. They sign and pay through Stripe Checkout — no second tool.",
  },
];

const features = [
  {
    icon: FileText,
    title: "Proposal workspace",
    body: "Create, version, and brand proposals inside one organization — never across tenants.",
  },
  {
    icon: PenLine,
    title: "Fact-bound AI",
    body: "Extract → outline → generate → QC → score. Invented prices and case studies are rejected.",
  },
  {
    icon: Signature,
    title: "E-sign",
    body: "Consent text, signer identity, and a stored signature artifact. Not a screenshot of a pen.",
  },
  {
    icon: Wallet,
    title: "Stripe payments",
    body: "Subscriptions and per-proposal Checkout. Webhooks write the subscription — the UI does not.",
  },
];

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#c9a22722,transparent_40%),radial-gradient(circle_at_bottom_left,#15203314,transparent_35%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="text-accent text-xs tracking-[0.22em] uppercase">
              Proposal software for people who invoice
            </p>
            <h1 className="font-heading mt-4 text-5xl leading-[1.05] text-balance sm:text-6xl">
              Client proposals that close — without invented numbers.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-7">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
              >
                Create a workspace
              </Link>
              <Link
                href="/templates"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 px-5",
                )}
              >
                Browse templates
              </Link>
            </div>
            <ul className="text-muted-foreground mt-8 space-y-2 text-sm">
              {[
                "Email and password auth, with Google optional",
                "Plan limits enforced on the server",
                "Client portal at /p/[id] — no account required",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Check className="text-accent mt-0.5 size-4" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <ProposalPreview />
        </div>
      </section>

      <section className="border-border bg-card border-y">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title}>
              <p className="text-accent text-xs tracking-[0.18em] uppercase">
                0{index + 1}
              </p>
              <h2 className="font-heading mt-3 text-2xl">{step.title}</h2>
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-heading text-4xl">
          The path from brief to paid work
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="border-border bg-card rounded-2xl border p-6"
            >
              <feature.icon className="text-accent size-5" />
              <h3 className="font-heading mt-4 text-2xl">{feature.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <ProductDemo />

      <TrustSection foundingActive={isFoundingWindowOpen()} />

      <section className="border-border border-t bg-[#152033] text-[#f6f1e8]">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-4xl">
              Start on Free. Upgrade when the work does.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              {PLAN_CATALOG.FREE.name} includes{" "}
              {PLAN_CATALOG.FREE.limits.maxProposals} proposals.
              {isFoundingWindowOpen() ? (
                <>
                  {" "}
                  Founding Pro is {formatPrice(FOUNDING_PRO_MONTHLY_CENTS)}
                  /month through September 30, 2026, or the first 50 Pro
                  workspaces — whichever comes first. Regular Pro is{" "}
                  {formatPrice(PLAN_CATALOG.PRO.monthlyPriceCents)}/month after
                  that.
                </>
              ) : (
                <>
                  {" "}
                  Pro is {formatPrice(PLAN_CATALOG.PRO.monthlyPriceCents)} /
                  month.
                </>
              )}{" "}
              Stripe is the source of truth after you subscribe.
            </p>
          </div>
          <Link
            href="/pricing"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-5",
            )}
          >
            Compare plans
          </Link>
        </div>
      </section>
    </main>
  );
}

function ProposalPreview() {
  return (
    <div className="rounded-[28px] border border-[#d7c9ae] bg-[#fffdf8] p-5 shadow-[0_24px_80px_-32px_rgba(21,32,51,0.45)]">
      <div className="flex items-center justify-between text-[11px] tracking-[0.16em] text-[#8a7040] uppercase">
        <span>Sample portal preview</span>
        <span>Not a customer story</span>
      </div>
      <div className="mt-5 border-t border-[#efe3cf] pt-5">
        <p className="text-muted-foreground text-xs">
          Example workspace → example client
        </p>
        <h3 className="font-heading mt-2 text-3xl">Brand system, Q3</h3>
        <p className="text-muted-foreground mt-4 text-sm leading-6">
          Scope, timeline, and fee come from your brief. The gold marks are
          placeholders the writer still has to fill — not numbers the model
          guessed.
        </p>
        <div className="mt-6 space-y-3">
          {["Scope of work", "Investment [PLACEHOLDER: fee]", "Signature"].map(
            (row) => (
              <div
                key={row}
                className="flex items-center justify-between rounded-xl bg-[#f6f1e8] px-4 py-3 text-sm"
              >
                <span>{row}</span>
                <span className="text-accent text-xs tracking-wide uppercase">
                  Section
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

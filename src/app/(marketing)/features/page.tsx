import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Features",
  description:
    "ProposalFast covers the full proposal lifecycle: create, edit, send, track, e-sign, and collect payment — with AI that is not allowed to invent facts.",
};

const groups = [
  {
    title: "Write",
    items: [
      { name: "Fact-bound generation", body: "A five-stage pipeline extracts only what you provided, then QC flags invented prices, stats, or case studies." },
      { name: "Templates", body: "System templates for consulting, retainers, software, workshops, and audits. Your org can add its own." },
      { name: "Versions", body: "Each generation or major edit stores a ProposalVersion so you know what the client saw." },
    ],
  },
  {
    title: "Send and track",
    items: [
      { name: "Public client portal", body: "Every proposal has a /p/[publicId] URL. Clients do not need an account to read it." },
      { name: "View events", body: "Opens, duration, and referrer are stored as ProposalView and ProposalEvent records." },
      { name: "Follow-ups", body: "Scheduled reminders go through Inngest and the Resend adapter — not a fake inbox." },
    ],
  },
  {
    title: "Close",
    items: [
      { name: "E-sign", body: "Signer name, email, consent text, IP hash, and a stored signature artifact." },
      { name: "Proposal payments", body: "Stripe Checkout for the fee on the proposal. Webhooks mark Payment rows succeeded." },
      { name: "Subscriptions", body: "Free / Pro / Business with server-enforced limits. Customer Portal for changes." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">Product</p>
      <h1 className="mt-3 font-heading text-5xl">Everything between the brief and the wire</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        ProposalFast is one workspace: CRM, editor, portal, signature, and payment. The AI is a
        writer with rules, not a researcher that makes up proof.
      </p>
      <div className="mt-14 space-y-12">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="font-heading text-3xl">{group.title}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {group.items.map((item) => (
                <article key={item.name} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "mt-12 h-11 px-5")}>
        Start on Free
      </Link>
    </main>
  );
}

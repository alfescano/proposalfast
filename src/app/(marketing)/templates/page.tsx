import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SYSTEM_TEMPLATES } from "@/lib/templates/catalog";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Proposal templates for consulting, retainers, software builds, workshops, and audits. Placeholders mark missing facts instead of inventing them.",
};

export default function TemplatesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">Templates</p>
      <h1 className="mt-3 font-heading text-5xl">Start from a structure, not a hallucination</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
        Every system template already contains [PLACEHOLDER] tokens for fees, dates, and legal
        language. Fill them, or leave them visible so the client never reads a made-up number.
      </p>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {SYSTEM_TEMPLATES.map((template) => (
          <article key={template.name} className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs tracking-[0.16em] text-accent uppercase">{template.industry}</p>
            <h2 className="mt-2 font-heading text-2xl">{template.name}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{template.description}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              {template.sections.length} sections · {template.category}
            </p>
          </article>
        ))}
      </div>
      <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "mt-10 h-11 px-5")}>
        Use a template in your workspace
      </Link>
    </main>
  );
}

import type { Metadata } from "next";
import { requireOrg } from "@/lib/org";
import { PLAN_CATALOG, formatLimit } from "@/lib/plans";
import { SettingsForm } from "@/components/app/settings-form";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireOrg();
  const tier = ctx.plan?.tier ?? "FREE";
  const limits = PLAN_CATALOG[tier].limits;

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-xs tracking-[0.18em] text-accent uppercase">Settings</p>
      <h1 className="mt-2 font-heading text-4xl">Workspace</h1>
      <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-sm">
        <p>
          Plan: <strong>{ctx.plan?.name ?? "Free"}</strong> ({ctx.organization.subscription?.status})
        </p>
        <p className="mt-2 text-muted-foreground">
          Limits — proposals {formatLimit(limits.maxProposals)}, clients{" "}
          {formatLimit(limits.maxClients)}, seats {formatLimit(limits.maxMembers)}, AI{" "}
          {formatLimit(limits.maxAiGenerationsPerMonth)}/mo. Paid upgrades require Stripe price IDs
          and a webhook. Customer Portal opens only when a Stripe customer exists.
        </p>
      </div>
      <div className="mt-8">
        <SettingsForm
          defaults={{
            businessName: ctx.organization.settings?.businessName || ctx.organization.name,
            industry: ctx.organization.industry ?? "",
            website: ctx.organization.website ?? "",
            tagline: ctx.organization.settings?.tagline ?? "",
            defaultCurrency: ctx.organization.settings?.defaultCurrency ?? "USD",
            brandColor: ctx.organization.settings?.brandColor ?? "#152033",
          }}
        />
      </div>
    </div>
  );
}

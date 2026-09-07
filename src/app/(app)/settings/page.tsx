import type { Metadata } from "next";
import { requireOrg } from "@/lib/org";
import { PLAN_CATALOG, formatLimit } from "@/lib/plans";
import { SettingsForm } from "@/components/app/settings-form";
import { BillingPanel } from "@/components/app/billing-panel";
import { FollowUpToggle } from "@/components/app/follow-up-toggle";
import { canManageBilling } from "@/lib/rbac";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireOrg();
  const tier = ctx.plan?.tier ?? "FREE";
  const limits = PLAN_CATALOG[tier].limits;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Settings</p>
        <h1 className="mt-2 font-heading text-4xl">Workspace</h1>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 text-sm">
        <p>
          Plan: <strong>{ctx.plan?.name ?? "Free"}</strong> ({ctx.organization.subscription?.status})
        </p>
        <p className="mt-2 text-muted-foreground">
          Limits — proposals {formatLimit(limits.maxProposals)}, clients{" "}
          {formatLimit(limits.maxClients)}, seats {formatLimit(limits.maxMembers)}, AI{" "}
          {formatLimit(limits.maxAiGenerationsPerMonth)}/mo. Enforced on the server.
        </p>
      </div>
      <BillingPanel
        currentTier={tier}
        status={ctx.organization.subscription?.status ?? "ACTIVE"}
        canBill={canManageBilling(ctx.role)}
        hasCustomer={Boolean(ctx.organization.subscription?.stripeCustomerId)}
      />
      <FollowUpToggle enabled={ctx.organization.settings?.followUpOptIn ?? false} />
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
  );
}

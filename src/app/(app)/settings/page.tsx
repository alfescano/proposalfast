import type { Metadata } from "next";
import { requireOrg } from "@/lib/org";
import { PLAN_CATALOG, formatLimit } from "@/lib/plans";
import { SettingsForm } from "@/components/app/settings-form";
import { BillingPanel } from "@/components/app/billing-panel";
import { FollowUpToggle } from "@/components/app/follow-up-toggle";
import { TeamPanel } from "@/components/app/team-panel";
import { NotificationPrefs } from "@/components/app/notification-prefs";
import { PrivacyPanel } from "@/components/app/privacy-panel";
import { canManageBilling, canManageMembers, canManageSettings } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireOrg();
  const tier = ctx.plan?.tier ?? "FREE";
  const limits = PLAN_CATALOG[tier].limits;
  const manageSettings = canManageSettings(ctx.role);
  const manageTeam = canManageMembers(ctx.role);

  const [members, invites] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: ctx.organization.id },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organizationInvite.findMany({
      where: {
        organizationId: ctx.organization.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

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
          Your role is <strong>{ctx.role}</strong>. Limits — proposals {formatLimit(limits.maxProposals)},
          clients {formatLimit(limits.maxClients)}, seats {formatLimit(limits.maxMembers)}, AI{" "}
          {formatLimit(limits.maxAiGenerationsPerMonth)}/mo. Enforced on the server.
        </p>
      </div>
      {canManageBilling(ctx.role) ? (
        <BillingPanel
          currentTier={tier}
          status={ctx.organization.subscription?.status ?? "ACTIVE"}
          canBill={canManageBilling(ctx.role)}
          hasCustomer={Boolean(ctx.organization.subscription?.stripeCustomerId)}
        />
      ) : null}
      {manageSettings ? (
        <>
          <FollowUpToggle enabled={ctx.organization.settings?.followUpOptIn ?? false} />
          <NotificationPrefs
            defaults={{
              notifyOpened: ctx.organization.settings?.notifyOpened ?? true,
              notifyAccepted: ctx.organization.settings?.notifyAccepted ?? true,
              notifySigned: ctx.organization.settings?.notifySigned ?? true,
              notifyPaid: ctx.organization.settings?.notifyPaid ?? true,
              notifySubscription: ctx.organization.settings?.notifySubscription ?? true,
              notifyComment: ctx.organization.settings?.notifyComment ?? true,
            }}
          />
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
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Workspace profile, billing, and alert preferences are limited to Admin and Owner.
        </p>
      )}
      <TeamPanel
        canManage={manageTeam}
        isOwner={ctx.role === "OWNER"}
        members={members.map((member) => ({
          id: member.id,
          role: member.role,
          email: member.user.email,
          name: member.user.name,
          isSelf: member.userId === ctx.user.id,
        }))}
        invites={invites.map((invite) => ({
          id: invite.id,
          email: invite.email,
          role: invite.role,
          expiresAt: invite.expiresAt,
        }))}
      />
      {ctx.role === "OWNER" ? <PrivacyPanel /> : null}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { EmptyState } from "@/components/states/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatLimit } from "@/lib/plans";
import { PLAN_CATALOG } from "@/lib/plans";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const ctx = await requireOrg();
  const orgId = ctx.organization.id;

  const [proposals, clients, views, sent, pendingSignatures] = await Promise.all([
    prisma.proposal.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.client.count({ where: { organizationId: orgId, deletedAt: null } }),
    prisma.proposalView.count({ where: { proposal: { organizationId: orgId } } }),
    prisma.proposal.count({
      where: { organizationId: orgId, deletedAt: null, status: { in: ["SENT", "VIEWED"] } },
    }),
    prisma.signature.count({
      where: { status: "PENDING", proposal: { organizationId: orgId, deletedAt: null } },
    }),
  ]);

  const recent = await prisma.proposal.findMany({
    where: { organizationId: orgId, deletedAt: null },
    include: { client: true },
    orderBy: { updatedAt: "desc" },
    take: 6,
  });

  const tier = ctx.plan?.tier ?? "FREE";
  const limits = PLAN_CATALOG[tier].limits;
  const verified = Boolean(ctx.user.emailVerified);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Dashboard</p>
          <h1 className="mt-2 font-heading text-4xl">{ctx.organization.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Counts below are live from your workspace — not placeholders.
          </p>
        </div>
        <Link href="/proposals/new" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
          New proposal
        </Link>
      </div>

      {!verified ? (
        <p className="mt-6 rounded-xl border border-accent/40 bg-card px-4 py-3 text-sm">
          Confirm {ctx.user.email} so proposal sends and receipts leave from your address. Check
          your inbox (or the server log in local development).
        </p>
      ) : null}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Proposals" value={proposals} hint={`${formatLimit(limits.maxProposals)} on ${tier}`} />
        <Stat label="Clients" value={clients} hint={`${formatLimit(limits.maxClients)} on ${tier}`} />
        <Stat label="Portal views" value={views} hint={`${sent} currently out`} />
        <Stat label="Pending signatures" value={pendingSignatures} hint="E-sign queue" />
      </div>

      <section className="mt-10">
        <h2 className="font-heading text-2xl">Recent proposals</h2>
        {recent.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No proposals yet"
              description="Create a client, pick a template, and write from facts you already have."
              actionHref="/proposals/new"
              actionLabel="Create a proposal"
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
            {recent.map((proposal) => (
              <li key={proposal.id}>
                <Link
                  href={`/proposals/${proposal.id}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium">{proposal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {proposal.client?.company || proposal.client?.name || "No client"} ·{" "}
                      {proposal.status}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {proposal.updatedAt.toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-2 font-heading text-4xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

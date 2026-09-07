import type { Metadata } from "next";
import { loadAdminOverview } from "@/lib/admin-data";
import { formatCents } from "@/lib/analytics";
import { TrendChart } from "@/components/app/trend-chart";
import { FunnelChart } from "@/components/app/funnel-chart";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Platform admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const data = await loadAdminOverview();
  let health: { ok: boolean } = { ok: false };
  try {
    await prisma.$queryRaw`SELECT 1`;
    health = { ok: true };
  } catch {
    health = { ok: false };
  }

  return (
    <div className="space-y-12">
      <div>
        <p className="text-xs tracking-[0.18em] text-[#c9a227] uppercase">Platform admin</p>
        <h1 className="mt-2 font-heading text-4xl">ProposalFast operations</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/60">
          This console is gated by <code>User.platformAdmin</code> or{" "}
          <code>PLATFORM_ADMIN_EMAILS</code>. Org Admin is not enough.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat label="Users" value={String(data.counts.users)} />
        <AdminStat label="Organizations" value={String(data.counts.orgs)} />
        <AdminStat label="Proposals" value={String(data.counts.proposals)} />
        <AdminStat label="MRR (catalog)" value={formatCents(data.counts.mrrCents)} hint={`${data.counts.paidOrgs} paid orgs`} />
        <AdminStat label="Proposal revenue (6 mo)" value={formatCents(data.counts.revenueCents)} />
        <AdminStat label="AI calls" value={String(data.counts.aiCalls)} hint={`${data.counts.aiTokens} tokens`} />
        <AdminStat label="Open support" value={String(data.counts.supportOpen)} />
        <AdminStat label="Failed follow-ups" value={String(data.counts.failedFollowUps)} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-heading text-2xl">Monthly trends</h2>
          <TrendChart points={data.trends} dark />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="font-heading text-2xl">Platform funnel</h2>
          <FunnelChart steps={data.funnel} dark />
        </div>
      </section>

      <section id="users" className="scroll-mt-8">
        <h2 className="font-heading text-2xl">Users</h2>
        <AdminTable
          headers={["Email", "Name", "Orgs", "Proposals", "Admin", "Joined"]}
          rows={data.recentUsers.map((user) => [
            user.email,
            user.name ?? "—",
            user.memberships.map((m) => m.organization.name).join(", ") || "—",
            String(user._count.createdProposals),
            user.platformAdmin ? "platform" : "—",
            user.createdAt.toLocaleDateString(),
          ])}
        />
      </section>

      <section id="orgs" className="scroll-mt-8">
        <h2 className="font-heading text-2xl">Organizations</h2>
        <AdminTable
          headers={["Name", "Plan", "Status", "Seats", "Proposals", "Clients"]}
          rows={data.recentOrgs.map((org) => [
            org.name,
            org.subscription?.plan.tier ?? "—",
            org.subscription?.status ?? "—",
            String(org._count.members),
            String(org._count.proposals),
            String(org._count.clients),
          ])}
        />
      </section>

      <section id="billing" className="scroll-mt-8">
        <h2 className="font-heading text-2xl">Subscriptions</h2>
        <AdminTable
          headers={["Workspace", "Plan", "Status", "Stripe customer"]}
          rows={data.subscriptions.map((sub) => [
            sub.organization.name,
            sub.plan.name,
            sub.status,
            sub.stripeCustomerId ?? "—",
          ])}
        />
      </section>

      <section id="usage" className="scroll-mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-heading text-2xl">AI usage</h2>
        <p className="mt-2 text-sm text-white/70">
          {data.counts.aiCalls} logged calls · {data.counts.aiTokens} tokens · estimated{" "}
          {formatCents(data.counts.aiCostCents)}
        </p>
        <p className="mt-2 text-xs text-white/50">
          Per-org caps still come from the plan catalog. This view is platform-wide.
        </p>
      </section>

      <section id="support" className="scroll-mt-8">
        <h2 className="font-heading text-2xl">Support requests</h2>
        {data.recentSupport.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">No contact-form tickets yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.recentSupport.map((ticket) => (
              <li key={ticket.id} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                <p className="font-medium">
                  {ticket.subject} · {ticket.status}
                </p>
                <p className="mt-1 text-white/60">
                  {ticket.name} ({ticket.email}) · {ticket.createdAt.toLocaleString()}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-white/80">{ticket.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="health" className="scroll-mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="font-heading text-2xl">Health</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-white/50">Database</dt>
            <dd>{health.ok ? "Reachable" : "Unreachable"}</dd>
          </div>
          <div>
            <dt className="text-white/50">Public health</dt>
            <dd>/api/health</dd>
          </div>
          <div>
            <dt className="text-white/50">Failed follow-ups</dt>
            <dd>{data.counts.failedFollowUps}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-white/50">
          Error inbox is a stub until an external log drain is attached. Failed Stripe invoices
          surface as in-app notifications on the workspace.
        </p>
      </section>
    </div>
  );
}

function AdminStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs tracking-[0.14em] text-white/50 uppercase">{label}</p>
      <p className="mt-2 font-heading text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
    </div>
  );
}

function AdminTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return <p className="mt-3 text-sm text-white/50">Nothing here yet.</p>;
  }
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="bg-white/5 text-xs tracking-wide text-white/50 uppercase">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-white/10">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2 text-white/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

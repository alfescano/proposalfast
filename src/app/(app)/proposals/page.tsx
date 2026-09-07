import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { EmptyState } from "@/components/states/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Proposals" };

export default async function ProposalsPage() {
  const ctx = await requireOrg();
  const proposals = await prisma.proposal.findMany({
    where: { organizationId: ctx.organization.id, deletedAt: null },
    include: { client: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Proposals</p>
          <h1 className="mt-2 font-heading text-4xl">Your pipeline</h1>
        </div>
        <Link href="/proposals/new" className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}>
          New proposal
        </Link>
      </div>

      {proposals.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Nothing drafted yet"
            description="Start from a system template. Pricing stays a placeholder until you type a number."
            actionHref="/proposals/new"
            actionLabel="Create a proposal"
          />
        </div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/proposals/${proposal.id}`} className="font-medium hover:underline">
                      {proposal.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {proposal.client?.company || proposal.client?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{proposal.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {proposal.updatedAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

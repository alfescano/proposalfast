import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { ClientEditForm } from "@/components/app/client-form";
import { canWriteProposals } from "@/lib/rbac";

export const metadata: Metadata = { title: "Client" };

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrg();
  const canWrite = canWriteProposals(ctx.role);
  const client = await prisma.client.findFirst({
    where: { id, organizationId: ctx.organization.id, deletedAt: null },
    include: { proposals: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } } },
  });
  if (!client) notFound();

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
      <div>
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Client</p>
        <h1 className="mt-2 font-heading text-4xl">{client.name}</h1>
        <div className="mt-8">
          {canWrite ? (
            <ClientEditForm client={client} />
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5 text-sm">
              <p>{client.email || "No email"}</p>
              <p className="mt-2 text-muted-foreground">{client.company || "Independent"}</p>
              {client.notes ? <p className="mt-3 whitespace-pre-wrap">{client.notes}</p> : null}
            </div>
          )}
        </div>
      </div>
      <div>
        <h2 className="font-heading text-2xl">Proposals</h2>
        <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
          {client.proposals.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground">No proposals for this client.</li>
          ) : (
            client.proposals.map((proposal) => (
              <li key={proposal.id}>
                <Link href={`/proposals/${proposal.id}`} className="block px-4 py-3 hover:bg-muted/40">
                  <p className="font-medium">{proposal.title}</p>
                  <p className="text-xs text-muted-foreground">{proposal.status}</p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

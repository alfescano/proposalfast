import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { EmptyState } from "@/components/states/empty-state";
import { ClientCreateForm } from "@/components/app/client-form";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsPage() {
  const ctx = await requireOrg();
  const clients = await prisma.client.findMany({
    where: { organizationId: ctx.organization.id, deletedAt: null },
    include: { _count: { select: { proposals: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_20rem]">
      <div>
        <p className="text-xs tracking-[0.18em] text-accent uppercase">Clients</p>
        <h1 className="mt-2 font-heading text-4xl">People you send work to</h1>
        {clients.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="No clients yet"
              description="Add a name and email. The record is scoped to this organization only."
            />
          </div>
        ) : (
          <ul className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card">
            {clients.map((client) => (
              <li key={client.id}>
                <Link href={`/clients/${client.id}`} className="flex justify-between px-4 py-4 hover:bg-muted/40">
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.company || "Independent"} · {client.email || "No email"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{client._count.proposals} proposals</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h2 className="font-heading text-2xl">Add a client</h2>
        <div className="mt-4">
          <ClientCreateForm />
        </div>
      </div>
    </div>
  );
}

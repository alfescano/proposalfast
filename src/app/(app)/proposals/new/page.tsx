import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { requireWritableOrg } from "@/lib/org";
import { NewProposalForm } from "@/components/app/new-proposal-form";

export const metadata: Metadata = { title: "New proposal" };

export default async function NewProposalPage() {
  const ctx = await requireWritableOrg();
  const [clients, templates] = await Promise.all([
    prisma.client.findMany({
      where: { organizationId: ctx.organization.id, deletedAt: null },
      orderBy: { name: "asc" },
    }),
    prisma.proposalTemplate.findMany({
      where: {
        deletedAt: null,
        OR: [{ isSystem: true }, { organizationId: ctx.organization.id }],
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs tracking-[0.18em] text-accent uppercase">New proposal</p>
      <h1 className="mt-2 font-heading text-4xl">Start from a title and a template</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Plan limits are checked here. If you are on Free and already have five active proposals,
        this will fail with a clear error.
      </p>
      <div className="mt-8">
        <NewProposalForm
          clients={clients.map((client) => ({
            id: client.id,
            label: client.company ? `${client.company} — ${client.name}` : client.name,
          }))}
          templates={templates.map((template) => ({
            id: template.id,
            label: `${template.name}${template.isSystem ? " (system)" : ""}`,
          }))}
          currency={ctx.organization.settings?.defaultCurrency ?? "USD"}
        />
      </div>
    </div>
  );
}

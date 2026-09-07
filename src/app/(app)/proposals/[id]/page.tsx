import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { absoluteUrl } from "@/lib/site";
import { ProposalEditor } from "@/components/app/proposal-editor";

export const metadata: Metadata = { title: "Edit proposal" };

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrg();
  const proposal = await prisma.proposal.findFirst({
    where: { id, organizationId: ctx.organization.id, deletedAt: null },
    include: {
      client: true,
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        include: { sections: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!proposal) notFound();

  const clients = await prisma.client.findMany({
    where: { organizationId: ctx.organization.id, deletedAt: null },
    orderBy: { name: "asc" },
  });

  const version = proposal.versions[0];

  return (
    <div className="mx-auto max-w-4xl">
      <ProposalEditor
        proposal={{
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          currency: proposal.currency,
          clientId: proposal.clientId,
          publicId: proposal.publicId,
          portalUrl: absoluteUrl(`/p/${proposal.publicId}`),
          validUntil: proposal.validUntil?.toISOString().slice(0, 10) ?? "",
        }}
        clients={clients.map((client) => ({
          id: client.id,
          label: client.company ? `${client.company} — ${client.name}` : client.name,
        }))}
        sections={(version?.sections ?? []).map((section) => ({
          id: section.id,
          title: section.title,
          body:
            section.content && typeof section.content === "object" && "body" in section.content
              ? String((section.content as { body?: string }).body ?? "")
              : "",
        }))}
      />
    </div>
  );
}

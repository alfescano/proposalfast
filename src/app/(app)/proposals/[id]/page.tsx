import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { absoluteUrl } from "@/lib/site";
import { ProposalEditor } from "@/components/app/proposal-editor";
import { isProposalLocked } from "@/lib/proposal-lock";
import type { ScoreDimensions } from "@/lib/ai/schemas";

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
  const score =
    version?.content && typeof version.content === "object" && "score" in version.content
      ? (version.content as { score?: ScoreDimensions }).score
      : null;

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
          locked: isProposalLocked(proposal),
          paymentEnabled: proposal.paymentEnabled,
          paymentMode: proposal.paymentMode,
          amount: proposal.amountCents != null ? String(proposal.amountCents / 100) : "",
          depositPercent: proposal.depositPercent != null ? String(proposal.depositPercent) : "",
          followUpOptIn: proposal.followUpOptIn,
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
        score={score ?? null}
      />
    </div>
  );
}

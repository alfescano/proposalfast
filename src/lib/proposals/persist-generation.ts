import { prisma } from "@/lib/db";
import type { PipelineResult } from "@/lib/ai/pipeline";

export async function persistGeneratedVersion(input: {
  proposalId: string;
  organizationId: string;
  userId: string;
  result: PipelineResult;
}) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: input.proposalId, organizationId: input.organizationId, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!proposal) throw new Error("Proposal not found for this organization.");
  if (proposal.lockedAt) {
    throw new Error("This proposal is locked.");
  }

  const version = await prisma.proposalVersion.create({
    data: {
      proposalId: input.proposalId,
      version: (proposal.versions[0]?.version ?? 0) + 1,
      content: input.result as object,
      createdById: input.userId,
      sections: {
        create: input.result.sections.map((section, index) => ({
          type: section.type,
          title: section.title,
          sortOrder: index,
          content: { body: section.body, placeholders: section.placeholders },
        })),
      },
    },
  });

  await prisma.proposal.update({
    where: { id: input.proposalId },
    data: { status: "REVIEW" },
  });

  return version;
}

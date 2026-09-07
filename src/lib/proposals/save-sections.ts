import { prisma } from "@/lib/db";
import { TenantError } from "@/lib/rbac";
import { isProposalLocked, ProposalLockedError } from "@/lib/proposal-lock";

export type SectionDraft = { id: string; title: string; body: string; type: string };

export function extractPlaceholders(body: string) {
  return [...body.matchAll(/\[PLACEHOLDER:[^\]]+\]/g)].map((match) => match[0]);
}

/**
 * Persist editor blocks. Section updates are scoped to the current version so a
 * forged section id from another workspace cannot be overwritten (IDOR).
 */
export async function saveProposalSectionsForOrg(
  organizationId: string,
  proposalId: string,
  sections: SectionDraft[],
) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, organizationId, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" }, take: 1, include: { sections: true } } },
  });
  if (!proposal) throw new TenantError();
  if (isProposalLocked(proposal)) throw new ProposalLockedError();

  const version = proposal.versions[0];
  if (!version) return { ok: false as const, error: "This proposal has no version to edit." };

  const keepIds = sections.filter((section) => !section.id.startsWith("new_")).map((section) => section.id);

  await prisma.$transaction(async (tx) => {
    await tx.proposalSection.deleteMany({
      where: keepIds.length
        ? { versionId: version.id, id: { notIn: keepIds } }
        : { versionId: version.id },
    });

    for (const [index, section] of sections.entries()) {
      const data = {
        title: section.title,
        type: section.type || "paragraph",
        sortOrder: index,
        content: { body: section.body, placeholders: extractPlaceholders(section.body) },
      };
      if (section.id.startsWith("new_")) {
        await tx.proposalSection.create({
          data: { ...data, versionId: version.id },
        });
      } else {
        const owned = await tx.proposalSection.findFirst({
          where: { id: section.id, versionId: version.id },
        });
        if (!owned) throw new TenantError();
        await tx.proposalSection.update({
          where: { id: section.id },
          data,
        });
      }
    }
  });

  return { ok: true as const };
}

export async function setProposalStatusForOrg(
  organizationId: string,
  proposalId: string,
  status: import("@prisma/client").ProposalStatus,
) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, organizationId, deletedAt: null },
  });
  if (!proposal) throw new TenantError();
  if (isProposalLocked(proposal)) throw new ProposalLockedError();

  await prisma.proposal.update({ where: { id: proposalId }, data: { status } });
  return { ok: true as const };
}

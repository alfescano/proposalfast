import type { Proposal, ProposalStatus } from "@prisma/client";

export function proposalExpiresAt(
  proposal: Pick<Proposal, "expiresAt" | "validUntil"> | { expiresAt?: Date | null; validUntil?: Date | null },
) {
  return proposal.expiresAt ?? proposal.validUntil ?? null;
}

export function isProposalExpired(
  proposal: Pick<Proposal, "expiresAt" | "validUntil" | "status" | "lockedAt">,
  now = new Date(),
) {
  if (proposal.lockedAt || proposal.status === "SIGNED") return false;
  const expires = proposalExpiresAt(proposal);
  if (!expires) return false;
  return expires.getTime() <= now.getTime();
}

export function statusAfterExpiry(status: ProposalStatus): ProposalStatus {
  if (status === "SIGNED" || status === "ACCEPTED" || status === "ARCHIVED") return status;
  return "EXPIRED";
}

export function statusAfterExtend(proposal: Pick<Proposal, "status" | "viewedAt">): ProposalStatus {
  if (proposal.status === "SIGNED" || proposal.status === "ACCEPTED") return proposal.status;
  if (proposal.viewedAt) return "VIEWED";
  return "SENT";
}

import type { Proposal, ProposalStatus } from "@prisma/client";

const LOCKED_STATUSES: ProposalStatus[] = ["SIGNED", "ACCEPTED"];

export function isProposalLocked(
  proposal: Pick<Proposal, "lockedAt" | "status"> & { versions?: { locked?: boolean }[] },
) {
  if (proposal.lockedAt) return true;
  if (LOCKED_STATUSES.includes(proposal.status)) return true;
  if (proposal.versions?.some((version) => version.locked)) return true;
  return false;
}

export class ProposalLockedError extends Error {
  constructor(message = "This proposal has been signed and cannot be edited.") {
    super(message);
    this.name = "ProposalLockedError";
  }
}

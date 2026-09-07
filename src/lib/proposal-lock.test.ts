import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { isProposalLocked } from "./proposal-lock";
import { persistGeneratedVersion } from "./proposals/persist-generation";

const prisma = new PrismaClient();

describe("signature lock", () => {
  it("treats signed and lockedAt proposals as immutable", () => {
    expect(isProposalLocked({ status: "DRAFT", lockedAt: null })).toBe(false);
    expect(isProposalLocked({ status: "SIGNED", lockedAt: null })).toBe(true);
    expect(isProposalLocked({ status: "DRAFT", lockedAt: new Date() })).toBe(true);
    expect(
      isProposalLocked({ status: "REVIEW", lockedAt: null, versions: [{ locked: true }] }),
    ).toBe(true);
  });

  it("refuses to persist a generated version onto a locked proposal", async () => {
    const seed = await prisma.proposal.findFirst({
      where: { deletedAt: null },
    });
    if (!seed) return;

    await prisma.proposal.update({
      where: { id: seed.id },
      data: { lockedAt: new Date(), status: "SIGNED" },
    });

    await expect(
      persistGeneratedVersion({
        proposalId: seed.id,
        organizationId: seed.organizationId,
        userId: seed.createdById,
        result: {
          facts: [],
          missing: [],
          outline: [],
          sections: [{ title: "X", type: "custom", body: "no", placeholders: [] }],
          qc: { invented: [], missing: [], ok: true },
          score: {
            completeness: 10,
            fidelity: 10,
            clarity: 10,
            commercialReadiness: 10,
            overall: 10,
            notes: [],
          },
        },
      }),
    ).rejects.toThrow(/locked/i);

    await prisma.proposal.update({
      where: { id: seed.id },
      data: { lockedAt: null, status: "DRAFT" },
    });
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

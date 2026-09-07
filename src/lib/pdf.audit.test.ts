import { afterAll, describe, expect, it } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { renderProposalPdf } from "./pdf/render";

const prisma = new PrismaClient();

describe("PDF artifact", () => {
  it("renders a real PDF from a seeded or created proposal", async () => {
    const proposal = await prisma.proposal.findFirst({
      where: { deletedAt: null },
      include: { versions: { include: { sections: true } } },
    });
    expect(proposal).toBeTruthy();

    const buffer = await renderProposalPdf(proposal!.id);
    expect(buffer.subarray(0, 5).toString("utf8")).toBe("%PDF-");
    expect(buffer.length).toBeGreaterThan(800);

    const outDir = path.join(process.cwd(), "tmp");
    mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "audit-proposal.pdf");
    writeFileSync(outPath, buffer);

    const text = buffer.toString("latin1");
    expect(text).toMatch(/PDF/);
    expect(proposal!.title.length).toBeGreaterThan(0);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { ProposalPdfDocument } from "./document";

/**
 * PDF engine: @react-pdf/renderer
 * Chosen over Puppeteer because it has no Chromium binary, fits Vercel serverless
 * memory/time limits, and produces deterministic multi-page proposal layouts.
 */
export async function renderProposalPdf(proposalId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, deletedAt: null },
    include: {
      organization: { include: { settings: true } },
      client: true,
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        include: { sections: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  if (!proposal) {
    throw new Error("Proposal not found.");
  }

  const buffer = await renderToBuffer(
    ProposalPdfDocument({
      title: proposal.title,
      organizationName: proposal.organization.settings?.businessName || proposal.organization.name,
      clientName: proposal.client?.company || proposal.client?.name || "Client",
      sections: (proposal.versions[0]?.sections ?? []).map((section) => ({
        title: section.title,
        body: readSectionBody(section.content),
      })),
    }),
  );

  return Buffer.from(buffer);
}

function readSectionBody(content: unknown) {
  if (content && typeof content === "object" && "body" in content) {
    const body = (content as { body?: unknown }).body;
    if (typeof body === "string") return body;
  }
  return "";
}

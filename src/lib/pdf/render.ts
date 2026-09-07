import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { ProposalPdfDocument } from "./document";
import { chargeAmountCents, paymentLabel } from "@/lib/payments";

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
      signatures: { where: { status: "SIGNED" }, orderBy: { signedAt: "desc" }, take: 1 },
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

  const charge = chargeAmountCents(proposal);
  const amountLabel =
    charge != null
      ? `${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: proposal.currency,
        }).format(charge / 100)} (${paymentLabel(proposal.paymentMode, proposal.depositPercent)})`
      : null;

  const signature = proposal.signatures[0];

  const buffer = await renderToBuffer(
    ProposalPdfDocument({
      title: proposal.title,
      organizationName: proposal.organization.settings?.businessName || proposal.organization.name,
      tagline: proposal.organization.settings?.tagline,
      brandColor: proposal.organization.settings?.brandColor,
      clientName: proposal.client?.company || proposal.client?.name || "Client",
      currency: proposal.currency,
      amountLabel,
      sections: (proposal.versions[0]?.sections ?? []).map((section) => ({
        title: section.title,
        type: section.type,
        body: readSectionBody(section.content),
      })),
      signature: signature
        ? {
            signerName: signature.signerName,
            signerEmail: signature.signerEmail,
            signedAt: (signature.signedAt ?? signature.createdAt).toISOString(),
            typedName: signature.signatureType === "TYPED" ? signature.signerName : undefined,
          }
        : null,
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

import { NextResponse } from "next/server";
import { requireOrg } from "@/lib/org";
import { prisma } from "@/lib/db";
import { renderProposalPdf } from "@/lib/pdf/render";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const ctx = await requireOrg();
  const { id } = await context.params;
  const proposal = await prisma.proposal.findFirst({
    where: { id, organizationId: ctx.organization.id, deletedAt: null },
  });
  if (!proposal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await renderProposalPdf(proposal.id);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${proposal.publicId}.pdf"`,
    },
  });
}

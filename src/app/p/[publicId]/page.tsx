import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { chargeAmountCents, paymentLabel } from "@/lib/payments";
import { recordProposalView } from "@/lib/proposals/record-view";
import { SignPayPanel } from "@/components/public/sign-pay";
import { PublicCommentForm } from "@/components/public/comment-form";
import { isProposalExpired, statusAfterExpiry } from "@/lib/proposals/expiry";
import { sectionBody } from "@/lib/proposals/render-block";
import { blockLabel } from "@/lib/proposals/blocks";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicId: string }>;
}): Promise<Metadata> {
  const { publicId } = await params;
  const proposal = await prisma.proposal.findFirst({
    where: { publicId, deletedAt: null },
    select: { title: true, organization: { select: { name: true } } },
  });
  if (!proposal) return { title: "Proposal" };
  return {
    title: `${proposal.title} · ${proposal.organization.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicProposalPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const proposal = await prisma.proposal.findFirst({
    where: { publicId, deletedAt: null },
    include: {
      organization: { include: { settings: true } },
      client: true,
      signatures: { where: { status: "SIGNED" }, take: 1 },
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        include: { sections: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  if (!proposal) notFound();

  const expired = isProposalExpired(proposal) || proposal.status === "EXPIRED";
  if (expired && proposal.status !== "EXPIRED" && proposal.status !== "SIGNED" && proposal.status !== "ACCEPTED") {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: statusAfterExpiry(proposal.status) },
    });
  }

  if (!expired) {
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
    await recordProposalView({
      proposalId: proposal.id,
      organizationId: proposal.organizationId,
      title: proposal.title,
      status: proposal.status,
      viewedAt: proposal.viewedAt,
      ip,
      userAgent: headerList.get("user-agent"),
      referrer: headerList.get("referer"),
    });
  }

  const seller = proposal.organization.settings?.businessName || proposal.organization.name;
  const sections = proposal.versions[0]?.sections ?? [];
  const charge = chargeAmountCents(proposal);
  const amountLabel =
    charge != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: proposal.currency,
        }).format(charge / 100)
      : null;

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#152033]">
      <a
        href="#proposal-body"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10 focus:rounded-md focus:bg-[#152033] focus:px-3 focus:py-2 focus:text-[#fffdf8]"
      >
        Skip to proposal
      </a>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.2em] text-[#5c4a24] uppercase">Proposal</p>
        <h1 className="mt-3 font-heading text-5xl">{proposal.title}</h1>
        <p className="mt-3 text-sm text-[#3d4a5c]">
          Prepared by {seller}
          {proposal.client ? ` for ${proposal.client.company || proposal.client.name}` : ""}
        </p>
        {proposal.organization.settings?.tagline ? (
          <p className="mt-2 text-sm italic">{proposal.organization.settings.tagline}</p>
        ) : null}
        {expired ? (
          <p
            className="mt-6 rounded-xl border border-[#8a7040] bg-[#fffdf8] px-4 py-3 text-sm text-[#152033]"
            role="status"
          >
            This proposal has expired. Accepting and signing are disabled. Ask {seller} to extend the
            date if you still want to proceed.
          </p>
        ) : null}
        <div id="proposal-body" className="mt-10 space-y-8" tabIndex={-1}>
          {sections.map((section) => {
            const body = sectionBody(section.content);
            return (
              <section key={section.id} className="rounded-2xl border border-[#e0d4bf] bg-[#fffdf8] p-6">
                {section.type === "heading" ? (
                  <h2 className="font-heading text-3xl">{section.title}</h2>
                ) : (
                  <div>
                    <p className="text-[11px] tracking-[0.16em] text-[#5c4a24] uppercase">
                      {blockLabel(section.type)}
                    </p>
                    <h2 className="mt-1 font-heading text-2xl">{section.title}</h2>
                  </div>
                )}
                {section.type === "pricing" ? (
                  <p className="mt-3 rounded-lg border border-[#e0d4bf] bg-white px-4 py-3 text-sm leading-7 whitespace-pre-wrap">
                    {body}
                  </p>
                ) : section.type === "signature" ? (
                  <p className="mt-3 border-t border-[#c4b396] pt-6 text-sm italic">{body}</p>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{body}</p>
                )}
              </section>
            );
          })}
        </div>
        {charge != null ? (
          <p className="mt-8 text-sm">
            {paymentLabel(proposal.paymentMode, proposal.depositPercent)}:{" "}
            <strong>{amountLabel}</strong>
          </p>
        ) : null}
        <div className="mt-10">
          <SignPayPanel
            publicId={proposal.publicId}
            alreadySigned={Boolean(proposal.lockedAt || proposal.signatures[0])}
            alreadyAccepted={Boolean(proposal.acceptedAt)}
            expired={expired}
            paymentEnabled={proposal.paymentEnabled && charge != null && !expired}
            amountLabel={amountLabel}
            signerDefaultName={proposal.client?.name ?? undefined}
            signerDefaultEmail={proposal.client?.email ?? undefined}
          />
        </div>
        {proposal.commentsEnabled ? (
          <div className="mt-10">
            <PublicCommentForm
              publicId={proposal.publicId}
              defaultName={proposal.client?.name ?? undefined}
              defaultEmail={proposal.client?.email ?? undefined}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}

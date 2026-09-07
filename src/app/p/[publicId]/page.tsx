import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { chargeAmountCents, paymentLabel } from "@/lib/payments";
import { recordProposalView } from "@/lib/proposals/record-view";
import { SignPayPanel } from "@/components/public/sign-pay";

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
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8a7040] uppercase">Proposal</p>
        <h1 className="mt-3 font-heading text-5xl">{proposal.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Prepared by {seller}
          {proposal.client ? ` for ${proposal.client.company || proposal.client.name}` : ""}
        </p>
        {proposal.organization.settings?.tagline ? (
          <p className="mt-2 text-sm italic">{proposal.organization.settings.tagline}</p>
        ) : null}
        <div className="mt-10 space-y-8">
          {sections.map((section) => {
            const body =
              section.content && typeof section.content === "object" && "body" in section.content
                ? String((section.content as { body?: string }).body ?? "")
                : "";
            return (
              <section key={section.id} className="rounded-2xl border border-[#e0d4bf] bg-[#fffdf8] p-6">
                <h2 className="font-heading text-2xl">{section.title}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{body}</p>
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
            paymentEnabled={proposal.paymentEnabled && charge != null}
            amountLabel={amountLabel}
            signerDefaultName={proposal.client?.name ?? undefined}
            signerDefaultEmail={proposal.client?.email ?? undefined}
          />
        </div>
      </div>
    </main>
  );
}

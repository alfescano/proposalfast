import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashIp } from "@/lib/crypto";

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
  await prisma.proposalView.create({
    data: {
      proposalId: proposal.id,
      ipHash: hashIp(ip),
      userAgent: headerList.get("user-agent"),
      referrer: headerList.get("referer"),
    },
  });
  await prisma.proposalEvent.create({
    data: { proposalId: proposal.id, type: "viewed" },
  });
  if (proposal.status === "SENT") {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "VIEWED", viewedAt: proposal.viewedAt ?? new Date() },
    });
  }

  const seller = proposal.organization.settings?.businessName || proposal.organization.name;
  const sections = proposal.versions[0]?.sections ?? [];

  return (
    <main className="min-h-screen bg-[#f6f1e8] text-[#152033]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs tracking-[0.2em] text-[#8a7040] uppercase">Proposal</p>
        <h1 className="mt-3 font-heading text-5xl">{proposal.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Prepared by {seller}
          {proposal.client ? ` for ${proposal.client.company || proposal.client.name}` : ""}
        </p>
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
        <div className="mt-10 rounded-2xl border border-dashed border-[#c9a227] bg-[#fffdf8] p-6 text-sm">
          <p className="font-medium">Sign and pay</p>
          <p className="mt-2 text-muted-foreground">
            E-sign and Stripe Checkout attach here once STRIPE_SECRET_KEY is configured and a fee is
            on the proposal. This portal is already tracking views in the database.
          </p>
        </div>
      </div>
    </main>
  );
}

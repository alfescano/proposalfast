"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashIp } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";
import { mail, sendMail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { chargeAmountCents } from "@/lib/payments";
import { createProposalPaymentCheckout } from "@/lib/stripe/client";

const signSchema = z.object({
  publicId: z.string().min(6).max(40),
  signerName: z.string().trim().min(2).max(80),
  signerEmail: z.string().trim().email().max(254).toLowerCase(),
  signatureType: z.enum(["DRAWN", "TYPED"]),
  signatureData: z.string().min(1).max(400_000),
  consent: z.literal("on").or(z.literal("true")).or(z.boolean()),
});

export async function signPublicProposalAction(formData: FormData) {
  const parsed = signSchema.safeParse({
    publicId: formData.get("publicId"),
    signerName: formData.get("signerName"),
    signerEmail: formData.get("signerEmail"),
    signatureType: formData.get("signatureType") || "TYPED",
    signatureData: formData.get("signatureData"),
    consent: formData.get("consent"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the signature form." };
  }

  const proposal = await prisma.proposal.findFirst({
    where: { publicId: parsed.data.publicId, deletedAt: null },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      organization: {
        include: { members: { where: { role: "OWNER" }, include: { user: true } } },
      },
    },
  });
  if (!proposal) return { ok: false as const, error: "Proposal not found." };
  if (proposal.lockedAt || proposal.status === "SIGNED") {
    return { ok: false as const, error: "This proposal is already signed." };
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const version = proposal.versions[0];
  const consentText =
    "I agree that my typed or drawn signature is the legal equivalent of a handwritten signature on this proposal, and I intend to be bound by it.";

  await prisma.$transaction([
    prisma.signature.create({
      data: {
        proposalId: proposal.id,
        versionId: version?.id,
        signerName: parsed.data.signerName,
        signerEmail: parsed.data.signerEmail,
        signedAt: new Date(),
        ipHash: hashIp(ip),
        userAgent: headerList.get("user-agent"),
        signatureData: parsed.data.signatureData,
        signatureType: parsed.data.signatureType,
        consentText,
        status: "SIGNED",
      },
    }),
    prisma.proposalVersion.updateMany({
      where: { proposalId: proposal.id },
      data: { locked: true },
    }),
    prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        lockedAt: new Date(),
        acceptedAt: new Date(),
      },
    }),
    prisma.proposalEvent.create({
      data: {
        proposalId: proposal.id,
        type: "signed",
        metadata: {
          signerEmail: parsed.data.signerEmail,
          versionId: version?.id,
        },
      },
    }),
  ]);

  await writeAuditLog({
    organizationId: proposal.organizationId,
    action: "proposal.signed",
    entityType: "Proposal",
    entityId: proposal.id,
    ipHash: hashIp(ip),
    metadata: { versionId: version?.id, signerEmail: parsed.data.signerEmail },
  });

  const owner = proposal.organization.members[0]?.user;
  const signedTemplate = mail.templates.proposalSignedEmail({
    recipientName: owner?.name ?? proposal.organization.name,
    signerName: parsed.data.signerName,
    title: proposal.title,
    url: absoluteUrl(`/proposals/${proposal.id}`),
  });
  if (owner?.email) {
    await sendMail(owner.email, signedTemplate);
  }
  await sendMail(
    parsed.data.signerEmail,
    mail.templates.proposalSignedEmail({
      recipientName: parsed.data.signerName,
      signerName: parsed.data.signerName,
      title: proposal.title,
      url: absoluteUrl(`/p/${proposal.publicId}`),
    }),
  );
  if (owner?.email) {
    await sendMail(
      owner.email,
      mail.templates.proposalAcceptedEmail({
        ownerName: owner.name ?? "there",
        clientName: parsed.data.signerName,
        title: proposal.title,
        dashboardUrl: absoluteUrl(`/proposals/${proposal.id}`),
      }),
    );
  }

  return { ok: true as const };
}

export async function startPublicPaymentAction(publicId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { publicId, deletedAt: null },
    include: { client: true },
  });
  if (!proposal) return { ok: false as const, error: "Proposal not found." };

  const amount = chargeAmountCents(proposal);
  if (!amount) {
    return { ok: false as const, error: "This proposal does not have a payable amount." };
  }

  try {
    const session = await createProposalPaymentCheckout({
      organizationId: proposal.organizationId,
      proposalId: proposal.id,
      publicId: proposal.publicId,
      amountCents: amount,
      currency: proposal.currency,
      title: proposal.title,
      customerEmail: proposal.client?.email ?? undefined,
    });
    if (!session.url) return { ok: false as const, error: "Stripe did not return a Checkout URL." };
    return { ok: true as const, url: session.url };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Could not start payment.",
    };
  }
}

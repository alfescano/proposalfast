"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashIp } from "@/lib/crypto";
import { chargeAmountCents } from "@/lib/payments";
import { createProposalPaymentCheckout } from "@/lib/stripe/client";
import { acceptPublicProposal, recordPublicSignature } from "@/lib/proposals/lifecycle";
import { RateLimitError, assertRateLimit } from "@/lib/rate-limit";

const signSchema = z.object({
  publicId: z.string().min(6).max(40),
  signerName: z.string().trim().min(2).max(80),
  signerEmail: z.string().trim().email().max(254).toLowerCase(),
  signatureType: z.enum(["DRAWN", "TYPED"]),
  signatureData: z.string().min(1).max(400_000),
  consent: z.literal("on").or(z.literal("true")).or(z.boolean()),
});

export async function acceptPublicProposalAction(formData: FormData) {
  const publicId = String(formData.get("publicId") ?? "");
  const actorName = String(formData.get("signerName") ?? "").trim() || undefined;
  const actorEmail = String(formData.get("signerEmail") ?? "").trim() || undefined;
  try {
    assertRateLimit(`portal-accept:${publicId}`, 20, 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false as const, error: error.message };
    throw error;
  }
  return acceptPublicProposal({ publicId, actorName, actorEmail });
}

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

  try {
    assertRateLimit(`portal-sign:${parsed.data.publicId}`, 12, 60_000);
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false as const, error: error.message };
    throw error;
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const version = proposal.versions[0];

  await recordPublicSignature({
    proposalId: proposal.id,
    publicId: proposal.publicId,
    organizationId: proposal.organizationId,
    title: proposal.title,
    organizationName: proposal.organization.name,
    owner: proposal.organization.members[0]?.user,
    versionId: version?.id,
    signerName: parsed.data.signerName,
    signerEmail: parsed.data.signerEmail,
    signatureType: parsed.data.signatureType,
    signatureData: parsed.data.signatureData,
    ipHash: hashIp(ip),
    userAgent: headerList.get("user-agent"),
  });

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

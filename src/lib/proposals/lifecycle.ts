import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { notifyWorkspace } from "@/lib/notifications";
import { mail, sendMail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

export async function acceptPublicProposal(input: {
  publicId: string;
  actorName?: string;
  actorEmail?: string;
}) {
  const proposal = await prisma.proposal.findFirst({
    where: { publicId: input.publicId, deletedAt: null },
    include: {
      client: true,
      organization: {
        include: { members: { where: { role: "OWNER" }, include: { user: true } } },
      },
    },
  });
  if (!proposal) return { ok: false as const, error: "Proposal not found." };
  if (!proposal.sentAt) {
    return { ok: false as const, error: "This proposal has not been sent yet." };
  }
  if (proposal.lockedAt || proposal.status === "SIGNED") {
    return { ok: false as const, error: "This proposal is already signed." };
  }
  if (proposal.status === "DECLINED") {
    return { ok: false as const, error: "This proposal was declined." };
  }
  if (proposal.acceptedAt) {
    return { ok: true as const, already: true as const, proposalId: proposal.id };
  }

  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
    prisma.proposalEvent.create({
      data: {
        proposalId: proposal.id,
        type: "accepted",
        metadata: { actorEmail: input.actorEmail, actorName: input.actorName },
      },
    }),
  ]);

  const owner = proposal.organization.members[0]?.user;
  const clientName = input.actorName || proposal.client?.name || "A client";
  if (owner?.email) {
    await sendMail(
      owner.email,
      mail.templates.proposalAcceptedEmail({
        ownerName: owner.name ?? "there",
        clientName,
        title: proposal.title,
        dashboardUrl: absoluteUrl(`/proposals/${proposal.id}`),
      }),
    );
  }

  await notifyWorkspace({
    organizationId: proposal.organizationId,
    type: "accepted",
    title: "Proposal accepted",
    body: `${clientName} accepted “${proposal.title}”.`,
    actionUrl: `/proposals/${proposal.id}`,
  });

  return { ok: true as const, already: false as const, proposalId: proposal.id };
}

export async function recordPublicSignature(input: {
  proposalId: string;
  publicId?: string;
  organizationId: string;
  title: string;
  organizationName: string;
  owner?: { email: string | null; name: string | null } | null;
  versionId?: string | null;
  signerName: string;
  signerEmail: string;
  signatureType: "DRAWN" | "TYPED";
  signatureData: string;
  ipHash?: string | null;
  userAgent?: string | null;
}) {
  const consentText =
    "I agree that my typed or drawn signature is the legal equivalent of a handwritten signature on this proposal, and I intend to be bound by it.";

  await prisma.$transaction([
    prisma.signature.create({
      data: {
        proposalId: input.proposalId,
        versionId: input.versionId ?? undefined,
        signerName: input.signerName,
        signerEmail: input.signerEmail,
        signedAt: new Date(),
        ipHash: input.ipHash,
        userAgent: input.userAgent,
        signatureData: input.signatureData,
        signatureType: input.signatureType,
        consentText,
        status: "SIGNED",
      },
    }),
    prisma.proposalVersion.updateMany({
      where: { proposalId: input.proposalId },
      data: { locked: true },
    }),
    prisma.proposal.update({
      where: { id: input.proposalId },
      data: {
        status: "SIGNED",
        signedAt: new Date(),
        lockedAt: new Date(),
        acceptedAt: new Date(),
      },
    }),
    prisma.proposalEvent.create({
      data: {
        proposalId: input.proposalId,
        type: "signed",
        metadata: { signerEmail: input.signerEmail, versionId: input.versionId },
      },
    }),
  ]);

  await writeAuditLog({
    organizationId: input.organizationId,
    action: "proposal.signed",
    entityType: "Proposal",
    entityId: input.proposalId,
    ipHash: input.ipHash,
    metadata: { versionId: input.versionId, signerEmail: input.signerEmail },
  });

  const signedForOwner = mail.templates.proposalSignedEmail({
    recipientName: input.owner?.name ?? input.organizationName,
    signerName: input.signerName,
    title: input.title,
    url: absoluteUrl(`/proposals/${input.proposalId}`),
  });
  if (input.owner?.email) {
    await sendMail(input.owner.email, signedForOwner);
    await sendMail(
      input.owner.email,
      mail.templates.proposalAcceptedEmail({
        ownerName: input.owner.name ?? "there",
        clientName: input.signerName,
        title: input.title,
        dashboardUrl: absoluteUrl(`/proposals/${input.proposalId}`),
      }),
    );
  }
  await sendMail(
    input.signerEmail,
    mail.templates.proposalSignedEmail({
      recipientName: input.signerName,
      signerName: input.signerName,
      title: input.title,
      url: absoluteUrl(`/p/${input.publicId ?? input.proposalId}`),
    }),
  );

  await notifyWorkspace({
    organizationId: input.organizationId,
    type: "signed",
    title: "Proposal signed",
    body: `${input.signerName} signed “${input.title}”. The version is locked.`,
    actionUrl: `/proposals/${input.proposalId}`,
  });
}

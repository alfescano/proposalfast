import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { clearActiveOrgCookie } from "@/lib/org-cookie";

export async function exportWorkspaceData(organizationId: string, userId: string) {
  const [user, organization, clients, proposals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true, emailVerified: true },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        settings: true,
        subscription: { include: { plan: true } },
        members: { include: { user: { select: { email: true, name: true } } } },
      },
    }),
    prisma.client.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.proposal.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        client: { select: { name: true, email: true, company: true } },
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          include: { sections: { orderBy: { sortOrder: "asc" } } },
        },
        events: { orderBy: { createdAt: "asc" } },
        signatures: true,
        payments: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    account: user,
    organization: organization
      ? {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          industry: organization.industry,
          website: organization.website,
          plan: organization.subscription?.plan.tier,
          subscriptionStatus: organization.subscription?.status,
          members: organization.members.map((member) => ({
            email: member.user.email,
            name: member.user.name,
            role: member.role,
          })),
        }
      : null,
    clients: clients.map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone,
      website: client.website,
      address: client.address,
      notes: client.notes,
      createdAt: client.createdAt,
    })),
    proposals: proposals.map((proposal) => ({
      id: proposal.id,
      publicId: proposal.publicId,
      title: proposal.title,
      status: proposal.status,
      currency: proposal.currency,
      client: proposal.client,
      sentAt: proposal.sentAt,
      viewedAt: proposal.viewedAt,
      acceptedAt: proposal.acceptedAt,
      signedAt: proposal.signedAt,
      amountCents: proposal.amountCents,
      sections: proposal.versions[0]?.sections.map((section) => ({
        title: section.title,
        type: section.type,
        body:
          section.content && typeof section.content === "object" && "body" in section.content
            ? (section.content as { body?: string }).body
            : null,
      })),
      events: proposal.events.map((event) => ({ type: event.type, createdAt: event.createdAt })),
      signatures: proposal.signatures.map((signature) => ({
        signerName: signature.signerName,
        signerEmail: signature.signerEmail,
        signedAt: signature.signedAt,
        status: signature.status,
      })),
      payments: proposal.payments.map((payment) => ({
        amountCents: payment.amountCents,
        currency: payment.currency,
        status: payment.status,
        createdAt: payment.createdAt,
      })),
    })),
  };
}

export async function deleteAccountCascade(input: {
  userId: string;
  organizationId: string;
}) {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId,
      },
    },
  });
  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only the workspace owner can delete this account.");
  }

  const ownerCount = await prisma.organizationMember.count({
    where: { organizationId: input.organizationId, role: "OWNER" },
  });

  await writeAuditLog({
    organizationId: input.organizationId,
    userId: input.userId,
    action: "account.deleted",
    entityType: "User",
    entityId: input.userId,
  });

  if (ownerCount <= 1) {
    const now = new Date();
    await prisma.$transaction([
      prisma.proposal.updateMany({
        where: { organizationId: input.organizationId, deletedAt: null },
        data: { deletedAt: now, status: "ARCHIVED" },
      }),
      prisma.client.updateMany({
        where: { organizationId: input.organizationId, deletedAt: null },
        data: { deletedAt: now },
      }),
      prisma.organizationInvite.updateMany({
        where: { organizationId: input.organizationId, revokedAt: null },
        data: { revokedAt: now },
      }),
      prisma.organization.update({
        where: { id: input.organizationId },
        data: { deletedAt: now, slug: `deleted-${input.organizationId}` },
      }),
    ]);
  } else {
    await prisma.organizationMember.delete({
      where: { id: membership.id },
    });
  }

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: input.userId } }),
    prisma.account.deleteMany({ where: { userId: input.userId } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: input.userId } }),
    prisma.notification.deleteMany({ where: { userId: input.userId } }),
    prisma.user.update({
      where: { id: input.userId },
      data: {
        deletedAt: new Date(),
        email: `deleted+${input.userId}@deleted.proposalfast.invalid`,
        name: "Deleted user",
        passwordHash: null,
        image: null,
        platformAdmin: false,
      },
    }),
  ]);

  await clearActiveOrgCookie();
}

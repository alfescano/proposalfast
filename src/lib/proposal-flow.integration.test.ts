import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { recordProposalView } from "./proposals/record-view";
import { acceptPublicProposal, recordPublicSignature } from "./proposals/lifecycle";

const prisma = new PrismaClient();
const suffix = nanoid(8);

describe("register → create → send → open → accept → sign", () => {
  it("walks a proposal through the client lifecycle without Stripe", async () => {
    const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
    expect(free).toBeTruthy();

    const user = await prisma.user.create({
      data: {
        email: `flow-${suffix}@flow.test`,
        name: "Flow Owner",
        passwordHash: await bcrypt.hash("FlowPassword1", 12),
      },
    });
    const organization = await prisma.organization.create({
      data: {
        name: `Flow Studio ${suffix}`,
        slug: `flow-studio-${suffix}`,
        members: { create: { userId: user.id, role: "OWNER" } },
        settings: { create: { businessName: "Flow Studio", notifyOpened: true } },
        subscription: { create: { planId: free!.id, status: "ACTIVE" } },
      },
    });
    const client = await prisma.client.create({
      data: {
        organizationId: organization.id,
        name: "Casey Client",
        email: `casey-${suffix}@client.test`,
      },
    });
    const proposal = await prisma.proposal.create({
      data: {
        publicId: nanoid(12),
        organizationId: organization.id,
        clientId: client.id,
        title: "Lifecycle proposal",
        createdById: user.id,
        versions: {
          create: {
            version: 1,
            content: { source: "test" },
            createdById: user.id,
            sections: {
              create: {
                type: "cover",
                title: "Cover",
                sortOrder: 0,
                content: { body: "Facts only." },
              },
            },
          },
        },
        events: { create: { type: "created" } },
      },
    });

    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "SENT", sentAt: new Date() },
    });
    await prisma.proposalEvent.create({ data: { proposalId: proposal.id, type: "sent" } });

    await recordProposalView({
      proposalId: proposal.id,
      organizationId: organization.id,
      title: proposal.title,
      status: "SENT",
      viewedAt: null,
    });

    const accepted = await acceptPublicProposal({
      publicId: proposal.publicId,
      actorName: "Casey Client",
      actorEmail: client.email ?? undefined,
    });
    expect(accepted.ok).toBe(true);

    const afterAccept = await prisma.proposal.findUnique({ where: { id: proposal.id } });
    expect(afterAccept?.status).toBe("ACCEPTED");
    expect(afterAccept?.acceptedAt).toBeTruthy();

    const version = await prisma.proposalVersion.findFirst({
      where: { proposalId: proposal.id },
    });
    await recordPublicSignature({
      proposalId: proposal.id,
      organizationId: organization.id,
      title: proposal.title,
      organizationName: organization.name,
      owner: { email: user.email, name: user.name },
      versionId: version?.id,
      signerName: "Casey Client",
      signerEmail: client.email!,
      signatureType: "TYPED",
      signatureData: "typed:Casey Client",
    });

    const signed = await prisma.proposal.findUnique({
      where: { id: proposal.id },
      include: { signatures: true, events: true },
    });
    expect(signed?.status).toBe("SIGNED");
    expect(signed?.lockedAt).toBeTruthy();
    expect(signed?.signatures[0]?.status).toBe("SIGNED");
    expect(signed?.events.map((event) => event.type)).toEqual(
      expect.arrayContaining(["created", "sent", "viewed", "accepted", "signed"]),
    );

    const alerts = await prisma.notification.findMany({
      where: { organizationId: organization.id, userId: user.id },
    });
    expect(alerts.map((item) => item.type)).toEqual(
      expect.arrayContaining(["opened", "accepted", "signed"]),
    );
  });
});

afterAll(async () => {
  await prisma.organization.deleteMany({ where: { slug: { contains: suffix } } });
  await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
  await prisma.$disconnect();
});

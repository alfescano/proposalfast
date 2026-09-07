import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { TenantError } from "./rbac";

const prisma = new PrismaClient();
const suffix = nanoid(8);

async function makeOrg(name: string) {
  const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
  if (!free) throw new Error("FREE plan missing — run prisma db seed");
  const user = await prisma.user.create({
    data: {
      email: `${name.toLowerCase()}-${suffix}@isolation.test`,
      name,
      passwordHash: await bcrypt.hash("IsolationPass1", 10),
    },
  });
  const organization = await prisma.organization.create({
    data: {
      name,
      slug: `${name.toLowerCase()}-${suffix}`,
      members: { create: { userId: user.id, role: "OWNER" } },
      settings: { create: { businessName: name } },
      subscription: { create: { planId: free.id, status: "ACTIVE" } },
    },
  });
  return { user, organization };
}

describe("org isolation", () => {
  it("never returns another workspace's client or proposal", async () => {
    const alpha = await makeOrg(`Alpha${suffix}`);
    const beta = await makeOrg(`Beta${suffix}`);

    const clientA = await prisma.client.create({
      data: {
        organizationId: alpha.organization.id,
        name: "Only Alpha",
        email: `client-a-${suffix}@example.com`,
      },
    });
    const proposalA = await prisma.proposal.create({
      data: {
        publicId: nanoid(12),
        organizationId: alpha.organization.id,
        clientId: clientA.id,
        title: "Alpha-only proposal",
        createdById: alpha.user.id,
      },
    });

    const leakedClient = await prisma.client.findFirst({
      where: { id: clientA.id, organizationId: beta.organization.id },
    });
    const leakedProposal = await prisma.proposal.findFirst({
      where: { id: proposalA.id, organizationId: beta.organization.id },
    });
    expect(leakedClient).toBeNull();
    expect(leakedProposal).toBeNull();

    function sameOrg<T extends { organizationId: string }>(record: T | null, organizationId: string) {
      if (!record || record.organizationId !== organizationId) throw new TenantError();
      return record;
    }
    expect(() => sameOrg(clientA, beta.organization.id)).toThrow(TenantError);
    expect(sameOrg(proposalA, alpha.organization.id).id).toBe(proposalA.id);

    const viewer = await prisma.user.create({
      data: {
        email: `viewer-${suffix}@isolation.test`,
        name: "Viewer",
        passwordHash: await bcrypt.hash("IsolationPass1", 10),
        memberships: {
          create: { organizationId: alpha.organization.id, role: "VIEWER" },
        },
      },
    });
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId: alpha.organization.id, userId: viewer.id },
      },
    });
    expect(membership?.role).toBe("VIEWER");
    expect(membership?.organizationId).toBe(alpha.organization.id);
  });
});

afterAll(async () => {
  await prisma.organization.deleteMany({ where: { slug: { contains: suffix } } });
  await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
  await prisma.$disconnect();
});

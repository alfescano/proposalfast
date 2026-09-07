import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { processScheduledFollowUp } from "./follow-up";

const prisma = new PrismaClient();
const suffix = nanoid(8);

describe("follow-ups", () => {
  it("cancels when workspace or proposal opt-in is missing", async () => {
    const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
    const user = await prisma.user.create({
      data: {
        email: `fu-${suffix}@follow.test`,
        passwordHash: await bcrypt.hash("FollowPass1", 10),
      },
    });
    const organization = await prisma.organization.create({
      data: {
        name: `Follow ${suffix}`,
        slug: `follow-${suffix}`,
        members: { create: { userId: user.id, role: "OWNER" } },
        settings: { create: { followUpOptIn: false } },
        subscription: { create: { planId: free!.id, status: "ACTIVE" } },
      },
    });
    const proposal = await prisma.proposal.create({
      data: {
        publicId: nanoid(12),
        organizationId: organization.id,
        title: "Follow proposal",
        followUpOptIn: true,
        createdById: user.id,
      },
    });
    const followUp = await prisma.followUp.create({
      data: {
        organizationId: organization.id,
        proposalId: proposal.id,
        scheduledAt: new Date(),
        type: "reminder",
        status: "SCHEDULED",
      },
    });

    const result = await processScheduledFollowUp(followUp.id);
    expect(result).toMatchObject({ skipped: true, reason: "opt-in-required" });
    const stored = await prisma.followUp.findUnique({ where: { id: followUp.id } });
    expect(stored?.status).toBe("CANCELED");
  });

  it("sends via the console adapter when both opt-ins are on", async () => {
    const organization = await prisma.organization.findFirst({
      where: { slug: `follow-${suffix}` },
    });
    const user = await prisma.user.findFirst({ where: { email: `fu-${suffix}@follow.test` } });
    expect(organization && user).toBeTruthy();
    await prisma.settings.update({
      where: { organizationId: organization!.id },
      data: { followUpOptIn: true },
    });
    const client = await prisma.client.create({
      data: {
        organizationId: organization!.id,
        name: "Follow Client",
        email: `follow-client-${suffix}@example.com`,
      },
    });
    const proposal = await prisma.proposal.create({
      data: {
        publicId: nanoid(12),
        organizationId: organization!.id,
        clientId: client.id,
        title: "Opted-in follow proposal",
        followUpOptIn: true,
        createdById: user!.id,
      },
    });
    const followUp = await prisma.followUp.create({
      data: {
        organizationId: organization!.id,
        proposalId: proposal.id,
        scheduledAt: new Date(),
        type: "reminder",
        status: "SCHEDULED",
      },
    });
    const result = await processScheduledFollowUp(followUp.id);
    expect(result).toEqual({ ok: true });
    const stored = await prisma.followUp.findUnique({ where: { id: followUp.id } });
    expect(stored?.status).toBe("SENT");
    expect(stored?.sentAt).toBeTruthy();
  });
});

afterAll(async () => {
  await prisma.organization.deleteMany({ where: { slug: { contains: suffix } } });
  await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
  await prisma.$disconnect();
});

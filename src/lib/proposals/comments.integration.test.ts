import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { addPublicCommentAction } from "@/actions/public";

const prisma = new PrismaClient();
const suffix = nanoid(8);

describe("client comments", () => {
  it("stores a portal comment on the current version and notifies the owner", async () => {
    const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
    expect(free).toBeTruthy();
    const user = await prisma.user.create({
      data: {
        email: `comment-owner-${suffix}@flow.test`,
        name: "Comment Owner",
        passwordHash: await bcrypt.hash("CommentPass1", 10),
      },
    });
    const organization = await prisma.organization.create({
      data: {
        name: `Comment Studio ${suffix}`,
        slug: `comment-studio-${suffix}`,
        members: { create: { userId: user.id, role: "OWNER" } },
        settings: { create: { businessName: "Comment Studio", notifyComment: true } },
        subscription: { create: { planId: free!.id, status: "ACTIVE" } },
      },
    });
    const proposal = await prisma.proposal.create({
      data: {
        publicId: nanoid(12),
        organizationId: organization.id,
        title: "Commentable proposal",
        commentsEnabled: true,
        createdById: user.id,
        versions: {
          create: {
            version: 1,
            content: { source: "test" },
            createdById: user.id,
            sections: {
              create: { type: "paragraph", title: "Scope", sortOrder: 0, content: { body: "Facts." } },
            },
          },
        },
      },
    });

    const form = new FormData();
    form.set("publicId", proposal.publicId);
    form.set("authorName", "Casey Client");
    form.set("authorEmail", `casey-${suffix}@client.test`);
    form.set("body", "Can you confirm the kickoff week?");
    const result = await addPublicCommentAction(form);
    expect(result.ok).toBe(true);

    const stored = await prisma.proposalComment.findFirst({
      where: { proposalId: proposal.id },
      include: { version: true },
    });
    expect(stored?.body).toMatch(/kickoff/);
    expect(stored?.version?.version).toBe(1);

    const note = await prisma.notification.findFirst({
      where: { organizationId: organization.id, type: "comment" },
    });
    expect(note?.title).toMatch(/comment/i);
  });

  it("refuses comments when the owner did not opt in", async () => {
    const proposal = await prisma.proposal.findFirst({
      where: { organization: { slug: `comment-studio-${suffix}` } },
    });
    expect(proposal).toBeTruthy();
    await prisma.proposal.update({
      where: { id: proposal!.id },
      data: { commentsEnabled: false },
    });
    const form = new FormData();
    form.set("publicId", proposal!.publicId);
    form.set("authorName", "Casey Client");
    form.set("authorEmail", `casey2-${suffix}@client.test`);
    form.set("body", "This should be rejected.");
    const result = await addPublicCommentAction(form);
    expect(result.ok).toBe(false);
  });
});

afterAll(async () => {
  await prisma.organization.deleteMany({ where: { slug: { contains: suffix } } });
  await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
  await prisma.$disconnect();
});

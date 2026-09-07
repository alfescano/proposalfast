import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { PlanLimitError, TenantError } from "./rbac";
import { updateClientForOrg, getClientForOrg, deleteClientForOrg } from "./clients/write";
import { saveProposalSectionsForOrg, setProposalStatusForOrg } from "./proposals/save-sections";
import { persistGeneratedVersion } from "./proposals/persist-generation";
import { loadOrgAnalytics } from "./org-analytics";
import { assertPlanCapacity } from "./plan-capacity";

const prisma = new PrismaClient();
const suffix = nanoid(8);

async function makeOrg(name: string) {
  const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
  if (!free) throw new Error("FREE plan missing — run prisma db seed");
  const user = await prisma.user.create({
    data: {
      email: `${name.toLowerCase()}-${suffix}@write-isolation.test`,
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

describe("cross-org write isolation (fail closed)", () => {
  it("refuses client / proposal / file / analytics / billing leaks by id", async () => {
    const alpha = await makeOrg(`AlphaW${suffix}`);
    const beta = await makeOrg(`BetaW${suffix}`);

    const clientA = await prisma.client.create({
      data: {
        organizationId: alpha.organization.id,
        name: "Alpha Client",
        email: `client-a-${suffix}@example.com`,
      },
    });
    const proposalA = await prisma.proposal.create({
      data: {
        publicId: nanoid(12),
        organizationId: alpha.organization.id,
        clientId: clientA.id,
        title: "Alpha proposal",
        createdById: alpha.user.id,
        versions: {
          create: {
            version: 1,
            content: { source: "test" },
            createdById: alpha.user.id,
            sections: {
              create: {
                type: "paragraph",
                title: "Scope",
                sortOrder: 0,
                content: { body: "Alpha only." },
              },
            },
          },
        },
        events: { create: { type: "created" } },
      },
    });
    const versionA = await prisma.proposalVersion.findFirst({
      where: { proposalId: proposalA.id },
      include: { sections: true },
    });
    const sectionA = versionA!.sections[0];

    const fileA = await prisma.file.create({
      data: {
        organizationId: alpha.organization.id,
        proposalId: proposalA.id,
        key: `org/${alpha.organization.id}/private/${suffix}.pdf`,
        filename: "private.pdf",
        mimeType: "application/pdf",
        sizeBytes: 128,
        createdById: alpha.user.id,
      },
    });

    await prisma.payment.create({
      data: {
        organizationId: alpha.organization.id,
        proposalId: proposalA.id,
        amountCents: 120000,
        status: "SUCCEEDED",
        description: "should not leak",
      },
    });

    await expect(getClientForOrg(beta.organization.id, clientA.id)).rejects.toBeInstanceOf(TenantError);
    await expect(
      updateClientForOrg(beta.organization.id, clientA.id, { name: "Hacked" }),
    ).rejects.toBeInstanceOf(TenantError);
    await expect(deleteClientForOrg(beta.organization.id, clientA.id)).rejects.toBeInstanceOf(TenantError);

    const afterClient = await prisma.client.findUnique({ where: { id: clientA.id } });
    expect(afterClient?.name).toBe("Alpha Client");
    expect(afterClient?.deletedAt).toBeNull();

    await expect(
      saveProposalSectionsForOrg(beta.organization.id, proposalA.id, [
        { id: sectionA.id, title: "Hacked", body: "leaked", type: "paragraph" },
      ]),
    ).rejects.toBeInstanceOf(TenantError);

    const proposalB = await prisma.proposal.create({
      data: {
        publicId: nanoid(12),
        organizationId: beta.organization.id,
        title: "Beta proposal",
        createdById: beta.user.id,
        versions: {
          create: {
            version: 1,
            content: { source: "test" },
            createdById: beta.user.id,
            sections: {
              create: {
                type: "paragraph",
                title: "Beta",
                sortOrder: 0,
                content: { body: "Beta body." },
              },
            },
          },
        },
      },
    });

    await expect(
      saveProposalSectionsForOrg(beta.organization.id, proposalB.id, [
        { id: sectionA.id, title: "Hacked via section id", body: "cross-tenant", type: "paragraph" },
      ]),
    ).rejects.toBeInstanceOf(TenantError);

    const sectionAfter = await prisma.proposalSection.findUnique({ where: { id: sectionA.id } });
    expect((sectionAfter?.content as { body?: string }).body).toBe("Alpha only.");

    await expect(setProposalStatusForOrg(beta.organization.id, proposalA.id, "ARCHIVED")).rejects.toBeInstanceOf(
      TenantError,
    );

    await expect(
      persistGeneratedVersion({
        proposalId: proposalA.id,
        organizationId: beta.organization.id,
        userId: beta.user.id,
        result: {
          facts: [],
          missing: [],
          outline: [],
          sections: [{ title: "X", type: "custom", body: "no", placeholders: [] }],
          qc: { invented: [], missing: [], ok: true },
          score: {
            completeness: 10,
            fidelity: 10,
            clarity: 10,
            commercialReadiness: 10,
            overall: 10,
            notes: [],
          },
        },
      }),
    ).rejects.toThrow(/not found for this organization/i);

    const leakedFile = await prisma.file.findFirst({
      where: { id: fileA.id, organizationId: beta.organization.id },
    });
    expect(leakedFile).toBeNull();

    const leakedPayment = await prisma.payment.findFirst({
      where: { organizationId: beta.organization.id, proposalId: proposalA.id },
    });
    expect(leakedPayment).toBeNull();

    const leakedUser = await prisma.organizationMember.findFirst({
      where: { organizationId: beta.organization.id, userId: alpha.user.id },
    });
    expect(leakedUser).toBeNull();

    const betaAnalytics = await loadOrgAnalytics(beta.organization.id);
    expect(betaAnalytics.funnel.find((step) => step.key === "first_proposal")?.value).toBe(1);
    expect(betaAnalytics.funnel.find((step) => step.key === "paid")?.value).toBe(0);

    const alphaAnalytics = await loadOrgAnalytics(alpha.organization.id);
    expect(alphaAnalytics.funnel.find((step) => step.key === "paid")?.value).toBe(1);

    const leakedSub = await prisma.subscription.findFirst({
      where: { organizationId: beta.organization.id, stripeCustomerId: { not: null } },
    });
    expect(leakedSub).toBeNull();
    const alphaSub = await prisma.subscription.findUnique({
      where: { organizationId: alpha.organization.id },
    });
    expect(alphaSub?.organizationId).toBe(alpha.organization.id);
  });

  it("enforces FREE proposal cap server-side (direct capacity check)", async () => {
    const org = await makeOrg(`Limit${suffix}`);
    for (let i = 0; i < 5; i += 1) {
      await prisma.proposal.create({
        data: {
          publicId: nanoid(12),
          organizationId: org.organization.id,
          title: `Cap ${i}`,
          createdById: org.user.id,
        },
      });
    }
    await expect(assertPlanCapacity(org.organization.id, "proposals")).rejects.toBeInstanceOf(PlanLimitError);
  });
});

afterAll(async () => {
  await prisma.organization.deleteMany({ where: { slug: { contains: suffix } } });
  await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
  await prisma.$disconnect();
});

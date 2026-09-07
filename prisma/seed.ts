import { PrismaClient, PlanTier } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { PLAN_CATALOG, stripePriceEnvFor } from "../src/lib/plans";
import { SYSTEM_TEMPLATES } from "../src/lib/templates/catalog";
import { shouldSeedSampleData } from "../src/lib/seed-policy";

const prisma = new PrismaClient();

async function seedPlans() {
  for (const plan of Object.values(PLAN_CATALOG)) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      create: {
        tier: plan.tier,
        name: plan.name,
        description: plan.description,
        monthlyPriceCents: plan.monthlyPriceCents,
        yearlyPriceCents: plan.yearlyPriceCents,
        stripePriceIdMonthly: stripePriceEnvFor(plan.tier, "month"),
        stripePriceIdYearly: stripePriceEnvFor(plan.tier, "year"),
        maxProposals: plan.limits.maxProposals,
        maxClients: plan.limits.maxClients,
        maxMembers: plan.limits.maxMembers,
        maxAiGenerationsPerMonth: plan.limits.maxAiGenerationsPerMonth,
        features: plan.features,
      },
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPriceCents: plan.monthlyPriceCents,
        yearlyPriceCents: plan.yearlyPriceCents,
        stripePriceIdMonthly: stripePriceEnvFor(plan.tier, "month"),
        stripePriceIdYearly: stripePriceEnvFor(plan.tier, "year"),
        maxProposals: plan.limits.maxProposals,
        maxClients: plan.limits.maxClients,
        maxMembers: plan.limits.maxMembers,
        maxAiGenerationsPerMonth: plan.limits.maxAiGenerationsPerMonth,
        features: plan.features,
      },
    });
  }
}

async function seedSystemTemplates() {
  for (const template of SYSTEM_TEMPLATES) {
    const existing = await prisma.proposalTemplate.findFirst({
      where: { isSystem: true, name: template.name, organizationId: null },
    });
    const data = {
      name: template.name,
      description: template.description,
      category: template.category,
      industry: template.industry,
      isSystem: true,
      content: { sections: template.sections },
    };
    if (existing) {
      await prisma.proposalTemplate.update({ where: { id: existing.id }, data });
    } else {
      await prisma.proposalTemplate.create({ data });
    }
  }
}

async function seedSampleData() {
  if (!shouldSeedSampleData()) {
    console.log("Skipping sample data (production or SEED_SAMPLE_DATA=false).");
    return;
  }

  const email = "alex@proposalfast.dev";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { platformAdmin: process.env.NODE_ENV !== "production" },
    });
    console.log("Sample user already exists:", email);
    const freeExisting = await prisma.plan.findUnique({ where: { tier: PlanTier.FREE } });
    if (freeExisting) await seedNonAdminMember(freeExisting.id);
    return;
  }

  const free = await prisma.plan.findUnique({ where: { tier: PlanTier.FREE } });
  if (!free) throw new Error("FREE plan missing");

  const passwordHash = await bcrypt.hash("DemoPassword123!", 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Alex Rivera",
      emailVerified: new Date(),
      passwordHash,
      platformAdmin: true,
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: "Northline Studio",
      slug: "northline-studio",
      industry: "Design consultancy",
      website: "https://northline.example",
      members: { create: { userId: user.id, role: "OWNER" } },
      settings: {
        create: {
          businessName: "Northline Studio",
          tagline: "Brand systems for operators",
          brandColor: "#152033",
          defaultCurrency: "USD",
          onboardingCompleted: true,
          emailFromName: "Alex at Northline",
        },
      },
      subscription: { create: { planId: free.id, status: "ACTIVE" } },
    },
  });

  const client = await prisma.client.create({
    data: {
      organizationId: organization.id,
      name: "Jordan Hale",
      email: "jordan@harborandco.example",
      company: "Harbor & Co",
      notes: "DEV SAMPLE — fictional company for local UI testing only.",
    },
  });

  const template = await prisma.proposalTemplate.findFirst({
    where: { isSystem: true, category: "consulting" },
  });

  await prisma.proposal.create({
    data: {
      publicId: nanoid(12),
      organizationId: organization.id,
      clientId: client.id,
      templateId: template?.id,
      title: "Brand system for Harbor & Co (sample)",
      status: "DRAFT",
      createdById: user.id,
      versions: {
        create: {
          version: 1,
          content: { source: "seed", notice: "DEV SAMPLE" },
          createdById: user.id,
          sections: {
            create: [
              {
                type: "cover",
                title: "Proposal",
                sortOrder: 0,
                content: {
                  body: "Prepared for Harbor & Co by Northline Studio. This record is development-only sample data.",
                },
              },
              {
                type: "pricing",
                title: "Investment",
                sortOrder: 1,
                content: { body: "[PLACEHOLDER: confirm fee with Alex before sending]" },
              },
            ],
          },
        },
      },
    },
  });

  console.log("Seeded DEV-ONLY sample user:");
  console.log("  email:    alex@proposalfast.dev");
  console.log("  password: DemoPassword123!");
  console.log("  org:      Northline Studio");

  await seedNonAdminMember(free.id);
}

async function seedNonAdminMember(freePlanId: string) {
  const email = "member@proposalfast.dev";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { platformAdmin: false },
    });
    return;
  }

  const passwordHash = await bcrypt.hash("MemberPassword123!", 12);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Jordan Member",
      emailVerified: new Date(),
      passwordHash,
      platformAdmin: false,
    },
  });
  await prisma.organization.create({
    data: {
      name: "Member Studio",
      slug: "member-studio",
      members: { create: { userId: user.id, role: "OWNER" } },
      settings: {
        create: {
          businessName: "Member Studio",
          onboardingCompleted: true,
        },
      },
      subscription: { create: { planId: freePlanId, status: "ACTIVE" } },
    },
  });
  console.log("Seeded DEV-ONLY non-admin user:");
  console.log("  email:    member@proposalfast.dev");
  console.log("  password: MemberPassword123!");
}

async function main() {
  await seedPlans();
  await seedSystemTemplates();
  await seedSampleData();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

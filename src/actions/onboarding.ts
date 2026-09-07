"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";
import { writeAuditLog } from "@/lib/audit";
import { onboardingSchema } from "@/lib/validations/org";

export async function completeOnboarding(formData: FormData) {
  const ctx = await requireOrg("ADMIN");
  const parsed = onboardingSchema.safeParse({
    businessName: formData.get("businessName"),
    industry: formData.get("industry"),
    website: formData.get("website"),
    tagline: formData.get("tagline"),
    defaultCurrency: formData.get("defaultCurrency"),
    brandColor: formData.get("brandColor"),
  });

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  await prisma.$transaction([
    prisma.organization.update({
      where: { id: ctx.organization.id },
      data: {
        name: parsed.data.businessName,
        industry: parsed.data.industry,
        website: parsed.data.website,
      },
    }),
    prisma.settings.upsert({
      where: { organizationId: ctx.organization.id },
      create: {
        organizationId: ctx.organization.id,
        businessName: parsed.data.businessName,
        tagline: parsed.data.tagline || null,
        brandColor: parsed.data.brandColor || null,
        defaultCurrency: parsed.data.defaultCurrency,
        onboardingCompleted: true,
      },
      update: {
        businessName: parsed.data.businessName,
        tagline: parsed.data.tagline || null,
        brandColor: parsed.data.brandColor || null,
        defaultCurrency: parsed.data.defaultCurrency,
        onboardingCompleted: true,
      },
    }),
  ]);

  await writeAuditLog({
    organizationId: ctx.organization.id,
    userId: ctx.user.id,
    action: "onboarding.completed",
    entityType: "Organization",
    entityId: ctx.organization.id,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function skipOnboarding() {
  const ctx = await requireOrg("ADMIN");
  await prisma.settings.upsert({
    where: { organizationId: ctx.organization.id },
    create: {
      organizationId: ctx.organization.id,
      onboardingCompleted: true,
    },
    update: { onboardingCompleted: true },
  });
  return { ok: true as const };
}

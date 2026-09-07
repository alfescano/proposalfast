"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { assertPlanCapacity, requireOrg, requireWritableOrg } from "@/lib/org";
import { writeAuditLog } from "@/lib/audit";
import { TenantError } from "@/lib/rbac";
import { getEmailAdapter, mail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";
import { inngest } from "@/lib/inngest/client";
import { proposalCreateSchema, proposalGenerateSchema } from "@/lib/validations/proposal";

type TemplateContent = {
  sections: { type: string; title: string; body?: string }[];
};

export async function createProposalAction(formData: FormData) {
  const ctx = await requireWritableOrg();
  const parsed = proposalCreateSchema.safeParse({
    title: formData.get("title"),
    clientId: formData.get("clientId") || undefined,
    templateId: formData.get("templateId") || undefined,
    currency: formData.get("currency") || "USD",
    validUntil: formData.get("validUntil") || undefined,
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  await assertPlanCapacity(ctx.organization.id, "proposals");

  if (parsed.data.clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: parsed.data.clientId,
        organizationId: ctx.organization.id,
        deletedAt: null,
      },
    });
    if (!client) throw new TenantError();
  }

  const template = parsed.data.templateId
    ? await prisma.proposalTemplate.findFirst({
        where: {
          id: parsed.data.templateId,
          deletedAt: null,
          OR: [{ isSystem: true }, { organizationId: ctx.organization.id }],
        },
      })
    : await prisma.proposalTemplate.findFirst({
        where: { isSystem: true, category: "consulting", deletedAt: null },
      });

  const sections = ((template?.content as TemplateContent | null)?.sections ?? [
    { type: "cover", title: "Cover", body: "" },
    { type: "introduction", title: "Introduction", body: "" },
    { type: "scope", title: "Scope", body: "" },
    { type: "pricing", title: "Investment", body: "[PLACEHOLDER: pricing]" },
    { type: "next_steps", title: "Next steps", body: "" },
  ]).map((section, index) => ({
    type: section.type,
    title: section.title,
    sortOrder: index,
    content: { body: section.body ?? "", placeholders: [] as string[] },
  }));

  const proposal = await prisma.proposal.create({
    data: {
      publicId: nanoid(12),
      organizationId: ctx.organization.id,
      clientId: parsed.data.clientId || null,
      templateId: template?.id,
      title: parsed.data.title,
      currency: parsed.data.currency,
      validUntil: parsed.data.validUntil ? new Date(parsed.data.validUntil) : null,
      createdById: ctx.user.id,
      versions: {
        create: {
          version: 1,
          content: { source: "manual" },
          createdById: ctx.user.id,
          sections: { create: sections },
        },
      },
      events: {
        create: { type: "created", metadata: { templateId: template?.id } },
      },
    },
  });

  await writeAuditLog({
    organizationId: ctx.organization.id,
    userId: ctx.user.id,
    action: "proposal.created",
    entityType: "Proposal",
    entityId: proposal.id,
  });

  revalidatePath("/proposals");
  revalidatePath("/dashboard");
  return { ok: true as const, id: proposal.id };
}

export async function updateProposalMetaAction(proposalId: string, formData: FormData) {
  const ctx = await requireWritableOrg();
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, organizationId: ctx.organization.id, deletedAt: null },
  });
  if (!proposal) throw new TenantError();

  const title = String(formData.get("title") ?? proposal.title).trim();
  const clientId = String(formData.get("clientId") ?? "") || null;
  const currency = String(formData.get("currency") ?? proposal.currency);
  const validUntil = String(formData.get("validUntil") ?? "");

  if (title.length < 3) {
    return { ok: false as const, error: "Title is too short." };
  }

  if (clientId) {
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId: ctx.organization.id, deletedAt: null },
    });
    if (!client) throw new TenantError();
  }

  await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      title,
      clientId,
      currency,
      validUntil: validUntil ? new Date(validUntil) : null,
    },
  });

  revalidatePath(`/proposals/${proposalId}`);
  revalidatePath("/proposals");
  return { ok: true as const };
}

export async function saveProposalSectionsAction(
  proposalId: string,
  sections: { id: string; title: string; body: string }[],
) {
  const ctx = await requireWritableOrg();
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, organizationId: ctx.organization.id, deletedAt: null },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });
  if (!proposal) throw new TenantError();

  await prisma.$transaction(
    sections.map((section) =>
      prisma.proposalSection.update({
        where: { id: section.id },
        data: {
          title: section.title,
          content: { body: section.body, placeholders: extractPlaceholders(section.body) },
        },
      }),
    ),
  );

  revalidatePath(`/proposals/${proposalId}`);
  return { ok: true as const };
}

export async function archiveProposalAction(proposalId: string) {
  const ctx = await requireWritableOrg();
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, organizationId: ctx.organization.id, deletedAt: null },
  });
  if (!proposal) throw new TenantError();

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "ARCHIVED", deletedAt: new Date() },
  });
  revalidatePath("/proposals");
  return { ok: true as const };
}

export async function sendProposalAction(proposalId: string) {
  const ctx = await requireWritableOrg();
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, organizationId: ctx.organization.id, deletedAt: null },
    include: { client: true, organization: true },
  });
  if (!proposal) throw new TenantError();
  if (!proposal.client?.email) {
    return { ok: false as const, error: "Add a client email before sending." };
  }

  const portalUrl = absoluteUrl(`/p/${proposal.publicId}`);
  const template = mail.templates.proposalSentEmail({
    clientName: proposal.client.name,
    senderName: ctx.organization.name,
    title: proposal.title,
    portalUrl,
  });
  await getEmailAdapter().send({ to: proposal.client.email, ...template });

  await prisma.proposal.update({
    where: { id: proposalId },
    data: { status: "SENT", sentAt: new Date() },
  });
  await prisma.proposalEvent.create({
    data: { proposalId, type: "sent", metadata: { to: proposal.client.email } },
  });

  revalidatePath(`/proposals/${proposalId}`);
  return { ok: true as const, portalUrl };
}

export async function queueProposalGenerationAction(formData: FormData) {
  const ctx = await requireWritableOrg();
  const parsed = proposalGenerateSchema.safeParse({
    proposalId: formData.get("proposalId"),
    brief: formData.get("brief"),
    facts: String(formData.get("facts") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the brief." };
  }

  const proposal = await prisma.proposal.findFirst({
    where: { id: parsed.data.proposalId, organizationId: ctx.organization.id, deletedAt: null },
    include: { client: true },
  });
  if (!proposal) throw new TenantError();

  await prisma.proposal.update({
    where: { id: proposal.id },
    data: { status: "GENERATING" },
  });

  if (process.env.INNGEST_EVENT_KEY) {
    await inngest.send({
      name: "proposal/generate",
      data: {
        proposalId: proposal.id,
        brief: parsed.data.brief,
        facts: parsed.data.facts,
        organizationId: ctx.organization.id,
        userId: ctx.user.id,
        businessName: ctx.organization.name,
        clientName: proposal.client?.name,
      },
    });
  } else if (process.env.OPENAI_API_KEY) {
    const { runProposalPipeline } = await import("@/lib/ai/pipeline");
    const result = await runProposalPipeline({
      brief: parsed.data.brief,
      facts: parsed.data.facts,
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      businessName: ctx.organization.name,
      clientName: proposal.client?.name ?? undefined,
    });
    const latest = await prisma.proposalVersion.findFirst({
      where: { proposalId: proposal.id },
      orderBy: { version: "desc" },
    });
    await prisma.proposalVersion.create({
      data: {
        proposalId: proposal.id,
        version: (latest?.version ?? 0) + 1,
        content: result as object,
        createdById: ctx.user.id,
        sections: {
          create: result.sections.map((section, index) => ({
            type: section.type,
            title: section.title,
            sortOrder: index,
            content: { body: section.body, placeholders: section.placeholders },
          })),
        },
      },
    });
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: "REVIEW" },
    });
  } else {
    await prisma.proposal.update({
      where: { id: proposal.id },
      data: { status: proposal.status },
    });
    return {
      ok: false as const,
      error: "OPENAI_API_KEY is not set. ProposalFast will not invent proposal copy.",
    };
  }

  revalidatePath(`/proposals/${proposal.id}`);
  return { ok: true as const };
}

export async function setProposalStatusAction(proposalId: string, status: ProposalStatus) {
  const ctx = await requireOrg("MEMBER");
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, organizationId: ctx.organization.id, deletedAt: null },
  });
  if (!proposal) throw new TenantError();
  await prisma.proposal.update({ where: { id: proposalId }, data: { status } });
  revalidatePath(`/proposals/${proposalId}`);
  return { ok: true as const };
}

function extractPlaceholders(body: string) {
  return [...body.matchAll(/\[PLACEHOLDER:[^\]]+\]/g)].map((match) => match[0]);
}

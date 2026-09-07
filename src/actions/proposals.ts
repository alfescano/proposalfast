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
import { proposalCreateSchema, proposalGenerateSchema, rewriteSelectionSchema } from "@/lib/validations/proposal";
import { isProposalLocked, ProposalLockedError } from "@/lib/proposal-lock";
import { persistGeneratedVersion } from "@/lib/proposals/persist-generation";
import { PlanLimitError } from "@/lib/rbac";

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
    brief: formData.get("brief") || undefined,
    facts: formData.get("facts") || undefined,
    useAi: formData.get("useAi") || undefined,
    paymentEnabled: formData.get("paymentEnabled") || undefined,
    paymentMode: formData.get("paymentMode") || undefined,
    amount: formData.get("amount") || undefined,
    depositPercent: formData.get("depositPercent") || undefined,
    followUpOptIn: formData.get("followUpOptIn") || undefined,
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
      paymentEnabled: Boolean(parsed.data.paymentEnabled),
      paymentMode: parsed.data.paymentMode || "FULL",
      amountCents: parsed.data.amount ? Math.round(Number(parsed.data.amount) * 100) : null,
      depositPercent: parsed.data.depositPercent ? Number(parsed.data.depositPercent) : null,
      followUpOptIn: Boolean(parsed.data.followUpOptIn),
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

  const brief = parsed.data.brief?.trim();
  if (parsed.data.useAi && brief && brief.length >= 20) {
    const facts = (parsed.data.facts ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    try {
      if (process.env.OPENAI_API_KEY) {
        const { runProposalPipeline } = await import("@/lib/ai/pipeline");
        const result = await runProposalPipeline({
          brief,
          facts,
          organizationId: ctx.organization.id,
          userId: ctx.user.id,
          businessName: ctx.organization.name,
        });
        await persistGeneratedVersion({
          proposalId: proposal.id,
          organizationId: ctx.organization.id,
          userId: ctx.user.id,
          result,
        });
      }
    } catch (error) {
      if (error instanceof PlanLimitError) {
        return { ok: true as const, id: proposal.id, warning: error.message };
      }
      console.error(error);
    }
  }

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
  if (isProposalLocked(proposal)) throw new ProposalLockedError();

  const title = String(formData.get("title") ?? proposal.title).trim();
  const clientId = String(formData.get("clientId") ?? "") || null;
  const currency = String(formData.get("currency") ?? proposal.currency);
  const validUntil = String(formData.get("validUntil") ?? "");
  const paymentEnabled = formData.get("paymentEnabled") === "on";
  const paymentMode = (formData.get("paymentMode") as "FULL" | "DEPOSIT" | "FIXED") || proposal.paymentMode;
  const amount = String(formData.get("amount") ?? "");
  const depositPercent = String(formData.get("depositPercent") ?? "");
  const followUpOptIn = formData.get("followUpOptIn") === "on";

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
      paymentEnabled,
      paymentMode,
      amountCents: amount ? Math.round(Number(amount) * 100) : proposal.amountCents,
      depositPercent: depositPercent ? Number(depositPercent) : proposal.depositPercent,
      followUpOptIn,
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
  if (isProposalLocked(proposal)) throw new ProposalLockedError();

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
  if (isProposalLocked(proposal)) throw new ProposalLockedError();

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

  const settings = await prisma.settings.findUnique({
    where: { organizationId: ctx.organization.id },
  });
  if (proposal.followUpOptIn && settings?.followUpOptIn) {
    const scheduledAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3);
    const followUp = await prisma.followUp.create({
      data: {
        organizationId: ctx.organization.id,
        proposalId,
        scheduledAt,
        type: "reminder",
        status: "SCHEDULED",
      },
    });
    if (process.env.INNGEST_EVENT_KEY) {
      await inngest.send({ name: "proposal/follow-up", data: { followUpId: followUp.id } });
    }
  }

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
  if (isProposalLocked(proposal)) throw new ProposalLockedError();

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
    await persistGeneratedVersion({
      proposalId: proposal.id,
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
      result,
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

export async function rewriteSectionAction(formData: FormData) {
  const ctx = await requireWritableOrg();
  const parsed = rewriteSelectionSchema.safeParse({
    proposalId: formData.get("proposalId"),
    sectionId: formData.get("sectionId"),
    selectedText: formData.get("selectedText"),
    mode: formData.get("mode"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Select text to rewrite." };
  }

  const proposal = await prisma.proposal.findFirst({
    where: { id: parsed.data.proposalId, organizationId: ctx.organization.id, deletedAt: null },
  });
  if (!proposal) throw new TenantError();
  if (isProposalLocked(proposal)) throw new ProposalLockedError();

  const section = await prisma.proposalSection.findFirst({
    where: { id: parsed.data.sectionId, version: { proposalId: proposal.id } },
  });
  if (!section) throw new TenantError();

  try {
    const { rewriteSelection } = await import("@/lib/ai/rewrite");
    const rewritten = await rewriteSelection({
      text: parsed.data.selectedText,
      mode: parsed.data.mode,
      organizationId: ctx.organization.id,
      userId: ctx.user.id,
    });
    const currentBody =
      section.content && typeof section.content === "object" && "body" in section.content
        ? String((section.content as { body?: string }).body ?? "")
        : "";
    const nextBody = currentBody.includes(parsed.data.selectedText)
      ? currentBody.replace(parsed.data.selectedText, rewritten.text)
      : rewritten.text;

    await prisma.proposalSection.update({
      where: { id: section.id },
      data: {
        content: { body: nextBody, placeholders: extractPlaceholders(nextBody) },
      },
    });
    revalidatePath(`/proposals/${proposal.id}`);
    return { ok: true as const, text: rewritten.text, body: nextBody };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Rewrite failed.",
    };
  }
}

function extractPlaceholders(body: string) {
  return [...body.matchAll(/\[PLACEHOLDER:[^\]]+\]/g)].map((match) => match[0]);
}

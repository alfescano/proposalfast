"use server";

import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/crypto";
import { getEmailAdapter, mail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import { assertPlanCapacity, requireOrg } from "@/lib/org";
import { setActiveOrgCookie } from "@/lib/org-cookie";
import { AuthorizationError, TenantError, canManageMembers } from "@/lib/rbac";
import { absoluteUrl } from "@/lib/site";

const inviteSchema = z.object({
  email: z.string().trim().email().max(254).toLowerCase(),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]),
});

export async function inviteMemberAction(formData: FormData) {
  const ctx = await requireOrg("ADMIN");
  if (!canManageMembers(ctx.role)) throw new AuthorizationError();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") || "MEMBER",
  });
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the invite." };
  }

  if (parsed.data.email === ctx.user.email) {
    return { ok: false as const, error: "You are already in this workspace." };
  }

  const existingMember = await prisma.organizationMember.findFirst({
    where: {
      organizationId: ctx.organization.id,
      user: { email: parsed.data.email, deletedAt: null },
    },
  });
  if (existingMember) {
    return { ok: false as const, error: "That person is already a member." };
  }

  await assertPlanCapacity(ctx.organization.id, "members");

  const pending = await prisma.organizationInvite.findFirst({
    where: {
      organizationId: ctx.organization.id,
      email: parsed.data.email,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (pending) {
    return { ok: false as const, error: "An invite is already pending for that email." };
  }

  const token = generateToken();
  const invite = await prisma.organizationInvite.create({
    data: {
      organizationId: ctx.organization.id,
      email: parsed.data.email,
      role: parsed.data.role,
      tokenHash: sha256(token),
      invitedById: ctx.user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });

  const inviteUrl = absoluteUrl(`/invite/${token}`);
  await getEmailAdapter().send({
    to: parsed.data.email,
    ...mail.templates.teamInviteEmail({
      inviteeEmail: parsed.data.email,
      orgName: ctx.organization.name,
      inviterName: ctx.user.name ?? ctx.user.email,
      role: parsed.data.role.toLowerCase(),
      inviteUrl,
    }),
  });

  await writeAuditLog({
    organizationId: ctx.organization.id,
    userId: ctx.user.id,
    action: "member.invited",
    entityType: "OrganizationInvite",
    entityId: invite.id,
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/settings");
  return { ok: true as const, inviteUrl };
}

export async function revokeInviteAction(inviteId: string) {
  const ctx = await requireOrg("ADMIN");
  const invite = await prisma.organizationInvite.findFirst({
    where: { id: inviteId, organizationId: ctx.organization.id },
  });
  if (!invite) throw new TenantError();
  await prisma.organizationInvite.update({
    where: { id: inviteId },
    data: { revokedAt: new Date() },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function updateMemberRoleAction(memberId: string, role: Role) {
  const ctx = await requireOrg("ADMIN");
  if (!canManageMembers(ctx.role)) throw new AuthorizationError();
  if (role === "OWNER" && ctx.role !== "OWNER") {
    return { ok: false as const, error: "Only an owner can grant ownership." };
  }

  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: ctx.organization.id },
  });
  if (!member) throw new TenantError();
  if (member.userId === ctx.user.id && role !== "OWNER") {
    return { ok: false as const, error: "You cannot demote yourself." };
  }
  if (member.role === "OWNER") {
    const owners = await prisma.organizationMember.count({
      where: { organizationId: ctx.organization.id, role: "OWNER" },
    });
    if (owners <= 1 && role !== "OWNER") {
      return { ok: false as const, error: "Keep at least one owner." };
    }
  }

  await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
  });
  await writeAuditLog({
    organizationId: ctx.organization.id,
    userId: ctx.user.id,
    action: "member.role_changed",
    entityType: "OrganizationMember",
    entityId: memberId,
    metadata: { role },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function removeMemberAction(memberId: string) {
  const ctx = await requireOrg("ADMIN");
  const member = await prisma.organizationMember.findFirst({
    where: { id: memberId, organizationId: ctx.organization.id },
  });
  if (!member) throw new TenantError();
  if (member.userId === ctx.user.id) {
    return { ok: false as const, error: "You cannot remove yourself. Leave from account settings." };
  }
  if (member.role === "OWNER" && ctx.role !== "OWNER") {
    return { ok: false as const, error: "Only an owner can remove another owner." };
  }
  if (member.role === "OWNER") {
    const owners = await prisma.organizationMember.count({
      where: { organizationId: ctx.organization.id, role: "OWNER" },
    });
    if (owners <= 1) {
      return { ok: false as const, error: "Keep at least one owner." };
    }
  }

  await prisma.organizationMember.delete({ where: { id: memberId } });
  await writeAuditLog({
    organizationId: ctx.organization.id,
    userId: ctx.user.id,
    action: "member.removed",
    entityType: "OrganizationMember",
    entityId: memberId,
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function acceptInviteAction(token: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return { ok: false as const, error: "Sign in to accept this invite." };
  }

  const invite = await prisma.organizationInvite.findUnique({
    where: { tokenHash: sha256(token) },
    include: { organization: true },
  });
  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { ok: false as const, error: "This invite is invalid or expired." };
  }
  if (invite.email !== session.user.email.toLowerCase()) {
    return {
      ok: false as const,
      error: `This invite was sent to ${invite.email}. Sign in with that address.`,
    };
  }
  if (invite.organization.deletedAt) {
    return { ok: false as const, error: "That workspace is no longer active." };
  }

  const already = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invite.organizationId,
        userId: session.user.id,
      },
    },
  });

  await prisma.$transaction(async (tx) => {
    if (!already) {
      const used = await tx.organizationMember.count({
        where: { organizationId: invite.organizationId },
      });
      const sub = await tx.subscription.findUnique({
        where: { organizationId: invite.organizationId },
        include: { plan: true },
      });
      const max = sub?.plan.maxMembers ?? 1;
      if (max !== -1 && used >= max) {
        throw new Error("This workspace is out of seats. Ask an owner to upgrade.");
      }
      await tx.organizationMember.create({
        data: {
          organizationId: invite.organizationId,
          userId: session.user.id,
          role: invite.role,
          acceptedAt: new Date(),
        },
      });
    }
    await tx.organizationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  await setActiveOrgCookie(invite.organizationId);
  await writeAuditLog({
    organizationId: invite.organizationId,
    userId: session.user.id,
    action: "member.joined",
    entityType: "Organization",
    entityId: invite.organizationId,
  });

  redirect("/dashboard");
}

export async function switchOrganizationAction(organizationId: string) {
  const ctx = await requireOrg();
  const allowed = ctx.memberships.some((membership) => membership.organizationId === organizationId);
  if (!allowed) throw new TenantError();
  await setActiveOrgCookie(organizationId);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function registerFromInviteAction(
  _prev: { ok: true } | { ok: false; error: string } | undefined,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bcrypt = (await import("bcryptjs")).default;
  const { signIn } = await import("@/auth");
  const { registerSchema } = await import("@/lib/validations/auth");
  const { RateLimitError, assertRateLimit } = await import("@/lib/rate-limit");

  const token = String(formData.get("inviteToken") ?? "");
  const invite = await prisma.organizationInvite.findUnique({
    where: { tokenHash: sha256(token) },
    include: { organization: true },
  });
  if (!invite || invite.revokedAt || invite.acceptedAt || invite.expiresAt < new Date()) {
    return { ok: false, error: "This invite is invalid or expired." };
  }
  if (invite.organization.deletedAt) {
    return { ok: false, error: "That workspace is no longer active." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: invite.organization.name,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }
  if (parsed.data.email !== invite.email) {
    return { ok: false, error: `Register with ${invite.email} to accept this invite.` };
  }

  try {
    assertRateLimit(`register-invite:${parsed.data.email}`, 8);
    const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) {
      return { ok: false, error: "An account with that email already exists. Sign in to accept." };
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
        memberships: {
          create: {
            organizationId: invite.organizationId,
            role: invite.role,
            acceptedAt: new Date(),
          },
        },
      },
    });
    await prisma.organizationInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    await setActiveOrgCookie(invite.organizationId);
    await writeAuditLog({
      organizationId: invite.organizationId,
      userId: user.id,
      action: "member.joined",
      entityType: "Organization",
      entityId: invite.organizationId,
      metadata: { via: "invite-register" },
    });

    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
    return { ok: true };
  } catch (error) {
    if (error instanceof RateLimitError) return { ok: false, error: error.message };
    if ((error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw error;
    console.error(error);
    return { ok: false, error: "Could not create your account." };
  }
}

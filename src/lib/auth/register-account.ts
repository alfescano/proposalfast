import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { generateToken, sha256 } from "@/lib/crypto";
import { writeAuditLog } from "@/lib/audit";
import { uniqueOrgSlug } from "@/lib/slug";
import { registerSchema } from "@/lib/validations/auth";
import { ensureDefaultPlans } from "@/lib/ensure-default-plans";

export async function provisionWorkspace(input: {
  userId: string;
  name: string;
  organizationName: string;
}) {
  const slug = await uniqueOrgSlug(input.organizationName);
  const { free } = await ensureDefaultPlans();

  return prisma.organization.create({
    data: {
      name: input.organizationName,
      slug,
      members: {
        create: { userId: input.userId, role: "OWNER" },
      },
      settings: {
        create: {
          businessName: input.organizationName,
          emailFromName: input.name,
        },
      },
      subscription: {
        create: {
          planId: free.id,
          status: "ACTIVE",
        },
      },
    },
  });
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  organizationName: string;
  acceptTerms: unknown;
}) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return {
      ok: false as const,
      code: "EMAIL_TAKEN" as const,
      error: "An account with that email already exists.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: parsed.data.email,
        name: parsed.data.name,
        passwordHash,
      },
    });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") {
      return {
        ok: false as const,
        code: "EMAIL_TAKEN" as const,
        error: "An account with that email already exists.",
      };
    }
    throw error;
  }

  const organization = await provisionWorkspace({
    userId: user.id,
    name: parsed.data.name,
    organizationName: parsed.data.organizationName,
  });

  const verifyToken = generateToken();
  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: sha256(verifyToken),
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  await writeAuditLog({
    userId: user.id,
    action: "user.registered",
    entityType: "User",
    entityId: user.id,
  });

  return {
    ok: true as const,
    user,
    organization,
    verifyToken,
  };
}

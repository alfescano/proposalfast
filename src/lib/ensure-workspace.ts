import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { uniqueOrgSlug } from "@/lib/slug";

/** Google (or any OAuth) users get a workspace if credentials signup did not create one. */
export async function ensureWorkspace() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const existing = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, organization: { deletedAt: null } },
  });
  if (existing) return existing;

  const free = await prisma.plan.findUnique({ where: { tier: "FREE" } });
  if (!free) return null;

  const name = session.user.name || session.user.email?.split("@")[0] || "Workspace";
  const organization = await prisma.organization.create({
    data: {
      name: `${name}'s workspace`,
      slug: await uniqueOrgSlug(name),
      members: { create: { userId: session.user.id, role: "OWNER" } },
      settings: { create: { businessName: name, emailFromName: name } },
      subscription: { create: { planId: free.id, status: "ACTIVE" } },
    },
  });

  return prisma.organizationMember.findFirst({
    where: { userId: session.user.id, organizationId: organization.id },
  });
}

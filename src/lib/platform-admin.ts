import { prisma } from "@/lib/db";

export function platformAdminEmails() {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminUser(user: { platformAdmin: boolean; email: string | null }) {
  if (user.platformAdmin) return true;
  if (!user.email) return false;
  return platformAdminEmails().includes(user.email.toLowerCase());
}

export async function getPlatformAdmin() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findFirst({
    where: { id: session.user.id, deletedAt: null },
  });
  if (!user || !isPlatformAdminUser(user)) return null;
  return user;
}

/** Platform operators only — org Admin is not enough. Unknown users see 404. */
export async function requirePlatformAdmin() {
  const { notFound, redirect } = await import("next/navigation");
  const { auth } = await import("@/auth");
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login?next=/admin");
  }
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user || !isPlatformAdminUser(user)) {
    notFound();
  }
  return user;
}

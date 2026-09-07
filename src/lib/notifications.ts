import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export type NotificationType =
  | "opened"
  | "accepted"
  | "signed"
  | "paid"
  | "subscription_failed";

const PREF: Record<NotificationType, "notifyOpened" | "notifyAccepted" | "notifySigned" | "notifyPaid" | "notifySubscription"> =
  {
    opened: "notifyOpened",
    accepted: "notifyAccepted",
    signed: "notifySigned",
    paid: "notifyPaid",
    subscription_failed: "notifySubscription",
  };

export async function notifyWorkspace(input: {
  organizationId: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}) {
  const settings = await prisma.settings.findUnique({
    where: { organizationId: input.organizationId },
  });
  if (settings && settings[PREF[input.type]] === false) {
    return { skipped: true as const, count: 0 };
  }

  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: input.organizationId,
      role: { in: ["OWNER", "ADMIN", "MEMBER"] },
      user: { deletedAt: null },
    },
    select: { userId: true },
  });

  if (!members.length) return { skipped: false as const, count: 0 };

  await prisma.notification.createMany({
    data: members.map((member) => ({
      organizationId: input.organizationId,
      userId: member.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    })),
  });

  return { skipped: false as const, count: members.length };
}

export async function unreadNotificationCount(userId: string, organizationId: string) {
  return prisma.notification.count({
    where: { userId, organizationId, readAt: null },
  });
}

export async function listNotifications(userId: string, organizationId: string, take = 20) {
  return prisma.notification.findMany({
    where: { userId, organizationId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

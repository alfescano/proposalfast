"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireOrg } from "@/lib/org";

export async function markNotificationReadAction(notificationId: string) {
  const ctx = await requireOrg();
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: ctx.user.id, organizationId: ctx.organization.id },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const ctx = await requireOrg();
  await prisma.notification.updateMany({
    where: { userId: ctx.user.id, organizationId: ctx.organization.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function updateNotificationPrefsAction(formData: FormData) {
  const ctx = await requireOrg("ADMIN");
  const data = {
    notifyOpened: formData.get("notifyOpened") === "on",
    notifyAccepted: formData.get("notifyAccepted") === "on",
    notifySigned: formData.get("notifySigned") === "on",
    notifyPaid: formData.get("notifyPaid") === "on",
    notifySubscription: formData.get("notifySubscription") === "on",
    notifyComment: formData.get("notifyComment") === "on",
  };
  await prisma.settings.upsert({
    where: { organizationId: ctx.organization.id },
    create: { organizationId: ctx.organization.id, ...data },
    update: data,
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

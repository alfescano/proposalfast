import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/sidebar";
import { NotificationCenter } from "@/components/app/notification-center";
import { getCurrentOrgContext } from "@/lib/org";
import { ensureWorkspace } from "@/lib/ensure-workspace";
import { isPlatformAdminUser } from "@/lib/platform-admin";
import { listNotifications, unreadNotificationCount } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureWorkspace();
  const ctx = await getCurrentOrgContext();
  if (!ctx) {
    redirect("/login");
  }

  const [unread, notifications] = await Promise.all([
    unreadNotificationCount(ctx.user.id, ctx.organization.id),
    listNotifications(ctx.user.id, ctx.organization.id),
  ]);

  return (
    <div className="min-h-screen md:flex">
      <AppSidebar
        organizationName={ctx.organization.name}
        organizationId={ctx.organization.id}
        planName={ctx.plan?.name ?? "Free"}
        role={ctx.role}
        isPlatformAdmin={isPlatformAdminUser(ctx.user)}
        organizations={ctx.memberships.map((membership) => ({
          id: membership.organizationId,
          name: membership.organization.name,
        }))}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-end px-4 pt-4 sm:px-8">
          <NotificationCenter
            unread={unread}
            items={notifications.map((item) => ({
              id: item.id,
              title: item.title,
              body: item.body,
              actionUrl: item.actionUrl,
              readAt: item.readAt,
              createdAt: item.createdAt,
            }))}
          />
        </div>
        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

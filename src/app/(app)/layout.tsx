import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app/sidebar";
import { getCurrentOrgContext } from "@/lib/org";
import { ensureWorkspace } from "@/lib/ensure-workspace";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureWorkspace();
  const ctx = await getCurrentOrgContext();
  if (!ctx) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen md:flex">
      <AppSidebar
        organizationName={ctx.organization.name}
        planName={ctx.plan?.name ?? "Free"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}

import Link from "next/link";
import { FileText, LayoutDashboard, LogOut, Settings, Users, Library, Shield } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { logoutAction } from "@/actions/auth";
import { OrgSwitcher } from "@/components/app/org-switcher";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/library", label: "Templates", icon: Library },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  organizationName,
  organizationId,
  planName,
  role,
  isPlatformAdmin,
  organizations,
}: {
  organizationName: string;
  organizationId: string;
  planName: string;
  role: string;
  isPlatformAdmin: boolean;
  organizations: { id: string; name: string }[];
}) {
  return (
    <aside className="flex w-full flex-col bg-sidebar text-sidebar-foreground md:h-screen md:w-64">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/dashboard">
          <Logo className="text-sidebar-foreground" />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3" aria-label="Workspace">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <link.icon className="size-4" />
            {link.label}
          </Link>
        ))}
        {isPlatformAdmin ? (
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Shield className="size-4" />
            Platform admin
          </Link>
        ) : null}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        {organizations.length > 1 ? (
          <OrgSwitcher organizationId={organizationId} organizations={organizations} />
        ) : (
          <p className="truncate text-sm font-medium">{organizationName}</p>
        )}
        <p className="text-xs text-sidebar-foreground/60">
          {planName} plan · {role.toLowerCase()}
        </p>
        <form action={logoutAction}>
          <button
            type="submit"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mt-3 h-8 w-full justify-start px-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            <LogOut className="mr-2 size-3.5" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}

import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { Logo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin#users", label: "Users" },
  { href: "/admin#orgs", label: "Orgs" },
  { href: "/admin#billing", label: "Revenue" },
  { href: "/admin#usage", label: "AI usage" },
  { href: "/admin#support", label: "Support" },
  { href: "/admin#health", label: "Health" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePlatformAdmin();
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#101828] text-[#f6f1e8]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#f6f1e8]">
              <Logo className="text-[#f6f1e8]" />
            </Link>
            <span className="rounded-full border border-[#c9a227]/50 px-2 py-0.5 text-[10px] tracking-[0.18em] text-[#c9a227] uppercase">
              Platform
            </span>
          </div>
          <p className="text-xs text-white/50">{admin.email}</p>
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 pb-3 sm:px-6" aria-label="Admin">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="rounded-md px-3 py-1.5 text-sm text-white/50 hover:bg-white/10 hover:text-white"
          >
            Back to app
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/lib/site";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/templates", label: "Templates" },
      { href: "/pricing", label: "Pricing" },
      { href: "/compare", label: "Compare" },
      { href: "/blog", label: "Blog" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/blog", label: "Blog" },
      { href: "/contact", label: "Contact" },
      { href: "/login", label: "Log in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookie-policy", label: "Cookies" },
      { href: "/refund-policy", label: "Refunds" },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer className="border-border border-t bg-[#101828] text-[#f6f1e8]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <Logo className="text-[#f6f1e8]" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-white/70">
            {siteConfig.tagline}
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-xs tracking-[0.18em] text-[#c9a227] uppercase">
              {column.title}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-white/50 sm:flex-row sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} ProposalFast. All rights reserved.</p>
          <p className="flex flex-col gap-1 sm:items-end">
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="hover:text-white"
            >
              {siteConfig.supportEmail}
            </a>
            <span>{siteConfig.domain}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

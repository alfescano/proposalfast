import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";

const links = [
  { href: "/features", label: "Features" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

export async function MarketingHeader() {
  const session = await auth();

  return (
    <header className="border-border/70 bg-background/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="ProposalFast home">
          <Logo />
        </Link>
        <nav className="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {session?.user ? (
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ size: "lg" }), "px-3")}
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "lg" }),
                  "hidden px-3 sm:inline-flex",
                )}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={cn(buttonVariants({ size: "lg" }), "px-3")}
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

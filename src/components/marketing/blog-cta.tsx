import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function BlogCta() {
  return (
    <section className="border-border mt-14 rounded-2xl border bg-[#152033] px-6 py-10 text-[#f6f1e8] sm:px-10">
      <h2 className="font-heading text-3xl">Try {siteConfig.name} free</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
        Create a workspace, draft from your facts, and send a client portal.
        Plans and any founding price live on the pricing page — not in a
        checkout URL in this post.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/register"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-accent text-accent-foreground hover:bg-accent/90 h-11 px-5",
          )}
        >
          Start free
        </Link>
        <Link
          href="/pricing"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-11 border-white/20 bg-transparent px-5 text-[#f6f1e8] hover:bg-white/10 hover:text-white",
          )}
        >
          See pricing
        </Link>
      </div>
    </section>
  );
}

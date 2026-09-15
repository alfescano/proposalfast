import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

export function FounderQuote({ className }: { className?: string }) {
  return (
    <blockquote
      className={cn(
        "border-border bg-card rounded-2xl border p-6 sm:p-8",
        className,
      )}
    >
      <p className="font-heading text-2xl leading-snug text-balance italic sm:text-3xl">
        “{siteConfig.founder.quote}”
      </p>
      <footer className="text-muted-foreground mt-5 text-sm">
        — {siteConfig.founder.name}, {siteConfig.founder.role}
      </footer>
    </blockquote>
  );
}

import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FounderQuote } from "@/components/marketing/founder-quote";
import { siteConfig } from "@/lib/site";
import { formatPrice } from "@/lib/plans";
import { FOUNDING_PRO_MONTHLY_CENTS } from "@/lib/founding-offer";
import { cn } from "@/lib/utils";

const promises = [
  "No invented fees or timelines — placeholders until you confirm the numbers",
  "Clear path after the draft — portal Q&A, e-sign, and Stripe in one place",
];

export function TrustSection({ foundingActive }: { foundingActive: boolean }) {
  const foundingLine = foundingActive
    ? `Founding pricing — Pro at ${formatPrice(FOUNDING_PRO_MONTHLY_CENTS)}/mo for early teams (limited)`
    : "Transparent plans on the pricing page — no invented discounts or customer counts";

  return (
    <section className="border-border border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-accent text-xs tracking-[0.2em] uppercase">
            Trust
          </p>
          <h2 className="font-heading mt-3 text-4xl text-balance">
            Built for agencies still shipping proposals as Docs + email.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl text-base leading-7">
            {siteConfig.name} is early. We don’t paste fake logos. What we
            promise instead:
          </p>
          <ul className="text-muted-foreground mt-6 space-y-3 text-sm leading-6">
            {promises.concat(foundingLine).map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="text-accent mt-0.5 size-4 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/register"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-5",
              )}
            >
              Pricing
            </Link>
            <a
              href={siteConfig.productHuntLaunchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 px-5",
              )}
            >
              Product Hunt
            </a>
          </div>
        </div>
        <FounderQuote />
      </div>
    </section>
  );
}

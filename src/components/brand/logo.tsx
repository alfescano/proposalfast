import { cn } from "@/lib/utils";

export function Logo({
  className,
  markClassName,
  wordmark = true,
}: {
  className?: string;
  markClassName?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <svg
        viewBox="0 0 32 32"
        className={cn("size-7", markClassName)}
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="8" fill="#152033" />
        <path
          d="M9 22V10h7.2c2.9 0 4.7 1.6 4.7 4.1 0 2.6-1.9 4.2-4.9 4.2H12.4V22H9zm3.4-6.3h3.3c1.3 0 2-.7 2-1.7s-.7-1.6-2-1.6h-3.3v3.3z"
          fill="#F6F1E8"
        />
        <path d="M20.2 22.4 25 18.6l-1.1-1.3-3.7 2.1V13h-1.7v9.4z" fill="#C9A227" />
      </svg>
      {wordmark ? (
        <span className="font-heading text-[1.15rem] font-semibold tracking-tight">
          ProposalFast
        </span>
      ) : null}
    </span>
  );
}

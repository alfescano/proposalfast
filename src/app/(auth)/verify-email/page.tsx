import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "@/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Verify email",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;
  const result =
    token && email
      ? await verifyEmailAction(token, email)
      : { ok: false as const, error: "This verification link is missing a token." };

  return (
    <div>
      <h1 className="font-heading text-4xl">{result.ok ? "Email confirmed" : "Could not verify"}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {result.ok
          ? "You can send proposals and receive receipts from this address."
          : result.error}
      </p>
      <Link href={result.ok ? "/dashboard" : "/login"} className={cn(buttonVariants({ size: "lg" }), "mt-8 px-4")}>
        {result.ok ? "Go to dashboard" : "Back to log in"}
      </Link>
    </div>
  );
}

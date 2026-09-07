import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-6">
      <p className="text-xs tracking-[0.2em] text-accent uppercase">404</p>
      <h1 className="mt-3 font-heading text-4xl">This page is not on the proposal.</h1>
      <p className="mt-3 text-muted-foreground">
        The URL may be outdated, or you followed a private workspace link while signed out.
      </p>
      <Link href="/" className={cn(buttonVariants({ size: "lg" }), "mt-8 w-fit px-4")}>
        Back to home
      </Link>
    </main>
  );
}

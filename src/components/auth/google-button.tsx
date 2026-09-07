"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full"
      onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
    >
      {label}
    </Button>
  );
}

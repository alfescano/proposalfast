"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const KEY = "pf_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(!window.localStorage.getItem(KEY));
    } catch {
      setVisible(false);
    }
  }, []);

  function choose(value: "essential" | "all") {
    try {
      window.localStorage.setItem(KEY, value);
    } catch {
      /* ignore quota */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur"
      role="dialog"
      aria-label="Cookie preferences"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          ProposalFast uses essential cookies for sign-in. Optional cookies stay off unless you
          accept them. See the{" "}
          <Link href="/cookie-policy" className="underline">
            cookie policy
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="h-9 px-3" onClick={() => choose("essential")}>
            Essential only
          </Button>
          <Button type="button" className="h-9 px-3" onClick={() => choose("all")}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

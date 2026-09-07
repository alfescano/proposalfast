"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/auth/auth-form";
import { ErrorState } from "@/components/states/error-state";
import type { ActionResult } from "@/actions/auth";

export function ForgotForm({
  action,
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <ErrorState description={state.error} /> : null}
      {state?.ok ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          If that inbox is registered, a reset link is on its way.
        </p>
      ) : null}
      <Field name="email" label="Email" type="email" required />
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="underline">
          Back to log in
        </Link>
      </p>
    </form>
  );
}

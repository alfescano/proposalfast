"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/auth/auth-form";
import { ErrorState } from "@/components/states/error-state";
import { requestVerificationEmailAction, type ActionResult } from "@/actions/auth";

export function ResendVerificationForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState(
    requestVerificationEmailAction,
    undefined as ActionResult | undefined,
  );

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-sm text-muted-foreground">
        Created an account but never got the email? Request a new verification link.
      </p>
      {state && !state.ok ? <ErrorState title="Could not send" description={state.error} /> : null}
      {state?.ok && state.message ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">{state.message}</p>
      ) : null}
      <Field
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={defaultEmail}
      />
      <Button type="submit" variant="outline" disabled={pending} className="h-10 w-full">
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  );
}

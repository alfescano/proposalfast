"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/auth/auth-form";
import { ErrorState } from "@/components/states/error-state";
import type { ActionResult } from "@/actions/auth";

export function ResetForm({
  action,
  token,
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  token: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <ErrorState description={state.error} /> : null}
      {state?.ok ? (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          Password updated.{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </p>
      ) : null}
      <input type="hidden" name="token" value={token} />
      <Field name="password" label="New password" type="password" required minLength={10} />
      <Button type="submit" disabled={pending || !token} className="h-10 w-full">
        {pending ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}

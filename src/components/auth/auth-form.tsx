"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";
import type { ActionResult } from "@/actions/auth";

export function AuthForm({
  action,
  submitLabel,
  pendingLabel,
  extra,
  children,
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  pendingLabel: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <ErrorState description={state.error} /> : null}
      {children}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? pendingLabel : submitLabel}
      </Button>
      {extra}
    </form>
  );
}

export function Field({
  name,
  label,
  type = "text",
  autoComplete,
  required,
  minLength,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
      />
    </div>
  );
}

export function AuthSwitch({ href, prompt, label }: { href: string; prompt: string; label: string }) {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {prompt}{" "}
      <Link href={href} className="text-foreground underline">
        {label}
      </Link>
    </p>
  );
}

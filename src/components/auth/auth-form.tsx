"use client";

import { useActionState, useState } from "react";
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
  requireTerms,
  children,
}: {
  action: (prev: ActionResult | undefined, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  pendingLabel: string;
  extra?: React.ReactNode;
  requireTerms?: boolean;
  children: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [agreed, setAgreed] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <ErrorState description={state.error} /> : null}
      {state?.ok && state.message ? (
        <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">{state.message}</p>
      ) : null}
      {children}
      {requireTerms ? <TermsAgreeField checked={agreed} onCheckedChange={setAgreed} /> : null}
      <Button type="submit" disabled={pending || (requireTerms && !agreed)} className="h-10 w-full">
        {pending ? pendingLabel : submitLabel}
      </Button>
      {extra}
    </form>
  );
}

export function TermsAgreeField({
  checked,
  onCheckedChange,
  id = "acceptTerms",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <input
        id={id}
        name="acceptTerms"
        type="checkbox"
        value="on"
        required
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border border-input accent-foreground"
      />
      <Label htmlFor={id} className="items-start text-sm font-normal leading-5 text-muted-foreground">
        I agree to the{" "}
        <Link href="/terms" className="text-foreground underline" target="_blank" rel="noreferrer">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-foreground underline" target="_blank" rel="noreferrer">
          Privacy Policy
        </Link>
      </Label>
    </div>
  );
}

export function Field({
  name,
  label,
  type = "text",
  autoComplete,
  required,
  minLength,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" ? "none" : undefined}
        autoCorrect={type === "email" ? "off" : undefined}
        spellCheck={type === "email" ? false : undefined}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue}
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

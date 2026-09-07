"use client";

import { useState } from "react";
import { changePasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";

export function ChangePasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(formData: FormData) {
    setSaved(false);
    const result = await changePasswordAction(undefined, formData);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setSaved(true);
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <div>
        <h2 className="font-heading text-2xl">Password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Change the password for this account. You will need the current password.
        </p>
      </div>
      {error ? <ErrorState description={error} /> : null}
      {saved ? <p className="rounded-lg bg-muted px-3 py-2 text-sm">Password updated.</p> : null}
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <p className="text-xs text-muted-foreground">At least 10 characters, with upper, lower, and a number.</p>
      </div>
      <Button type="submit" className="h-10 px-4">
        Update password
      </Button>
    </form>
  );
}

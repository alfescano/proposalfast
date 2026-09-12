"use client";

import { useActionState, useState } from "react";
import { acceptInviteAction, registerFromInviteAction } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";
import { TermsAgreeField } from "@/components/auth/auth-form";

export function AcceptInviteForm({ token }: { token: string }) {
  return (
    <form
      action={async () => {
        await acceptInviteAction(token);
      }}
    >
      <Button type="submit" className="h-10 px-4">
        Join workspace
      </Button>
    </form>
  );
}

export function InviteRegisterForm({ token, email }: { token: string; email: string }) {
  const [state, action] = useActionState(registerFromInviteAction, undefined);
  const [agreed, setAgreed] = useState(false);
  return (
    <form action={action} className="space-y-3 rounded-2xl border border-border bg-card p-5">
      {state && !state.ok ? <ErrorState description={state.error} /> : null}
      <input type="hidden" name="inviteToken" value={token} />
      <div className="space-y-1">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" required minLength={2} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required defaultValue={email} readOnly />
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required minLength={10} />
      </div>
      <TermsAgreeField checked={agreed} onCheckedChange={setAgreed} />
      <Button type="submit" disabled={!agreed} className="h-10 px-4">
        Create account and join
      </Button>
    </form>
  );
}

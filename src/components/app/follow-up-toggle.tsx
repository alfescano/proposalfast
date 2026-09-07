"use client";

import { useState } from "react";
import { updateFollowUpOptIn } from "@/actions/onboarding";
import { Label } from "@/components/ui/label";

export function FollowUpToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={on}
          onChange={async (event) => {
            const next = event.target.checked;
            setOn(next);
            await updateFollowUpOptIn(next);
          }}
        />
        <span>
          <Label>Follow-up reminders</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            Off by default. When on, a reminder can send three days after you send a proposal — and
            only if that proposal also has follow-up opted in.
          </p>
        </span>
      </label>
    </div>
  );
}

"use client";

import { useState } from "react";
import { updateNotificationPrefsAction } from "@/actions/notifications";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const fields = [
  { name: "notifyOpened", label: "Proposal opened" },
  { name: "notifyAccepted", label: "Proposal accepted" },
  { name: "notifySigned", label: "Proposal signed" },
  { name: "notifyPaid", label: "Payment received" },
  { name: "notifySubscription", label: "Subscription failed" },
  { name: "notifyComment", label: "Client comments" },
] as const;

export function NotificationPrefs({
  defaults,
}: {
  defaults: Record<(typeof fields)[number]["name"], boolean>;
}) {
  const [saved, setSaved] = useState(false);

  async function onSubmit(formData: FormData) {
    await updateNotificationPrefsAction(formData);
    setSaved(true);
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-heading text-2xl">Notification preferences</h2>
      <p className="text-sm text-muted-foreground">
        In-app alerts for this workspace. Email still goes to owners on the first open, accept, and
        sign.
      </p>
      {fields.map((field) => (
        <label key={field.name} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name={field.name} defaultChecked={defaults[field.name]} />
          <Label className="font-normal">{field.label}</Label>
        </label>
      ))}
      <Button type="submit" className="h-9 px-4">
        Save alerts
      </Button>
      {saved ? <p className="text-sm text-muted-foreground">Saved.</p> : null}
    </form>
  );
}

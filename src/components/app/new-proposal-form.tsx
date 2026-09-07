"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProposalAction } from "@/actions/proposals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";

export function NewProposalForm({
  clients,
  templates,
  currency,
}: {
  clients: { id: string; label: string }[];
  templates: { id: string; label: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createProposalAction(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/proposals/${result.id}`);
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      {error ? <ErrorState description={error} /> : null}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required minLength={3} placeholder="Brand system for Harbor & Co" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientId">Client</Label>
        <select
          id="clientId"
          name="clientId"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">No client yet</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="templateId">Template</Label>
        <select
          id="templateId"
          name="templateId"
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="">Default consulting structure</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>
      </div>
      <input type="hidden" name="currency" value={currency} />
      <div className="space-y-2">
        <Label htmlFor="validUntil">Valid until</Label>
        <Input id="validUntil" name="validUntil" type="date" />
      </div>
      <Button type="submit" disabled={pending} className="h-10 px-4">
        {pending ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}

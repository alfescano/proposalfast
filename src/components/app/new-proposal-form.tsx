"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProposalAction } from "@/actions/proposals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [useAi, setUseAi] = useState(false);

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

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="useAi" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} />
        Draft with AI from facts (requires OPENAI_API_KEY)
      </label>
      {useAi ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="brief">Brief — only facts you already have</Label>
            <Textarea id="brief" name="brief" minLength={20} rows={5} required={useAi} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="facts">Extra facts (one per line)</Label>
            <Textarea id="facts" name="facts" rows={3} />
          </div>
        </>
      ) : null}

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="paymentEnabled" />
        Enable Stripe payment on the client portal
      </label>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="paymentMode">Charge</Label>
          <select
            id="paymentMode"
            name="paymentMode"
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            <option value="FULL">Full</option>
            <option value="DEPOSIT">Deposit %</option>
            <option value="FIXED">Fixed</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount ({currency})</Label>
          <Input id="amount" name="amount" type="number" min="0" step="0.01" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="depositPercent">Deposit %</Label>
          <Input id="depositPercent" name="depositPercent" type="number" min="1" max="100" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="followUpOptIn" />
        Allow a follow-up reminder (workspace opt-in also required)
      </label>

      <Button type="submit" disabled={pending} className="h-10 px-4">
        {pending ? "Creating…" : useAi ? "Create and generate" : "Create draft"}
      </Button>
    </form>
  );
}

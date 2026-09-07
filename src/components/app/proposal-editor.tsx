"use client";

import { useState } from "react";
import Link from "next/link";
import {
  archiveProposalAction,
  queueProposalGenerationAction,
  rewriteSectionAction,
  saveProposalSectionsAction,
  sendProposalAction,
  updateProposalMetaAction,
} from "@/actions/proposals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/states/error-state";
import type { RewriteMode } from "@/lib/ai/schemas";

const REWRITE_MODES: { id: RewriteMode; label: string }[] = [
  { id: "rewrite", label: "Rewrite" },
  { id: "shorten", label: "Shorten" },
  { id: "expand", label: "Expand" },
  { id: "tone", label: "Tone" },
  { id: "persuasive", label: "Persuasive" },
  { id: "humanize", label: "Humanize" },
];

export function ProposalEditor({
  proposal,
  clients,
  sections: initialSections,
  score,
  canWrite = true,
}: {
  proposal: {
    id: string;
    title: string;
    status: string;
    currency: string;
    clientId: string | null;
    publicId: string;
    portalUrl: string;
    validUntil: string;
    locked: boolean;
    paymentEnabled: boolean;
    paymentMode: string;
    amount: string;
    depositPercent: string;
    followUpOptIn: boolean;
  };
  clients: { id: string; label: string }[];
  sections: { id: string; title: string; body: string }[];
  score?: { overall: number; completeness: number; fidelity: number; notes: string[] } | null;
  canWrite?: boolean;
}) {
  const [sections, setSections] = useState(initialSections);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [selection, setSelection] = useState<{ sectionId: string; text: string } | null>(null);
  const locked = proposal.locked || !canWrite;

  async function saveMeta(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateProposalMetaAction(proposal.id, formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else setMessage("Details saved.");
  }

  async function saveSections() {
    setPending(true);
    setError(null);
    await saveProposalSectionsAction(proposal.id, sections);
    setPending(false);
    setMessage("Sections saved.");
  }

  async function send() {
    setPending(true);
    setError(null);
    const result = await sendProposalAction(proposal.id);
    setPending(false);
    if (!result.ok) setError(result.error);
    else setMessage(`Sent. Portal: ${result.portalUrl}`);
  }

  async function generate(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("proposalId", proposal.id);
    const result = await queueProposalGenerationAction(formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else setMessage("Generation finished or queued. Refresh to load new sections.");
  }

  async function rewrite(mode: RewriteMode) {
    if (!selection) return;
    setPending(true);
    const form = new FormData();
    form.set("proposalId", proposal.id);
    form.set("sectionId", selection.sectionId);
    form.set("selectedText", selection.text);
    form.set("mode", mode);
    const result = await rewriteSectionAction(form);
    setPending(false);
    if (!result.ok) setError(result.error);
    else {
      setSections((current) =>
        current.map((section) =>
          section.id === selection.sectionId && result.body
            ? { ...section, body: result.body }
            : section,
        ),
      );
      setMessage("Selection rewritten. Review placeholders before sending.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.18em] text-accent uppercase">Proposal</p>
          <h1 className="mt-2 font-heading text-4xl">{proposal.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{proposal.status}</Badge>
            {locked ? <Badge>Signed — locked</Badge> : null}
            <Link href={proposal.portalUrl} className="text-xs underline" target="_blank">
              Open client portal
            </Link>
            <Link href={`/proposals/${proposal.id}/pdf`} className="text-xs underline">
              Download PDF
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={send} disabled={pending || locked} className="h-10 px-4">
            Send
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-10"
            disabled={pending || locked}
            onClick={async () => {
              await archiveProposalAction(proposal.id);
              window.location.href = "/proposals";
            }}
          >
            Archive
          </Button>
        </div>
      </div>

      {error ? <ErrorState description={error} /> : null}
      {message ? <p className="rounded-lg bg-muted px-3 py-2 text-sm">{message}</p> : null}

      {score ? (
        <div className="rounded-2xl border border-border bg-card p-5 text-sm">
          <p className="font-medium">Quality score {score.overall}/100</p>
          <p className="mt-1 text-muted-foreground">
            Completeness {score.completeness} · Fidelity {score.fidelity}
          </p>
          {score.notes[0] ? <p className="mt-2">{score.notes[0]}</p> : null}
        </div>
      ) : null}

      <form action={saveMeta} className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:grid-cols-2">
        <fieldset disabled={locked} className="contents">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={proposal.title} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clientId">Client</Label>
            <select
              id="clientId"
              name="clientId"
              defaultValue={proposal.clientId ?? ""}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">No client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="validUntil">Valid until</Label>
            <Input id="validUntil" name="validUntil" type="date" defaultValue={proposal.validUntil} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="paymentEnabled" defaultChecked={proposal.paymentEnabled} />
            Enable Stripe payment
          </label>
          <div className="space-y-2">
            <Label htmlFor="paymentMode">Charge type</Label>
            <select
              id="paymentMode"
              name="paymentMode"
              defaultValue={proposal.paymentMode}
              className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="FULL">Full</option>
              <option value="DEPOSIT">Deposit %</option>
              <option value="FIXED">Fixed</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({proposal.currency})</Label>
            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={proposal.amount} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depositPercent">Deposit %</Label>
            <Input id="depositPercent" name="depositPercent" type="number" defaultValue={proposal.depositPercent} />
          </div>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="followUpOptIn" defaultChecked={proposal.followUpOptIn} />
            Allow a follow-up reminder for this proposal
          </label>
          <input type="hidden" name="currency" value={proposal.currency} />
          <div className="md:col-span-2">
            <Button type="submit" disabled={pending || locked} className="h-9 px-4">
              Save details
            </Button>
          </div>
        </fieldset>
      </form>

      {!locked ? (
        <form action={generate} className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-2xl">Generate from facts</h2>
          <p className="text-sm text-muted-foreground">
            The model may only use this brief. Missing commercial facts become [PLACEHOLDER].
          </p>
          <Textarea
            name="brief"
            required
            minLength={20}
            rows={5}
            placeholder="Harbor & Co asked for a brand system. Kickoff is 12 May. Do not invent a fee."
          />
          <Textarea name="facts" rows={3} placeholder="One fact per line (optional)" />
          <Button type="submit" disabled={pending} variant="outline" className="h-9 px-4">
            Run AI pipeline
          </Button>
        </form>
      ) : null}

      {!locked && selection ? (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-card p-4 text-sm">
          <span className="text-muted-foreground">Selection:</span>
          <span className="max-w-md truncate">{selection.text}</span>
          {REWRITE_MODES.map((mode) => (
            <Button
              key={mode.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => rewrite(mode.id)}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl">Sections</h2>
          <Button type="button" onClick={saveSections} disabled={pending || locked} className="h-9 px-4">
            Save sections
          </Button>
        </div>
        {sections.map((section, index) => (
          <div key={section.id} className="rounded-2xl border border-border bg-card p-5">
            <Input
              value={section.title}
              disabled={locked}
              onChange={(event) => {
                const next = [...sections];
                next[index] = { ...section, title: event.target.value };
                setSections(next);
              }}
              className="mb-3 font-medium"
            />
            <Textarea
              rows={8}
              value={section.body}
              disabled={locked}
              onSelect={(event) => {
                const target = event.currentTarget;
                const text = target.value.slice(target.selectionStart, target.selectionEnd);
                if (text.trim()) setSelection({ sectionId: section.id, text });
              }}
              onChange={(event) => {
                const next = [...sections];
                next[index] = { ...section, body: event.target.value };
                setSections(next);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

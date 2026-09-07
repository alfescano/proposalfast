"use client";

import { useState } from "react";
import { addPublicCommentAction } from "@/actions/public";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/states/error-state";

export function PublicCommentForm({
  publicId,
  defaultName,
  defaultEmail,
}: {
  publicId: string;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("publicId", publicId);
    const result = await addPublicCommentAction(formData);
    setPending(false);
    if (!result.ok) setError(result.error);
    else setSent(true);
  }

  if (sent) {
    return (
      <p className="rounded-2xl border border-[#8a7040] bg-[#fffdf8] px-4 py-3 text-sm text-[#152033]">
        Comment sent. The team will see it on this version of the proposal.
      </p>
    );
  }

  return (
    <form action={onSubmit} className="space-y-3 rounded-2xl border border-[#8a7040] bg-[#fffdf8] p-6">
      <h2 className="font-heading text-2xl text-[#152033]">Ask a question</h2>
      <p className="text-sm text-[#3d4a5c]">Tied to the version you are reading. The owner is notified by email.</p>
      {error ? <ErrorState description={error} /> : null}
      <div className="space-y-1">
        <Label htmlFor="authorName" className="text-[#152033]">
          Your name
        </Label>
        <Input id="authorName" name="authorName" required defaultValue={defaultName} autoComplete="name" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="authorEmail" className="text-[#152033]">
          Email
        </Label>
        <Input
          id="authorEmail"
          name="authorEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          autoComplete="email"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="comment-body" className="text-[#152033]">
          Question or comment
        </Label>
        <Textarea id="comment-body" name="body" required minLength={8} rows={4} />
      </div>
      <Button type="submit" disabled={pending} className="h-10 px-4">
        {pending ? "Sending…" : "Send comment"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { completeOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";

export function SettingsForm({
  defaults,
}: {
  defaults: {
    businessName: string;
    industry: string;
    website: string;
    tagline: string;
    defaultCurrency: string;
    brandColor: string;
  };
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(formData: FormData) {
    setSaved(false);
    const result = await completeOnboarding(formData);
    if (!result.ok) setError(result.error);
    else {
      setError(null);
      setSaved(true);
    }
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      {error ? <ErrorState description={error} /> : null}
      {saved ? <p className="rounded-lg bg-muted px-3 py-2 text-sm">Saved.</p> : null}
      <div className="space-y-2">
        <Label htmlFor="businessName">Business name</Label>
        <Input id="businessName" name="businessName" defaultValue={defaults.businessName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="industry">Industry</Label>
        <Input id="industry" name="industry" defaultValue={defaults.industry} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input id="website" name="website" defaultValue={defaults.website} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tagline">Tagline</Label>
        <Input id="tagline" name="tagline" defaultValue={defaults.tagline} />
      </div>
      <input type="hidden" name="defaultCurrency" value={defaults.defaultCurrency} />
      <input type="hidden" name="brandColor" value={defaults.brandColor || "#152033"} />
      <Button type="submit" className="h-10 px-4">
        Save profile
      </Button>
    </form>
  );
}

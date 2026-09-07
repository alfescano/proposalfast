"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding, skipOnboarding } from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/states/error-state";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

export function OnboardingForm({
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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await completeOnboarding(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  }

  async function onSkip() {
    setPending(true);
    await skipOnboarding();
    router.push("/dashboard");
  }

  return (
    <form action={onSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
      {error ? <ErrorState description={error} /> : null}
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="defaultCurrency">Default currency</Label>
          <select
            id="defaultCurrency"
            name="defaultCurrency"
            defaultValue={defaults.defaultCurrency}
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="brandColor">Brand color</Label>
          <Input id="brandColor" name="brandColor" defaultValue={defaults.brandColor} />
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={pending} className="h-10 px-4">
          {pending ? "Saving…" : "Save and continue"}
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onSkip} className="h-10">
          Skip for now
        </Button>
      </div>
    </form>
  );
}

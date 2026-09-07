import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireOrg } from "@/lib/org";
import { OnboardingForm } from "@/components/app/onboarding-form";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const ctx = await requireOrg("ADMIN");
  if (ctx.organization.settings?.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-xl">
      <p className="text-xs tracking-[0.18em] text-accent uppercase">Onboarding</p>
      <h1 className="mt-2 font-heading text-4xl">Tell us about the business</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This writes to Organization and Settings. Skip anytime — you can finish it later in
        Settings.
      </p>
      <div className="mt-8">
        <OnboardingForm
          defaults={{
            businessName: ctx.organization.settings?.businessName || ctx.organization.name,
            industry: ctx.organization.industry ?? "",
            website: ctx.organization.website ?? "",
            tagline: ctx.organization.settings?.tagline ?? "",
            defaultCurrency: ctx.organization.settings?.defaultCurrency ?? "USD",
            brandColor: ctx.organization.settings?.brandColor ?? "#152033",
          }}
        />
      </div>
    </div>
  );
}

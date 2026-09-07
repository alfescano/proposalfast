"use client";

import { PLAN_CATALOG, formatLimit, formatPrice } from "@/lib/plans";
import { startPlanCheckout, openCustomerPortal } from "@/actions/billing";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ErrorState } from "@/components/states/error-state";

export function BillingPanel({
  currentTier,
  status,
  canBill,
  hasCustomer,
}: {
  currentTier: keyof typeof PLAN_CATALOG;
  status: string;
  canBill: boolean;
  hasCustomer: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function upgrade(tier: "PRO" | "BUSINESS", interval: "month" | "year") {
    setPending(true);
    setError(null);
    const result = await startPlanCheckout(tier, interval);
    setPending(false);
    if (!result.ok) setError(result.error);
    else window.location.href = result.url;
  }

  async function portal() {
    setPending(true);
    const result = await openCustomerPortal();
    setPending(false);
    if (!result.ok) setError(result.error);
    else window.location.href = result.url;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading text-2xl">Billing</h2>
      <p className="text-sm text-muted-foreground">
        Current plan: <strong>{PLAN_CATALOG[currentTier].name}</strong> ({status}). Paid status
        comes from Stripe webhooks only.
      </p>
      {error ? <ErrorState description={error} /> : null}
      <div className="grid gap-3 md:grid-cols-3">
        {Object.values(PLAN_CATALOG).map((plan) => (
          <div key={plan.tier} className="rounded-xl border border-border p-4 text-sm">
            <p className="font-medium">{plan.name}</p>
            <p className="mt-1">{formatPrice(plan.monthlyPriceCents)}/mo</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatLimit(plan.limits.maxAiGenerationsPerMonth)} AI / month
            </p>
            {canBill && plan.tier !== "FREE" && plan.tier !== currentTier ? (
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => upgrade(plan.tier as "PRO" | "BUSINESS", "month")}
                >
                  Monthly
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => upgrade(plan.tier as "PRO" | "BUSINESS", "year")}
                >
                  Yearly
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {canBill && hasCustomer ? (
        <Button type="button" variant="outline" onClick={portal} disabled={pending}>
          Open Stripe customer portal
        </Button>
      ) : null}
    </div>
  );
}

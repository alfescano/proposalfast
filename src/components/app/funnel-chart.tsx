import type { FunnelStep } from "@/lib/analytics";

export function FunnelChart({ steps, dark = false }: { steps: FunnelStep[]; dark?: boolean }) {
  const max = Math.max(1, ...steps.map((step) => step.value));
  return (
    <ol className="mt-4 space-y-2" aria-label="Conversion funnel">
      {steps.map((step, index) => {
        const width = Math.max(8, Math.round((step.value / max) * 100));
        const prev = steps[index - 1]?.value ?? step.value;
        const conv = prev > 0 ? Math.round((step.value / prev) * 100) : 0;
        return (
          <li key={step.key}>
            <div className={`flex justify-between text-xs ${dark ? "text-white/60" : "text-muted-foreground"}`}>
              <span>{step.label}</span>
              <span>
                {step.value}
                {index > 0 ? ` · ${conv}%` : ""}
              </span>
            </div>
            <div className={`mt-1 h-2 rounded-full ${dark ? "bg-white/10" : "bg-muted"}`}>
              <div
                className={`h-2 rounded-full ${dark ? "bg-[#c9a227]" : "bg-[#152033]"}`}
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

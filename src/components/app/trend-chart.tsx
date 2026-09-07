import type { MonthPoint } from "@/lib/analytics";
import { formatCents, openRate, acceptanceRate } from "@/lib/analytics";

export function TrendChart({ points, dark = false }: { points: MonthPoint[]; dark?: boolean }) {
  const max = Math.max(1, ...points.flatMap((point) => [point.created, point.sent, point.opened]));
  const bar = dark ? "fill-[#c9a227]" : "fill-[#152033]";
  const sent = dark ? "fill-[#f6f1e8]" : "fill-[#8a7040]";
  const axis = dark ? "text-white/50" : "text-muted-foreground";

  return (
    <div className="mt-4">
      <svg viewBox="0 0 360 140" className="h-40 w-full" role="img" aria-label="Monthly proposal activity">
        {points.map((point, index) => {
          const x = 20 + index * 56;
          const createdH = (point.created / max) * 90;
          const sentH = (point.sent / max) * 90;
          return (
            <g key={point.key}>
              <rect x={x} y={110 - createdH} width="14" height={createdH} className={bar} rx="2" />
              <rect x={x + 16} y={110 - sentH} width="14" height={sentH} className={sent} rx="2" opacity="0.7" />
              <text x={x + 14} y={128} textAnchor="middle" className={`${axis} text-[10px]`}>
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      <dl className={`mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 ${axis}`}>
        {points.slice(-1).map((point) => (
          <div key={point.key} className="col-span-full grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div>
              <dt>Created / sent</dt>
              <dd className={dark ? "text-white" : "text-foreground"}>
                {point.created} / {point.sent}
              </dd>
            </div>
            <div>
              <dt>Open rate</dt>
              <dd className={dark ? "text-white" : "text-foreground"}>{openRate(point.sent, point.opened)}%</dd>
            </div>
            <div>
              <dt>Acceptance</dt>
              <dd className={dark ? "text-white" : "text-foreground"}>
                {acceptanceRate(point.sent, point.accepted)}%
              </dd>
            </div>
            <div>
              <dt>Revenue</dt>
              <dd className={dark ? "text-white" : "text-foreground"}>{formatCents(point.revenueCents)}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className={`mt-2 text-xs ${axis}`}>Bars: created (dark) and sent (light) for the last six months. Rates use this month.</p>
    </div>
  );
}

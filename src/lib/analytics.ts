export type MonthPoint = {
  key: string;
  label: string;
  created: number;
  sent: number;
  opened: number;
  accepted: number;
  revenueCents: number;
};

export type FunnelStep = {
  key: string;
  label: string;
  value: number;
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function lastNMonthKeys(n: number, now = new Date()) {
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
    keys.push(monthKey(d));
  }
  return keys;
}

export function monthLabel(key: string) {
  const [, month] = key.split("-");
  return MONTH_LABELS[Number(month) - 1] ?? key;
}

export function startOfMonthUtc(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

export function buildMonthlyTrends(input: {
  months?: number;
  now?: Date;
  events: { type: string; createdAt: Date }[];
  payments: { amountCents: number; createdAt: Date }[];
}): MonthPoint[] {
  const keys = lastNMonthKeys(input.months ?? 6, input.now);
  const byMonth = new Map<string, MonthPoint>();
  for (const key of keys) {
    byMonth.set(key, {
      key,
      label: monthLabel(key),
      created: 0,
      sent: 0,
      opened: 0,
      accepted: 0,
      revenueCents: 0,
    });
  }

  for (const event of input.events) {
    const key = monthKey(event.createdAt);
    const bucket = byMonth.get(key);
    if (!bucket) continue;
    if (event.type === "created") bucket.created += 1;
    if (event.type === "sent") bucket.sent += 1;
    if (event.type === "viewed") bucket.opened += 1;
    if (event.type === "accepted" || event.type === "signed") bucket.accepted += 1;
  }

  for (const payment of input.payments) {
    const key = monthKey(payment.createdAt);
    const bucket = byMonth.get(key);
    if (!bucket) continue;
    bucket.revenueCents += payment.amountCents;
  }

  return keys.map((key) => byMonth.get(key)!);
}

export function openRate(sent: number, opened: number) {
  if (sent <= 0) return 0;
  return Math.round((opened / sent) * 100);
}

export function acceptanceRate(sent: number, accepted: number) {
  if (sent <= 0) return 0;
  return Math.round((accepted / sent) * 100);
}

export function buildFunnel(counts: {
  signups: number;
  firstProposal: number;
  sent: number;
  opened: number;
  accepted: number;
  paid: number;
}): FunnelStep[] {
  return [
    { key: "signup", label: "Signups", value: counts.signups },
    { key: "first_proposal", label: "First proposal", value: counts.firstProposal },
    { key: "sent", label: "Sent", value: counts.sent },
    { key: "opened", label: "Opened", value: counts.opened },
    { key: "accepted", label: "Accepted", value: counts.accepted },
    { key: "paid", label: "Paid", value: counts.paid },
  ];
}

export function formatCents(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

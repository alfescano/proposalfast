type Bucket = { count: number; resetAt: number };

const memory = new Map<string, Bucket>();

/**
 * In-process limiter for a single Node instance. On Vercel, pair this with
 * an edge/Redis limiter (Upstash) — the interface stays the same.
 */
export function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = memory.get(input.key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + input.windowMs };
    memory.set(input.key, next);
    return { ok: true, remaining: input.limit - 1, resetAt: next.resetAt };
  }
  if (current.count >= input.limit) {
    return { ok: false, remaining: 0, resetAt: current.resetAt };
  }
  current.count += 1;
  return { ok: true, remaining: input.limit - current.count, resetAt: current.resetAt };
}

export class RateLimitError extends Error {
  constructor(message = "Too many attempts. Wait a minute and try again.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export function assertRateLimit(key: string, limit: number, windowMs = 60_000) {
  const result = rateLimit({ key, limit, windowMs });
  if (!result.ok) throw new RateLimitError();
  return result;
}

type Bucket = { count: number; resetAt: number };

const memory = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

function memoryLimit(input: { key: string; limit: number; windowMs: number }): RateLimitResult {
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

function upstashConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function upstashLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const { Redis } = await import("@upstash/redis");
  const redis = Redis.fromEnv();
  const redisKey = `pf:rl:${input.key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.pexpire(redisKey, input.windowMs);
  }
  const ttl = await redis.pttl(redisKey);
  const resetAt = Date.now() + (ttl > 0 ? ttl : input.windowMs);
  if (count > input.limit) {
    return { ok: false, remaining: 0, resetAt };
  }
  return { ok: true, remaining: input.limit - count, resetAt };
}

/**
 * Fixed-window limiter. Uses Upstash Redis when
 * UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set; otherwise
 * an in-process map (one Node instance).
 */
export async function rateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  if (upstashConfigured()) {
    try {
      return await upstashLimit(input);
    } catch (error) {
      console.error("Upstash rate limit failed; falling back to memory", error);
      return memoryLimit(input);
    }
  }
  return memoryLimit(input);
}

export class RateLimitError extends Error {
  constructor(message = "Too many attempts. Wait a minute and try again.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export async function assertRateLimit(key: string, limit: number, windowMs = 60_000) {
  const result = await rateLimit({ key, limit, windowMs });
  if (!result.ok) throw new RateLimitError();
  return result;
}

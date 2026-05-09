type Bucket = {
  tokens: number;
  updatedAtMs: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitConfig = {
  capacity: number;
  refillPerSecond: number;
};

export function rateLimit(key: string, cfg: RateLimitConfig) {
  const now = Date.now();
  const b = buckets.get(key) ?? { tokens: cfg.capacity, updatedAtMs: now };
  const elapsed = Math.max(0, now - b.updatedAtMs) / 1000;
  const refill = elapsed * cfg.refillPerSecond;
  const tokens = Math.min(cfg.capacity, b.tokens + refill);
  const allowed = tokens >= 1;
  const next: Bucket = { tokens: allowed ? tokens - 1 : tokens, updatedAtMs: now };
  buckets.set(key, next);
  return { allowed, remaining: Math.floor(next.tokens) };
}


interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * In-memory sliding/fixed window rate limiter.
 * Grouped by client IP and route group.
 */
export function checkRateLimit(
  ip: string,
  routeGroup: string,
  limit = 20,
  windowSeconds = 60
): RateLimitResult {
  const key = `${routeGroup}:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newRecord);
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: windowSeconds,
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
  };
}

/**
 * Resets rate limit store (useful in tests).
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

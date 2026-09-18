/**
 * In-memory sliding window rate limiter with optional Upstash Redis support.
 * Designed for serverless API routes and edge middleware.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodically clean expired records from memory every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetAt) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitOptions {
  limit: number; // Max requests
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 60, windowMs: 60 * 1000 }
): Promise<RateLimitResult> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  // If Upstash Redis credentials are provided, use Upstash REST API
  if (upstashUrl && upstashToken && !upstashUrl.includes('placeholder')) {
    try {
      const key = `ratelimit:${identifier}`;
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['PTTL', key],
        ]),
      });

      if (res.ok) {
        const data = await res.json();
        const count = data[0]?.result || 1;
        let ttl = data[1]?.result || -1;

        if (ttl === -1 || count === 1) {
          // Set expiry
          await fetch(`${upstashUrl}/PEXPIRE/${key}/${options.windowMs}`, {
            headers: { Authorization: `Bearer ${upstashToken}` },
          });
          ttl = options.windowMs;
        }

        const remaining = Math.max(0, options.limit - count);
        return {
          success: count <= options.limit,
          limit: options.limit,
          remaining,
          reset: Date.now() + (ttl > 0 ? ttl : options.windowMs),
        };
      }
    } catch {
      // Fallback to memory store if Redis request fails
    }
  }

  // Memory sliding-window fallback
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetAt) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      success: true,
      limit: options.limit,
      remaining: options.limit - 1,
      reset: now + options.windowMs,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, options.limit - record.count);

  return {
    success: record.count <= options.limit,
    limit: options.limit,
    remaining,
    reset: record.resetAt,
  };
}

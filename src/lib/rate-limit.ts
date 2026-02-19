/**
 * Simple in-memory rate limiter for API routes.
 * Tracks requests per identifier (typically user ID) within a sliding window.
 * Resets on server restart — sufficient for serverless launch protection.
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
        if (now > entry.resetAt) {
            store.delete(key);
        }
    }
}, 60_000);

interface RateLimitOptions {
    /** Maximum number of requests allowed in the window. */
    maxRequests: number;
    /** Time window in milliseconds (default: 60000 = 1 minute). */
    windowMs?: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

export function checkRateLimit(identifier: string, options: RateLimitOptions): RateLimitResult {
    const { maxRequests, windowMs = 60_000 } = options;
    const now = Date.now();
    const key = identifier;

    const existing = store.get(key);

    if (!existing || now > existing.resetAt) {
        // First request or window expired — start a new window
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
    }

    if (existing.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    existing.count++;
    return { allowed: true, remaining: maxRequests - existing.count, resetAt: existing.resetAt };
}

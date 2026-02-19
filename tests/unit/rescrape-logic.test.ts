import { describe, it, expect } from 'vitest';

/**
 * Tests for the stale URL detection and rescrape backoff logic
 * used in Slideshow.tsx. The actual logic lives in useCallback hooks
 * inside the component, but the core algorithm is pure and testable.
 *
 * We replicate the exact logic from maybeRescrape() here.
 */

// ─── Pure logic extracted from Slideshow.tsx maybeRescrape ─────────
interface RescrapeState {
    failCount: number;
    rescrapeAttempt: number;
    lastRescrapeTime: number;
    rescrapeInFlight: boolean;
    usingFallback: boolean;
}

function shouldRescrape(state: RescrapeState, now: number): boolean {
    if (state.usingFallback) return false;
    if (state.rescrapeInFlight) return false;
    if (state.failCount < 3) return false;

    const backoffMs = Math.min(30_000 * Math.pow(2, state.rescrapeAttempt), 300_000);
    const elapsed = now - state.lastRescrapeTime;
    if (elapsed < backoffMs) return false;

    return true;
}

function getBackoffMs(attempt: number): number {
    return Math.min(30_000 * Math.pow(2, attempt), 300_000);
}

// ─── Tests ────────────────────────────────────────────────────────
describe('Rescrape backoff logic', () => {

    describe('shouldRescrape', () => {
        const baseState: RescrapeState = {
            failCount: 0,
            rescrapeAttempt: 0,
            lastRescrapeTime: 0,
            rescrapeInFlight: false,
            usingFallback: false,
        };

        it('should not trigger when using fallback photos', () => {
            expect(shouldRescrape({ ...baseState, failCount: 10, usingFallback: true }, Date.now())).toBe(false);
        });

        it('should not trigger when a rescrape is already in flight', () => {
            expect(shouldRescrape({ ...baseState, failCount: 10, rescrapeInFlight: true }, Date.now())).toBe(false);
        });

        it('should not trigger with fewer than 3 failures', () => {
            expect(shouldRescrape({ ...baseState, failCount: 0 }, Date.now())).toBe(false);
            expect(shouldRescrape({ ...baseState, failCount: 1 }, Date.now())).toBe(false);
            expect(shouldRescrape({ ...baseState, failCount: 2 }, Date.now())).toBe(false);
        });

        it('should trigger at exactly 3 failures when backoff has elapsed', () => {
            expect(shouldRescrape({ ...baseState, failCount: 3 }, Date.now())).toBe(true);
        });

        it('should not trigger if within backoff window (attempt 0 = 30s)', () => {
            const now = Date.now();
            const state: RescrapeState = {
                ...baseState,
                failCount: 5,
                rescrapeAttempt: 0,
                lastRescrapeTime: now - 15_000, // 15s ago — within 30s window
            };
            expect(shouldRescrape(state, now)).toBe(false);
        });

        it('should trigger after backoff window expires (attempt 0 = 30s)', () => {
            const now = Date.now();
            const state: RescrapeState = {
                ...baseState,
                failCount: 5,
                rescrapeAttempt: 0,
                lastRescrapeTime: now - 31_000, // 31s ago — past 30s window
            };
            expect(shouldRescrape(state, now)).toBe(true);
        });

        it('should respect exponential backoff for attempt 1 (60s)', () => {
            const now = Date.now();
            const within = { ...baseState, failCount: 5, rescrapeAttempt: 1, lastRescrapeTime: now - 45_000 };
            const past = { ...baseState, failCount: 5, rescrapeAttempt: 1, lastRescrapeTime: now - 61_000 };

            expect(shouldRescrape(within, now)).toBe(false); // 45s < 60s
            expect(shouldRescrape(past, now)).toBe(true);    // 61s > 60s
        });

        it('should respect exponential backoff for attempt 2 (120s)', () => {
            const now = Date.now();
            const within = { ...baseState, failCount: 5, rescrapeAttempt: 2, lastRescrapeTime: now - 100_000 };
            const past = { ...baseState, failCount: 5, rescrapeAttempt: 2, lastRescrapeTime: now - 121_000 };

            expect(shouldRescrape(within, now)).toBe(false);
            expect(shouldRescrape(past, now)).toBe(true);
        });
    });

    describe('getBackoffMs', () => {
        it('should return 30s for attempt 0', () => {
            expect(getBackoffMs(0)).toBe(30_000);
        });

        it('should return 60s for attempt 1', () => {
            expect(getBackoffMs(1)).toBe(60_000);
        });

        it('should return 120s for attempt 2', () => {
            expect(getBackoffMs(2)).toBe(120_000);
        });

        it('should return 240s for attempt 3', () => {
            expect(getBackoffMs(3)).toBe(240_000);
        });

        it('should cap at 300s (5 minutes) for attempt 4+', () => {
            expect(getBackoffMs(4)).toBe(300_000); // 480_000 capped to 300_000
            expect(getBackoffMs(5)).toBe(300_000);
            expect(getBackoffMs(10)).toBe(300_000);
            expect(getBackoffMs(100)).toBe(300_000);
        });
    });

    describe('failure counter behavior', () => {
        it('should track that consecutive failures accumulate', () => {
            // Simulating what happens in the Slideshow component
            let failCount = 0;

            // 3 images fail in a row
            failCount++; // image 1 fails
            failCount++; // image 2 fails
            failCount++; // image 3 fails

            expect(failCount).toBe(3);
            expect(shouldRescrape({
                failCount,
                rescrapeAttempt: 0,
                lastRescrapeTime: 0,
                rescrapeInFlight: false,
                usingFallback: false,
            }, Date.now())).toBe(true);
        });

        it('should track that a successful load resets the counter', () => {
            let failCount = 0;

            failCount++; // image 1 fails
            failCount++; // image 2 fails
            failCount = 0; // image 3 succeeds — RESET

            expect(failCount).toBe(0);
            expect(shouldRescrape({
                failCount,
                rescrapeAttempt: 0,
                lastRescrapeTime: 0,
                rescrapeInFlight: false,
                usingFallback: false,
            }, Date.now())).toBe(false);
        });

        it('should track that success after rescrape resets attempt counter', () => {
            // After a successful rescrape, both counters reset
            let failCount = 5;
            let rescrapeAttempt = 3;

            // Rescrape succeeds
            failCount = 0;
            rescrapeAttempt = 0;

            // Subsequent failures should use attempt 0 backoff (30s) not attempt 3 (240s)
            failCount = 3;
            expect(getBackoffMs(rescrapeAttempt)).toBe(30_000);
        });
    });
});

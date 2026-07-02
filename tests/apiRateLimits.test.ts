import { describe, it, expect } from 'vitest';
import {
  slidingWindowVerdict,
  tutorRateLimitVerdict,
  TUTOR_RATE_LIMITS,
  HOUR_MS,
  DAY_MS,
} from '../api/_shared';

const NOW = 1_750_000_000_000; // fixed reference instant

describe('slidingWindowVerdict', () => {
  it('does not block below the limit', () => {
    const stamps = [NOW - 1000, NOW - 2000, NOW - 3000];
    expect(slidingWindowVerdict(NOW, stamps, 4, HOUR_MS)).toEqual({
      blocked: false,
      retryAfterSec: 0,
    });
  });

  it('blocks exactly at the limit', () => {
    const stamps = [NOW - 1000, NOW - 2000, NOW - 3000];
    const verdict = slidingWindowVerdict(NOW, stamps, 3, HOUR_MS);
    expect(verdict.blocked).toBe(true);
    expect(verdict.retryAfterSec).toBeGreaterThan(0);
  });

  it('Retry-After is when the oldest in-window event ages out', () => {
    const oldest = NOW - 50 * 60 * 1000; // 50 min ago → exits window in 10 min
    const stamps = [oldest, NOW - 1000, NOW - 2000];
    const verdict = slidingWindowVerdict(NOW, stamps, 3, HOUR_MS);
    expect(verdict.retryAfterSec).toBe(10 * 60);
  });

  it('ignores events older than the window', () => {
    const stamps = [NOW - HOUR_MS - 1, NOW - HOUR_MS - 5000, NOW - 1000];
    expect(slidingWindowVerdict(NOW, stamps, 3, HOUR_MS).blocked).toBe(false);
  });

  it('returns at least 1 second when blocked at the window edge', () => {
    const stamps = [NOW - HOUR_MS + 10, NOW - 500]; // oldest exits in 10ms
    const verdict = slidingWindowVerdict(NOW, stamps, 2, HOUR_MS);
    expect(verdict.blocked).toBe(true);
    expect(verdict.retryAfterSec).toBeGreaterThanOrEqual(1);
  });

  it('handles the empty history', () => {
    expect(slidingWindowVerdict(NOW, [], 1, HOUR_MS).blocked).toBe(false);
  });
});

describe('tutorRateLimitVerdict', () => {
  const spread = (count: number, windowMs: number) =>
    Array.from({ length: count }, (_, i) => NOW - Math.floor(((i + 1) * windowMs) / (count + 1)));

  it('allows one under the hourly limit', () => {
    const stamps = spread(TUTOR_RATE_LIMITS.perHour - 1, HOUR_MS);
    expect(tutorRateLimitVerdict(NOW, stamps).blocked).toBe(false);
  });

  it('blocks at the hourly limit', () => {
    const stamps = spread(TUTOR_RATE_LIMITS.perHour, HOUR_MS);
    const verdict = tutorRateLimitVerdict(NOW, stamps);
    expect(verdict.blocked).toBe(true);
    expect(verdict.retryAfterSec).toBeGreaterThan(0);
    expect(verdict.retryAfterSec).toBeLessThanOrEqual(3600);
  });

  it('blocks at the daily limit even when the last hour is quiet', () => {
    // 200 messages spread over the day, none in the last hour
    const stamps = Array.from(
      { length: TUTOR_RATE_LIMITS.perDay },
      (_, i) => NOW - HOUR_MS - Math.floor((i * (DAY_MS - 2 * HOUR_MS)) / TUTOR_RATE_LIMITS.perDay),
    );
    const verdict = tutorRateLimitVerdict(NOW, stamps);
    expect(verdict.blocked).toBe(true);
    // Daily block must wait for the day window, longer than any hour block
    expect(verdict.retryAfterSec).toBeGreaterThan(3600);
  });

  it('reports the longer wait when both windows are exceeded', () => {
    const stamps = spread(TUTOR_RATE_LIMITS.perDay, DAY_MS / 2);
    const verdict = tutorRateLimitVerdict(NOW, stamps);
    expect(verdict.blocked).toBe(true);
    expect(verdict.retryAfterSec).toBeGreaterThan(3600);
  });
});

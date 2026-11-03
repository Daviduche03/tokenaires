import { describe, expect, it } from 'vitest';
import { parseRetryAfter } from '@/api/client';
import { ApiError } from '@/api/errors';
import { withRateLimitRetry } from '@/api/retry';

describe('rate limit retry', () => {
  it('reads Retry-After as seconds or an HTTP date', () => {
    const now = Date.parse('2026-11-01T00:00:00.000Z');
    expect(parseRetryAfter('7', now)).toBe(7000);
    expect(parseRetryAfter('Sun, 01 Nov 2026 00:00:30 GMT', now)).toBe(30_000);
    expect(parseRetryAfter(null, now)).toBeNull();
    expect(parseRetryAfter('soon', now)).toBeNull();
  });

  it('waits 10 seconds by default and retries until the request succeeds', async () => {
    const waits: number[] = [];
    let calls = 0;
    const result = await withRateLimitRetry(
      () => {
        calls += 1;
        return calls < 3 ? Promise.reject(new ApiError(429, 'slow down')) : Promise.resolve('done');
      },
      { sleep: (ms) => Promise.resolve(void waits.push(ms)) },
    );
    expect(result).toBe('done');
    expect(waits).toEqual([10_000, 10_000]);
  });

  it('does not retry other errors', async () => {
    let calls = 0;
    const failing = (): Promise<string> => {
      calls += 1;
      return Promise.reject(new ApiError(500, 'boom'));
    };
    await expect(withRateLimitRetry(failing, { sleep: () => Promise.resolve() })).rejects.toThrow('boom');
    expect(calls).toBe(1);
  });
});

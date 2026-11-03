import { RATE_LIMIT } from '@/config';
import { ApiError } from '@/api/errors';

export interface RetryOptions {
  sleep(ms: number): Promise<void>;
  onWait?(ms: number): void;
}

function waitFor(error: ApiError): number {
  const wait = error.retryAfterMs ?? RATE_LIMIT.defaultWaitMs;
  return Math.min(Math.max(wait, RATE_LIMIT.minWaitMs), RATE_LIMIT.maxWaitMs);
}

export async function withRateLimitRetry<T>(task: () => Promise<T>, options: RetryOptions): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 429 || attempt >= RATE_LIMIT.maxRetries) throw error;
      const wait = waitFor(error);
      options.onWait?.(wait);
      await options.sleep(wait);
    }
  }
}

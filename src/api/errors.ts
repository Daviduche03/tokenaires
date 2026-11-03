export class ApiError extends Error {
  readonly status: number;
  readonly retryAfterMs: number | null;

  constructor(status: number, message: string, retryAfterMs: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

export const UNAUTHORIZED_MESSAGE = 'Your login is no longer valid. Run tokenaires login again.';
export const NOT_LOGGED_IN_MESSAGE = 'You are not logged in. Run tokenaires login first.';

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.status === 401 ? UNAUTHORIZED_MESSAGE : error.message;
  if (error instanceof UsageError) return error.message;
  if (error instanceof Error) return `Something went wrong: ${error.message}`;
  return 'Something went wrong.';
}

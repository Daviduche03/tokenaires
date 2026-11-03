import {
  AgentSource,
  RejectionReason,
  UsageRecord,
} from '@tokenaires/contracts';

export const RECORD_ID_PATTERNS: Record<AgentSource, RegExp> = {
  'claude-code': /^msg_[A-Za-z0-9_-]{16,64}(:req_[A-Za-z0-9_-]{16,64})?$/,
  codex:
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:\d{1,7}$/i,
};

export const SOURCE_LAUNCH_DATES: Record<AgentSource, string> = {
  'claude-code': '2025-02-20T00:00:00Z',
  codex: '2025-04-14T00:00:00Z',
};

export const MODEL_RELEASE_DATES: ReadonlyArray<{
  prefix: string;
  releasedAt: string;
}> = [
  { prefix: 'claude-sonnet-4-5', releasedAt: '2025-09-27T00:00:00Z' },
  { prefix: 'claude-haiku-4-5', releasedAt: '2025-10-13T00:00:00Z' },
  { prefix: 'claude-opus-4-5', releasedAt: '2025-11-22T00:00:00Z' },
  { prefix: 'claude-opus-4-1', releasedAt: '2025-08-03T00:00:00Z' },
  { prefix: 'claude-opus-4', releasedAt: '2025-05-20T00:00:00Z' },
  { prefix: 'claude-sonnet-4', releasedAt: '2025-05-20T00:00:00Z' },
  { prefix: 'gpt-5-codex', releasedAt: '2025-09-13T00:00:00Z' },
];

export const PLAUSIBILITY = {
  futureSkewMs: 10 * 60 * 1000,
  maxOutputPerRecord: 300_000,
  maxTotalPerRecord: 4_000_000,
  hourlyOutputReview: 5_000_000,
  dailyOutputReview: 40_000_000,
} as const;

export function totalTokensOf(record: UsageRecord): number {
  return (
    record.inputTokens +
    record.outputTokens +
    record.cacheReadTokens +
    record.cacheWriteTokens
  );
}

function releaseDateFor(model: string): number | null {
  const normalized = model.toLowerCase();
  const match = MODEL_RELEASE_DATES.find((entry) =>
    normalized.startsWith(entry.prefix),
  );
  return match ? Date.parse(match.releasedAt) : null;
}

export function evaluateRecord(
  record: UsageRecord,
  now: number,
): RejectionReason | null {
  if (!RECORD_ID_PATTERNS[record.source].test(record.recordId))
    return 'invalid_record_id';
  const occurredAt = Date.parse(record.occurredAt);
  if (occurredAt > now + PLAUSIBILITY.futureSkewMs) return 'future_timestamp';
  if (occurredAt < Date.parse(SOURCE_LAUNCH_DATES[record.source]))
    return 'before_source_launch';
  const releasedAt = releaseDateFor(record.model);
  if (releasedAt !== null && occurredAt < releasedAt)
    return 'before_model_release';
  const inputSide =
    record.inputTokens + record.cacheReadTokens + record.cacheWriteTokens;
  if (record.outputTokens > 0 && inputSide === 0) return 'implausible_ratio';
  if (record.reasoningTokens > record.outputTokens) return 'implausible_ratio';
  if (record.outputTokens > PLAUSIBILITY.maxOutputPerRecord)
    return 'implausible_ratio';
  if (totalTokensOf(record) > PLAUSIBILITY.maxTotalPerRecord)
    return 'implausible_ratio';
  return null;
}

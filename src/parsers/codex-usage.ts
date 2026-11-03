import type { UsageRecord } from '@tokenaires/contracts';
import { child, count, isoTime, type JsonObject } from '@/parsers/json';
import { hasTokens } from '@/parsers/merge';
import type { ReplayWindow } from '@/parsers/codex-replay';

export const UNKNOWN_MODEL = 'unknown';

const COUNTERS = [
  'input_tokens',
  'cached_input_tokens',
  'cache_write_input_tokens',
  'output_tokens',
  'reasoning_output_tokens',
] as const;

export interface CodexState {
  sessionId: string | null;
  fallbackId: string;
  ownId: string | null;
  model: string;
  sawMeta: boolean;
  sawUsageRecord: boolean;
  previousTotal: number | null;
  previousInfo: string | null;
  cumulative: JsonObject | null;
  replay: ReplayWindow | null;
}

export function toCodexRecord(state: CodexState, usage: JsonObject, timestamp: unknown, ordinal: number): UsageRecord | null {
  const occurredAt = isoTime(timestamp);
  if (!occurredAt) return null;
  const input = count(usage, 'input_tokens');
  const cached = count(usage, 'cached_input_tokens');
  const uncached = Math.max(0, input - cached);
  const cacheWrite = Math.min(count(usage, 'cache_write_input_tokens'), uncached);
  const record: UsageRecord = {
    source: 'codex',
    recordId: `${state.sessionId ?? state.fallbackId}:${ordinal}`,
    model: state.model,
    occurredAt,
    inputTokens: uncached - cacheWrite,
    outputTokens: count(usage, 'output_tokens'),
    cacheReadTokens: cached,
    cacheWriteTokens: cacheWrite,
    reasoningTokens: count(usage, 'reasoning_output_tokens'),
  };
  return hasTokens(record) ? record : null;
}

function delta(current: JsonObject, previous: JsonObject | null): JsonObject {
  const result: JsonObject = {};
  for (const key of COUNTERS) result[key] = Math.max(0, count(current, key) - count(previous, key));
  return result;
}

export function tokenCountUsage(state: CodexState, info: JsonObject, replayed: boolean): JsonObject | null {
  const identity = JSON.stringify(info);
  if (identity === state.previousInfo) return null;
  state.previousInfo = identity;
  const totals = child(info, 'total_token_usage');
  const reported = typeof totals?.total_tokens === 'number';
  const total = reported ? count(totals, 'total_tokens') : null;
  const repeated = total !== null && total === state.previousTotal;
  state.previousTotal = total;
  const usage = child(info, 'last_token_usage') ?? (totals ? delta(totals, state.cumulative) : null);
  if (totals) state.cumulative = totals;
  return replayed || repeated ? null : usage;
}

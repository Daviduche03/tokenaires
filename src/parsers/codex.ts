import { basename } from 'node:path';
import type { UsageRecord } from '@tokenaires/contracts';
import { eachLine } from '@/files/lines';
import { child, count, isoTime, parseObject, text, type JsonObject } from '@/parsers/json';

const UNKNOWN_MODEL = 'unknown';
const MARKERS = ['"session_meta"', '"turn_context"', '"token_count"', '"token_usage_record"'];
const FILE_ID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl$/i;

interface CodexState {
  sessionId: string | null;
  fallbackId: string;
  model: string;
  lastTotal: number;
  pendingRecordTotal: number | null;
}

export function sessionIdFromFileName(path: string): string | null {
  return FILE_ID.exec(basename(path))?.[1]?.toLowerCase() ?? null;
}

function toRecord(
  state: CodexState,
  usage: JsonObject,
  timestamp: unknown,
  ordinal: number,
): UsageRecord | null {
  const occurredAt = isoTime(timestamp);
  if (!occurredAt) return null;
  const input = count(usage, 'input_tokens');
  const cached = count(usage, 'cached_input_tokens');
  const record: UsageRecord = {
    source: 'codex',
    recordId: `${state.sessionId ?? state.fallbackId}:${ordinal}`,
    model: state.model,
    occurredAt,
    inputTokens: Math.max(0, input - cached),
    outputTokens: count(usage, 'output_tokens'),
    cacheReadTokens: cached,
    cacheWriteTokens: count(usage, 'cache_write_input_tokens'),
    reasoningTokens: count(usage, 'reasoning_output_tokens'),
  };
  const total = record.inputTokens + record.outputTokens + record.cacheReadTokens + record.cacheWriteTokens;
  return total > 0 ? record : null;
}

function fromUsageRecord(state: CodexState, entry: JsonObject, ordinal: number): UsageRecord | null {
  const usage = child(child(entry, 'payload'), 'usage');
  if (!usage) return null;
  state.pendingRecordTotal = count(usage, 'total_tokens');
  return toRecord(state, usage, entry.timestamp, ordinal);
}

function fromTokenCount(state: CodexState, entry: JsonObject, ordinal: number): UsageRecord | null {
  const info = child(child(entry, 'payload'), 'info');
  const last = child(info, 'last_token_usage');
  if (!info || !last) return null;
  const total = count(child(info, 'total_token_usage'), 'total_tokens');
  if (total <= state.lastTotal) return null;
  state.lastTotal = total;
  const pending = state.pendingRecordTotal;
  state.pendingRecordTotal = null;
  if (pending !== null && pending === count(last, 'total_tokens')) return null;
  return toRecord(state, last, entry.timestamp, ordinal);
}

export function createCodexState(path: string): CodexState {
  return {
    sessionId: sessionIdFromFileName(path),
    fallbackId: basename(path, '.jsonl'),
    model: UNKNOWN_MODEL,
    lastTotal: -1,
    pendingRecordTotal: null,
  };
}

export function parseCodexLine(state: CodexState, line: string, index: number): UsageRecord | null {
  if (!MARKERS.some((marker) => line.includes(marker))) return null;
  const entry = parseObject(line);
  if (!entry) return null;
  const ordinal = typeof entry.ordinal === 'number' ? entry.ordinal : index;
  const payload = child(entry, 'payload');
  if (entry.type === 'session_meta') {
    state.sessionId ??= text(payload, 'id');
    return null;
  }
  if (entry.type === 'turn_context') {
    state.model = text(payload, 'model') ?? state.model;
    return null;
  }
  if (entry.type === 'token_usage_record') return fromUsageRecord(state, entry, ordinal);
  if (entry.type === 'event_msg' && payload?.type === 'token_count') {
    return fromTokenCount(state, entry, ordinal);
  }
  return null;
}

export async function parseCodexFile(path: string, into: Map<string, UsageRecord>): Promise<void> {
  const state = createCodexState(path);
  await eachLine(path, (line, index) => {
    const record = parseCodexLine(state, line, index);
    if (record && !into.has(record.recordId)) into.set(record.recordId, record);
  });
}

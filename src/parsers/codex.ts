import { basename } from 'node:path';
import type { UsageRecord } from '@tokenaires/contracts';
import { eachLine } from '@/files/lines';
import { headTimestamp, isReplayed, openReplayWindow } from '@/parsers/codex-replay';
import { toCodexRecord, tokenCountUsage, UNKNOWN_MODEL, type CodexState } from '@/parsers/codex-usage';
import { bytesHave, child, markerBuffers, parseObject, text, type JsonObject } from '@/parsers/json';

const MARKERS = markerBuffers('"session_meta"', '"turn_context"', '"token_count"', '"token_usage_record"');
const FILE_ID = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.jsonl(?:\.zst)?$/i;
const FILE_SUFFIX = /\.jsonl(?:\.zst)?$/;

export type { CodexState } from '@/parsers/codex-usage';

export function sessionIdFromFileName(path: string): string | null {
  return FILE_ID.exec(basename(path))?.[1]?.toLowerCase() ?? null;
}

export function createCodexState(path: string): CodexState {
  return {
    sessionId: sessionIdFromFileName(path),
    fallbackId: basename(path).replace(FILE_SUFFIX, ''),
    ownId: null,
    model: UNKNOWN_MODEL,
    sawMeta: false,
    sawUsageRecord: false,
    previousTotal: null,
    previousInfo: null,
    cumulative: null,
    replay: null,
  };
}

function parentOf(payload: JsonObject | null): string | null {
  const spawn = child(child(child(payload, 'source'), 'subagent'), 'thread_spawn');
  return text(payload, 'forked_from_id') ?? text(payload, 'parent_thread_id') ?? text(spawn, 'parent_thread_id');
}

function readMeta(state: CodexState, entry: JsonObject, payload: JsonObject | null): void {
  if (state.sawMeta) return;
  state.sawMeta = true;
  state.ownId = text(payload, 'id');
  state.sessionId ??= state.ownId;
  state.model = text(payload, 'model') ?? state.model;
  if (parentOf(payload)) state.replay = openReplayWindow(entry.timestamp);
}

function fromUsageRecord(state: CodexState, entry: JsonObject, ordinal: number, replayed: boolean): UsageRecord | null {
  const payload = child(entry, 'payload');
  const usage = child(payload, 'usage');
  if (!usage) return null;
  state.sawUsageRecord = true;
  const thread = text(payload, 'thread_id');
  if (replayed || (thread && state.ownId && thread !== state.ownId)) return null;
  return toCodexRecord(state, usage, entry.timestamp, ordinal);
}

function fromTokenCount(state: CodexState, entry: JsonObject, ordinal: number, replayed: boolean): UsageRecord | null {
  if (state.sawUsageRecord) return null;
  const info = child(child(entry, 'payload'), 'info');
  if (!info) return null;
  const usage = tokenCountUsage(state, info, replayed);
  return usage ? toCodexRecord(state, usage, entry.timestamp, ordinal) : null;
}

export function parseCodexLine(state: CodexState, line: string, index: number): UsageRecord | null {
  const entry = parseObject(line);
  if (!entry) return null;
  const ordinal = typeof entry.ordinal === 'number' ? entry.ordinal : index;
  const payload = child(entry, 'payload');
  if (entry.type === 'session_meta') {
    readMeta(state, entry, payload);
    return null;
  }
  const replayed = isReplayed(state.replay, entry.timestamp);
  if (entry.type === 'turn_context') {
    state.model = text(payload, 'model') ?? state.model;
    return null;
  }
  if (entry.type === 'token_usage_record') return fromUsageRecord(state, entry, ordinal, replayed);
  if (entry.type === 'event_msg' && payload?.type === 'token_count') {
    return fromTokenCount(state, entry, ordinal, replayed);
  }
  return null;
}

export function parseCodexBytes(state: CodexState, line: Buffer, index: number): UsageRecord | null {
  if (bytesHave(line, MARKERS)) return parseCodexLine(state, line.toString('utf8'), index);
  if (state.replay?.active) isReplayed(state.replay, headTimestamp(line));
  return null;
}

export async function parseCodexFile(path: string): Promise<UsageRecord[] | null> {
  const state = createCodexState(path);
  const into = new Map<string, UsageRecord>();
  const ok = await eachLine(path, (line, index) => {
    const record = parseCodexBytes(state, line, index);
    if (record && !into.has(record.recordId)) into.set(record.recordId, record);
  });
  return ok ? [...into.values()] : null;
}

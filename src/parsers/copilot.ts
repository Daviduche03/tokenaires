import { createHash } from 'node:crypto';
import type { UsageRecord } from '@tokenaires/contracts';
import { count, epochTime, isoTime, text, type JsonObject } from '@/parsers/json';
import { hasTokens } from '@/parsers/merge';

const ID_PREFIX = 'copilot:';
const ID_HEX_LENGTH = 32;
const EPOCH = /^\d+(\.\d+)?$/;
const ZONELESS = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/;

function rawPart(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'bigint') return value.toString();
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function copilotTime(value: unknown): string | null {
  if (typeof value === 'number') return epochTime(value);
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (EPOCH.test(raw)) return epochTime(Number(raw));
  return isoTime(ZONELESS.test(raw) ? `${raw.replace(' ', 'T')}Z` : raw);
}

export function copilotRecordId(sessionId: string, id: string, createdAt: string): string {
  const digest = createHash('sha256').update(`${sessionId}|${id}|${createdAt}`).digest('hex');
  return `${ID_PREFIX}${digest.slice(0, ID_HEX_LENGTH)}`;
}

export function copilotRecord(row: JsonObject): UsageRecord | null {
  const sessionId = text(row, 'session_id');
  const id = rawPart(row.id);
  const createdAt = rawPart(row.created_at);
  const model = text(row, 'model');
  const occurredAt = copilotTime(row.created_at);
  if (!sessionId || !id || !createdAt || !model || !occurredAt) return null;
  const cacheReadTokens = count(row, 'cache_read_tokens');
  const cacheWriteTokens = count(row, 'cache_write_tokens');
  const outputTokens = count(row, 'output_tokens');
  const record: UsageRecord = {
    source: 'copilot-cli',
    recordId: copilotRecordId(sessionId, id, createdAt),
    model,
    occurredAt,
    inputTokens: Math.max(0, count(row, 'input_tokens') - cacheReadTokens - cacheWriteTokens),
    outputTokens,
    cacheReadTokens,
    cacheWriteTokens,
    reasoningTokens: Math.min(count(row, 'reasoning_tokens'), outputTokens),
  };
  return hasTokens(record) ? record : null;
}

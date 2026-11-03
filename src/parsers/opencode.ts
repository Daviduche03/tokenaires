import type { UsageRecord } from '@tokenaires/contracts';
import { child, count, epochTime, nativeId, text, type JsonObject } from '@/parsers/json';
import { hasTokens } from '@/parsers/merge';

export type OpenCodeLayout = 'v2' | 'legacy';

export interface OpenCodeMessage {
  id: string | null;
  model: string | null;
  createdAt: unknown;
  tokens: JsonObject | null;
  layout: OpenCodeLayout;
}

function reasoningIsSeparate(tokens: JsonObject, layout: OpenCodeLayout): boolean {
  if (layout === 'v2') return true;
  const total = count(tokens, 'total');
  const cache = child(tokens, 'cache');
  const base = count(tokens, 'input') + count(tokens, 'output') + count(tokens, 'reasoning');
  return total > 0 && (total === base || total === base + count(cache, 'read') + count(cache, 'write'));
}

export function openCodeRecord(message: OpenCodeMessage): UsageRecord | null {
  const recordId = nativeId(message.id);
  const occurredAt = epochTime(message.createdAt);
  const tokens = message.tokens;
  if (!recordId || !occurredAt || !tokens || !message.model) return null;
  const cache = child(tokens, 'cache');
  const reasoning = count(tokens, 'reasoning');
  const output = count(tokens, 'output');
  const separate = reasoningIsSeparate(tokens, message.layout);
  const record: UsageRecord = {
    source: 'opencode',
    recordId,
    model: message.model,
    occurredAt,
    inputTokens: count(tokens, 'input'),
    outputTokens: separate ? output + reasoning : output,
    cacheReadTokens: count(cache, 'read'),
    cacheWriteTokens: count(cache, 'write'),
    reasoningTokens: separate ? reasoning : Math.min(reasoning, output),
  };
  return hasTokens(record) ? record : null;
}

export function legacyMessage(data: JsonObject, fallbackId: string | null, createdAt: unknown): OpenCodeMessage | null {
  const role = text(data, 'role');
  if (role !== 'assistant' && role !== 'model') return null;
  return {
    id: text(data, 'id') ?? fallbackId,
    model: text(data, 'modelID') ?? text(data, 'model'),
    createdAt: child(data, 'time')?.created ?? createdAt,
    tokens: child(data, 'tokens'),
    layout: 'legacy',
  };
}

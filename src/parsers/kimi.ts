import { basename, dirname } from 'node:path';
import type { UsageRecord } from '@tokenaires/contracts';
import { eachLine } from '@/files/lines';
import { RECORD_ID_PATTERN, bytesHave, child, count, epochTime, markerBuffers, parseObject, text, type JsonObject } from '@/parsers/json';
import { hasTokens } from '@/parsers/merge';

const USAGE_TYPE = 'usage.record';
const FORKED_TYPE = 'forked';
const REQUEST_TYPE = 'llm.request';
const MARKERS = markerBuffers(`"${USAGE_TYPE}"`, `"${FORKED_TYPE}"`, `"${REQUEST_TYPE}"`);
const ID_SAFE = /[^A-Za-z0-9_.-]/g;

export interface KimiWireOwner {
  sessionId: string;
  agentId: string;
}

export function kimiWireOwner(path: string): KimiWireOwner | null {
  const agentDir = dirname(path);
  const agentsDir = dirname(agentDir);
  if (basename(agentsDir) !== 'agents') return null;
  const sessionId = basename(dirname(agentsDir)).replace(ID_SAFE, '');
  const agentId = basename(agentDir).replace(ID_SAFE, '');
  return sessionId.length >= 8 && agentId.length > 0 ? { sessionId, agentId } : null;
}

function reasoningOf(usage: JsonObject, output: number): number {
  const details = child(child(usage, 'raw'), 'completion_tokens_details');
  return Math.min(count(details, 'reasoning_tokens'), output);
}

export function kimiRecord(owner: KimiWireOwner, line: number, entry: JsonObject, requestModel: string | null = null): UsageRecord | null {
  if (entry.type !== USAGE_TYPE) return null;
  const usage = child(entry, 'usage');
  const model = requestModel ?? text(entry, 'model');
  const occurredAt = epochTime(entry.time);
  const recordId = `${owner.sessionId}:${owner.agentId}:${line}`;
  if (!usage || !model || !occurredAt || !RECORD_ID_PATTERN.test(recordId)) return null;
  const outputTokens = count(usage, 'output');
  const record: UsageRecord = {
    source: 'kimi-code',
    recordId,
    model,
    occurredAt,
    inputTokens: count(usage, 'inputOther'),
    outputTokens,
    cacheReadTokens: count(usage, 'inputCacheRead'),
    cacheWriteTokens: count(usage, 'inputCacheCreation'),
    reasoningTokens: reasoningOf(usage, outputTokens),
  };
  return hasTokens(record) ? record : null;
}

export async function parseKimiWire(path: string): Promise<UsageRecord[] | null> {
  const owner = kimiWireOwner(path);
  if (!owner) return [];
  const found: { line: number; record: UsageRecord }[] = [];
  let forkedAt = -1;
  let requestModel: string | null = null;
  const ok = await eachLine(path, (raw, index) => {
    if (!bytesHave(raw, MARKERS)) return;
    const entry = parseObject(raw.toString('utf8'));
    if (!entry) return;
    if (entry.type === FORKED_TYPE) {
      forkedAt = index;
      return;
    }
    if (entry.type === REQUEST_TYPE) {
      requestModel = text(entry, 'model');
      return;
    }
    const record = kimiRecord(owner, index + 1, entry, requestModel);
    if (record) found.push({ line: index, record });
  });
  if (!ok) return null;
  return found.filter((item) => item.line > forkedAt).map((item) => item.record);
}

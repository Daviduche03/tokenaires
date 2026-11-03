import type { UsageRecord } from '@tokenaires/contracts';
import { eachLine } from '@/files/lines';
import { child, count, isObject, isoTime, markerBuffers, parseObject, text, type JsonObject } from '@/parsers/json';
import { hasTokens, keepLargest } from '@/parsers/merge';

const SYNTHETIC_MODEL = '<synthetic>';
const ADVISOR_TYPE = 'advisor_message';
const USAGE_MARKERS = markerBuffers('"usage"');

interface ClaudeEntry {
  baseId: string;
  model: string;
  occurredAt: string;
  usage: JsonObject;
}

function toRecord(recordId: string, model: string, occurredAt: string, usage: JsonObject): UsageRecord {
  return {
    source: 'claude-code',
    recordId,
    model,
    occurredAt,
    inputTokens: count(usage, 'input_tokens'),
    outputTokens: count(usage, 'output_tokens'),
    cacheReadTokens: count(usage, 'cache_read_input_tokens'),
    cacheWriteTokens: count(usage, 'cache_creation_input_tokens'),
    reasoningTokens: count(child(usage, 'output_tokens_details'), 'thinking_tokens'),
  };
}

function readEntry(line: string): ClaudeEntry | null {
  if (!line.includes('"usage"')) return null;
  const entry = parseObject(line);
  const message = child(entry, 'message');
  const usage = child(message, 'usage');
  const messageId = text(message, 'id');
  if (!usage || !messageId) return null;
  const model = text(message, 'model');
  if (!model || model === SYNTHETIC_MODEL) return null;
  const occurredAt = isoTime(entry?.timestamp);
  if (!occurredAt) return null;
  const requestId = text(entry, 'requestId');
  return { baseId: requestId ? `${messageId}:${requestId}` : messageId, model, occurredAt, usage };
}

function advisorRecords(entry: ClaudeEntry): UsageRecord[] {
  const iterations = entry.usage.iterations;
  if (!Array.isArray(iterations)) return [];
  const records: UsageRecord[] = [];
  for (const iteration of iterations) {
    if (!isObject(iteration) || iteration.type !== ADVISOR_TYPE) continue;
    const model = text(iteration, 'model') ?? entry.model;
    const recordId = `${entry.baseId}:advisor:${records.length}`;
    records.push(toRecord(recordId, model, entry.occurredAt, iteration));
  }
  return records.filter(hasTokens);
}

export function parseClaudeLine(line: string): UsageRecord | null {
  const entry = readEntry(line);
  if (!entry) return null;
  const record = toRecord(entry.baseId, entry.model, entry.occurredAt, entry.usage);
  return hasTokens(record) ? record : null;
}

export function parseClaudeRecords(line: string): UsageRecord[] {
  const entry = readEntry(line);
  if (!entry) return [];
  const main = toRecord(entry.baseId, entry.model, entry.occurredAt, entry.usage);
  return [...(hasTokens(main) ? [main] : []), ...advisorRecords(entry)];
}

export async function parseClaudeFile(path: string): Promise<UsageRecord[] | null> {
  const into = new Map<string, UsageRecord>();
  const ok = await eachLine(path, (line) => {
    if (!USAGE_MARKERS.some((marker) => line.includes(marker))) return;
    for (const record of parseClaudeRecords(line.toString('utf8'))) keepLargest(into, record);
  });
  return ok ? [...into.values()] : null;
}

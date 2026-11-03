import type { UsageRecord } from '@tokenaires/contracts';
import { eachLine } from '@/files/lines';
import { child, count, isoTime, parseObject, text } from '@/parsers/json';

const SYNTHETIC_MODEL = '<synthetic>';
const USAGE_MARKER = '"usage"';

export function parseClaudeLine(line: string): UsageRecord | null {
  if (!line.includes(USAGE_MARKER)) return null;
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
  return {
    source: 'claude-code',
    recordId: requestId ? `${messageId}:${requestId}` : messageId,
    model,
    occurredAt,
    inputTokens: count(usage, 'input_tokens'),
    outputTokens: count(usage, 'output_tokens'),
    cacheReadTokens: count(usage, 'cache_read_input_tokens'),
    cacheWriteTokens: count(usage, 'cache_creation_input_tokens'),
    reasoningTokens: count(child(usage, 'output_tokens_details'), 'thinking_tokens'),
  };
}

export function keepLargest(into: Map<string, UsageRecord>, record: UsageRecord): void {
  const existing = into.get(record.recordId);
  if (!existing || record.outputTokens > existing.outputTokens) into.set(record.recordId, record);
}

export async function parseClaudeFile(path: string, into: Map<string, UsageRecord>): Promise<void> {
  await eachLine(path, (line) => {
    const record = parseClaudeLine(line);
    if (record) keepLargest(into, record);
  });
}

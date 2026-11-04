import { readFile } from 'node:fs/promises';
import type { UsageRecord } from '@tokenaires/contracts';
import { eachLine } from '@/files/lines';
import { bytesHave, child, count, isObject, isoTime, markerBuffers, nativeId, parseObject, text, type JsonObject } from '@/parsers/json';
import { hasTokens } from '@/parsers/merge';

const ASSISTANT_TYPE = 'assistant';
const LEGACY_TYPE = 'qwen';
const LEGACY_SUFFIX = '.json';
const TRANSCRIPT_SUFFIX = '.jsonl';
const META_SUFFIX = '.meta.json';
const MARKERS = markerBuffers('"usageMetadata"');

interface QwenCounts {
  prompt: number;
  candidates: number;
  cached: number;
  thoughts: number;
  tool: number;
  total: number;
}

function usageCounts(usage: JsonObject): QwenCounts {
  return {
    prompt: count(usage, 'promptTokenCount'),
    candidates: count(usage, 'candidatesTokenCount'),
    cached: count(usage, 'cachedContentTokenCount'),
    thoughts: count(usage, 'thoughtsTokenCount'),
    tool: count(usage, 'toolUsePromptTokenCount'),
    total: count(usage, 'totalTokenCount'),
  };
}

function legacyCounts(tokens: JsonObject): QwenCounts {
  return {
    prompt: count(tokens, 'input'),
    candidates: count(tokens, 'output'),
    cached: count(tokens, 'cached'),
    thoughts: count(tokens, 'thoughts'),
    tool: count(tokens, 'tool'),
    total: count(tokens, 'total'),
  };
}

function buildRecord(recordId: string | null, model: string | null, occurredAt: string | null, counts: QwenCounts): UsageRecord | null {
  if (!recordId || !model || !occurredAt) return null;
  const toolInTotal = counts.tool > 0 && counts.total === counts.prompt + counts.candidates + counts.thoughts + counts.tool;
  const tool = toolInTotal ? counts.tool : 0;
  const derived = counts.total - counts.prompt - tool;
  const separateThoughts = counts.total > 0 && derived > counts.candidates && derived <= counts.candidates + counts.thoughts;
  const outputTokens = separateThoughts ? derived : counts.candidates;
  const record: UsageRecord = {
    source: 'qwen-code',
    recordId,
    model,
    occurredAt,
    inputTokens: Math.max(0, counts.prompt - counts.cached) + tool,
    outputTokens,
    cacheReadTokens: counts.cached,
    cacheWriteTokens: 0,
    reasoningTokens: outputTokens - counts.candidates,
  };
  return hasTokens(record) ? record : null;
}

export function qwenRecord(entry: JsonObject, fallbackModel: string | null = null): UsageRecord | null {
  if (entry.type !== ASSISTANT_TYPE) return null;
  const usage = child(entry, 'usageMetadata');
  if (!usage) return null;
  return buildRecord(nativeId(text(entry, 'uuid')), text(entry, 'model') ?? fallbackModel, isoTime(entry.timestamp), usageCounts(usage));
}

export function qwenLegacyRecord(message: JsonObject): UsageRecord | null {
  if (message.type !== LEGACY_TYPE) return null;
  const tokens = child(message, 'tokens');
  if (!tokens) return null;
  return buildRecord(nativeId(text(message, 'id')), text(message, 'model'), isoTime(message.timestamp), legacyCounts(tokens));
}

async function readJson(path: string): Promise<JsonObject | null | undefined> {
  try {
    return parseObject(await readFile(path, 'utf8'));
  } catch {
    return undefined;
  }
}

async function agentModel(path: string): Promise<string | null> {
  if (!path.endsWith(TRANSCRIPT_SUFFIX)) return null;
  const meta = await readJson(`${path.slice(0, -TRANSCRIPT_SUFFIX.length)}${META_SUFFIX}`);
  if (!meta) return null;
  return text(meta, 'model') ?? text(child(meta, 'persistedCliFlags'), 'model');
}

async function parseLegacy(path: string): Promise<UsageRecord[] | null> {
  const parsed = await readJson(path);
  if (parsed === undefined) return null;
  const messages = parsed && Array.isArray(parsed.messages) ? parsed.messages : [];
  const records = new Map<string, UsageRecord>();
  for (const message of messages) {
    const record = isObject(message) ? qwenLegacyRecord(message) : null;
    if (record) records.set(record.recordId, record);
  }
  return [...records.values()];
}

export async function parseQwenFile(path: string): Promise<UsageRecord[] | null> {
  if (path.endsWith(LEGACY_SUFFIX)) return parseLegacy(path);
  const entries: JsonObject[] = [];
  const ok = await eachLine(path, (line) => {
    if (!bytesHave(line, MARKERS)) return;
    const entry = parseObject(line.toString('utf8'));
    if (entry?.type === ASSISTANT_TYPE) entries.push(entry);
  });
  if (!ok) return null;
  const fallback = entries.some((entry) => !text(entry, 'model')) ? await agentModel(path) : null;
  const records = new Map<string, UsageRecord>();
  for (const entry of entries) {
    const record = qwenRecord(entry, fallback);
    if (record) records.set(record.recordId, record);
  }
  return [...records.values()];
}

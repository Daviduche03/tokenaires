import { readFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import type { UsageRecord } from '@tokenaires/contracts';
import { child, count, epochTime, isObject, nativeId, parseObject, text, type JsonObject } from '@/parsers/json';
import { hasTokens, keepLargest } from '@/parsers/merge';

export type ClineFamilySource = 'cline' | 'roo-code' | 'kilo-code';

export interface ModelMark {
  ts: number;
  model: string;
}

export const UI_MESSAGES_FILE = 'ui_messages.json';
export const API_HISTORY_FILE = 'api_conversation_history.json';
export const TASK_METADATA_FILE = 'task_metadata.json';
export const SESSION_MESSAGES_SUFFIX = '.messages.json';

export const GROSS_INPUT_FROM: Readonly<Record<ClineFamilySource, number | null>> = {
  cline: null,
  'roo-code': Date.UTC(2025, 10, 2),
  'kilo-code': Date.UTC(2025, 10, 13),
};

export const LEGACY_RESUME_WARNING =
  'Warning: this is a legacy conversation, which means tool names may have changed. Please use the most up-to-date tools you are aware of.';

const USAGE_SAYS = new Set(['api_req_started', 'subagent_usage']);
const OPENAI_PROTOCOL = 'openai';
const MAX_MODEL_LENGTH = 120;
const MODEL_REJECT = /[<>"\p{Cc}]/u;
const ENV_OPEN = '<environment_details>';
const ENV_CLOSE = '</environment_details>';
const CURRENT_MODE = '# Current Mode';
const MODEL_TAG = /<model>([^<\r\n]+)<\/model>/;

export function cleanModel(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const model = value.trim();
  return model.length > 0 && model.length <= MAX_MODEL_LENGTH && !MODEL_REJECT.test(model) ? model : null;
}

function timestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function grossInputIncludesCache(source: ClineFamilySource, ts: number, apiProtocol: unknown): boolean {
  const from = GROSS_INPUT_FROM[source];
  if (from === null) return false;
  if (ts >= from) return true;
  if (typeof apiProtocol !== 'string') return false;
  const protocol = apiProtocol.trim().split('/').pop() ?? '';
  return protocol.toLowerCase() === OPENAI_PROTOCOL;
}

function plausible(record: UsageRecord): boolean {
  if (!hasTokens(record)) return false;
  const inputSide = record.inputTokens + record.cacheReadTokens + record.cacheWriteTokens;
  return record.outputTokens === 0 || inputSide > 0;
}

function buildRecord(
  source: ClineFamilySource,
  recordId: string | null,
  model: string,
  ts: number,
  input: number,
  usage: { output: number; cacheRead: number; cacheWrite: number },
): UsageRecord | null {
  const occurredAt = epochTime(ts);
  if (!recordId || !occurredAt) return null;
  const record: UsageRecord = {
    source,
    recordId,
    model,
    occurredAt,
    inputTokens: input,
    outputTokens: usage.output,
    cacheReadTokens: usage.cacheRead,
    cacheWriteTokens: usage.cacheWrite,
    reasoningTokens: 0,
  };
  return plausible(record) ? record : null;
}

export function usagePayload(entry: JsonObject): JsonObject | null {
  if (entry.type !== 'say' || typeof entry.say !== 'string' || !USAGE_SAYS.has(entry.say)) return null;
  const raw = entry.text;
  return typeof raw === 'string' ? parseObject(raw) : null;
}

export function rowModel(entry: JsonObject): string | null {
  return cleanModel(child(entry, 'modelInfo')?.modelId);
}

export function taskUsageRecord(source: ClineFamilySource, taskId: string, entry: JsonObject, model: string): UsageRecord | null {
  const ts = timestamp(entry.ts);
  const payload = usagePayload(entry);
  if (ts === null || !payload) return null;
  const tokensIn = count(payload, 'tokensIn');
  const cacheRead = count(payload, 'cacheReads');
  const cacheWrite = count(payload, 'cacheWrites');
  const input = grossInputIncludesCache(source, ts, payload.apiProtocol) ? Math.max(0, tokensIn - cacheRead - cacheWrite) : tokensIn;
  return buildRecord(source, nativeId(taskId, String(ts)), model, ts, input, { output: count(payload, 'tokensOut'), cacheRead, cacheWrite });
}

export function sortMarks(marks: ModelMark[]): ModelMark[] {
  return [...marks].sort((a, b) => a.ts - b.ts);
}

export function modelBefore(marks: readonly ModelMark[], end: number): string | null {
  let chosen: string | null = null;
  for (const mark of marks) {
    if (mark.ts >= end) break;
    chosen = mark.model;
  }
  return chosen ?? marks[0]?.model ?? null;
}

export function metadataModelMarks(metadata: unknown): ModelMark[] {
  const usage = isObject(metadata) ? metadata.model_usage : null;
  if (!Array.isArray(usage)) return [];
  return usage.filter(isObject).flatMap((entry) => {
    const model = cleanModel(entry.model_id);
    return model ? [{ ts: timestamp(entry.ts) ?? Number.NEGATIVE_INFINITY, model }] : [];
  });
}

export function environmentModel(value: string): string | null {
  const start = value.lastIndexOf(ENV_OPEN);
  if (start < 0) return null;
  const end = value.indexOf(ENV_CLOSE, start);
  const block = value.slice(start, end < 0 ? undefined : end);
  const mode = block.lastIndexOf(CURRENT_MODE);
  if (mode < 0) return null;
  return cleanModel(MODEL_TAG.exec(block.slice(mode))?.[1]);
}

function messageTexts(message: JsonObject): string[] {
  const content = message.content;
  if (typeof content === 'string') return [content];
  if (!Array.isArray(content)) return [];
  return content.flatMap((block) => (isObject(block) && typeof block.text === 'string' ? [block.text] : []));
}

export function historyModelMarks(history: unknown): ModelMark[] {
  if (!Array.isArray(history)) return [];
  const marks: ModelMark[] = [];
  for (const message of history) {
    if (!isObject(message) || message.role !== 'user') continue;
    let model: string | null = null;
    for (const value of messageTexts(message)) model = environmentModel(value) ?? model;
    if (model) marks.push({ ts: timestamp(message.ts) ?? Number.NEGATIVE_INFINITY, model });
  }
  return marks;
}

export function taskRecords(source: ClineFamilySource, taskId: string, entries: readonly unknown[], marks: readonly ModelMark[]): UsageRecord[] {
  const rows = entries
    .filter(isObject)
    .flatMap((entry) => {
      const ts = timestamp(entry.ts);
      return ts !== null && usagePayload(entry) !== null ? [{ entry, ts }] : [];
    })
    .sort((a, b) => a.ts - b.ts);
  const sorted = sortMarks([...marks]);
  const into = new Map<string, UsageRecord>();
  rows.forEach(({ entry }, index) => {
    const end = rows[index + 1]?.ts ?? Number.POSITIVE_INFINITY;
    const model = rowModel(entry) ?? modelBefore(sorted, end) ?? source;
    const record = taskUsageRecord(source, taskId, entry, model);
    if (record) keepLargest(into, record);
  });
  return [...into.values()];
}

async function readJson(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch {
    return undefined;
  }
}

async function taskModelMarks(dir: string, entries: readonly unknown[]): Promise<ModelMark[]> {
  const needsModel = entries.some((entry) => isObject(entry) && usagePayload(entry) !== null && !rowModel(entry));
  if (!needsModel) return [];
  const metadata = metadataModelMarks(await readJson(join(dir, TASK_METADATA_FILE)));
  if (metadata.length > 0) return metadata;
  return historyModelMarks(await readJson(join(dir, API_HISTORY_FILE)));
}

export function taskFileParser(source: ClineFamilySource): (path: string) => Promise<UsageRecord[] | null> {
  return async (path) => {
    const entries = await readJson(path);
    if (!Array.isArray(entries)) return null;
    const dir = dirname(path);
    const marks = await taskModelMarks(dir, entries);
    return taskRecords(source, basename(dir), entries, marks);
  };
}

function containsResumeWarning(message: JsonObject): boolean {
  return messageTexts(message).some((value) => value.includes(LEGACY_RESUME_WARNING));
}

export function forkedAt(manifest: unknown): number | null {
  const value = text(child(child(manifest, 'metadata'), 'fork'), 'forkedAt');
  const time = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(time) ? null : time;
}

export function sessionRecords(data: unknown, manifest: unknown, fallbackId: string): UsageRecord[] {
  if (!isObject(data) || !Array.isArray(data.messages)) return [];
  const sessionId = text(data, 'sessionId') ?? text(manifest, 'session_id') ?? fallbackId;
  const messages = data.messages.filter(isObject);
  const warning = messages.findIndex(containsResumeWarning);
  const fork = forkedAt(manifest);
  let model = cleanModel(text(manifest, 'model')) ?? cleanModel(text(child(manifest, 'metadata'), 'model'));
  const into = new Map<string, UsageRecord>();
  messages.forEach((message, index) => {
    if (message.role !== 'assistant') return;
    model = cleanModel(child(message, 'modelInfo')?.id) ?? model;
    const metrics = child(message, 'metrics');
    const ts = timestamp(message.ts);
    if (!metrics || ts === null || index < warning || (fork !== null && ts <= fork)) return;
    const cacheRead = count(metrics, 'cacheReadTokens');
    const cacheWrite = count(metrics, 'cacheWriteTokens');
    const input = Math.max(0, count(metrics, 'inputTokens') - cacheRead - cacheWrite);
    const usage = { output: count(metrics, 'outputTokens'), cacheRead, cacheWrite };
    const record = buildRecord('cline', nativeId(sessionId, String(ts)), model ?? 'cline', ts, input, usage);
    if (record) keepLargest(into, record);
  });
  return [...into.values()];
}

export function sessionManifestPath(path: string): string {
  return join(dirname(path), `${basename(path, SESSION_MESSAGES_SUFFIX)}.json`);
}

export async function parseClineSessionFile(path: string): Promise<UsageRecord[] | null> {
  const data = await readJson(path);
  if (!isObject(data)) return null;
  const manifest = await readJson(sessionManifestPath(path));
  return sessionRecords(data, manifest, basename(path, SESSION_MESSAGES_SUFFIX));
}

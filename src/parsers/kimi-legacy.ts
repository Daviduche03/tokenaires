import { readFile } from 'node:fs/promises';
import { join, sep } from 'node:path';
import type { UsageRecord } from '@tokenaires/contracts';
import { eachLine } from '@/files/lines';
import { RECORD_ID_PATTERN, bytesHave, child, count, epochTime, markerBuffers, parseObject, text, type JsonObject } from '@/parsers/json';
import { hasTokens } from '@/parsers/merge';

const STATUS_TYPE = 'StatusUpdate';
const MARKERS = markerBuffers('"token_usage"');
const CONFIG_FILE = 'config.toml';
const FALLBACK_MODEL = 'kimi-cli';
const SESSIONS = `${sep}sessions${sep}`;

const models = new Map<string, Promise<string>>();

function tomlString(source: string, key: string): string | null {
  const match = new RegExp(`^\\s*${key}\\s*=\\s*"([^"\\n]+)"`, 'm').exec(source);
  return match?.[1] ?? null;
}

function modelSection(source: string, alias: string): string | null {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const header = new RegExp(`^\\s*\\[models\\.(?:"${escaped}"|${escaped})\\]\\s*$`, 'm').exec(source);
  if (!header) return null;
  const rest = source.slice(header.index + header[0].length);
  const next = rest.search(/^\s*\[/m);
  return next === -1 ? rest : rest.slice(0, next);
}

export function kimiConfigModel(config: string): string | null {
  const alias = tomlString(config, 'default_model');
  if (!alias) return null;
  const section = modelSection(config, alias);
  return (section && tomlString(section, 'model')) ?? alias;
}

export function kimiShareDir(path: string): string | null {
  const at = path.lastIndexOf(SESSIONS);
  return at === -1 ? null : path.slice(0, at);
}

async function defaultModel(shareDir: string | null): Promise<string> {
  if (!shareDir) return FALLBACK_MODEL;
  let pending = models.get(shareDir);
  if (!pending) {
    pending = readFile(join(shareDir, CONFIG_FILE), 'utf8')
      .then((config) => kimiConfigModel(config) ?? FALLBACK_MODEL)
      .catch(() => FALLBACK_MODEL);
    models.set(shareDir, pending);
  }
  return pending;
}

export function resetKimiModelCache(): void {
  models.clear();
}

export function kimiLegacyRecord(entry: JsonObject, model: string): UsageRecord | null {
  const message = child(entry, 'message');
  if (text(message, 'type') !== STATUS_TYPE) return null;
  const payload = child(message, 'payload');
  const usage = child(payload, 'token_usage');
  const messageId = text(payload, 'message_id');
  const occurredAt = epochTime(entry.timestamp);
  if (!usage || !messageId || !occurredAt || !RECORD_ID_PATTERN.test(messageId)) return null;
  const record: UsageRecord = {
    source: 'kimi-code',
    recordId: messageId,
    model,
    occurredAt,
    inputTokens: count(usage, 'input_other'),
    outputTokens: count(usage, 'output'),
    cacheReadTokens: count(usage, 'input_cache_read'),
    cacheWriteTokens: count(usage, 'input_cache_creation'),
    reasoningTokens: 0,
  };
  return hasTokens(record) ? record : null;
}

export async function parseKimiLegacyWire(path: string): Promise<UsageRecord[] | null> {
  const model = await defaultModel(kimiShareDir(path));
  const records = new Map<string, UsageRecord>();
  const ok = await eachLine(path, (raw) => {
    if (!bytesHave(raw, MARKERS)) return;
    const entry = parseObject(raw.toString('utf8'));
    const record = entry ? kimiLegacyRecord(entry, model) : null;
    if (record) records.set(record.recordId, record);
  });
  return ok ? [...records.values()] : null;
}

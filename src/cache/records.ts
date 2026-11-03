import { AGENT_SOURCES, type AgentSource, type UsageRecord } from '@tokenaires/contracts';
import { isObject } from '@/parsers/json';

export type PackedRecord = [string, number, number, number, number, number, number, number];

export interface CachedFile {
  sig: string;
  source: AgentSource;
  models: string[];
  records: PackedRecord[];
}

const PACKED_LENGTH = 8;

export function pack(sig: string, source: AgentSource, records: readonly UsageRecord[]): CachedFile {
  const models: string[] = [];
  const index = new Map<string, number>();
  const packed = records.map((record): PackedRecord => {
    let slot = index.get(record.model);
    if (slot === undefined) {
      slot = models.length;
      models.push(record.model);
      index.set(record.model, slot);
    }
    return [
      record.recordId,
      slot,
      Date.parse(record.occurredAt),
      record.inputTokens,
      record.outputTokens,
      record.cacheReadTokens,
      record.cacheWriteTokens,
      record.reasoningTokens,
    ];
  });
  return { sig, source, models, records: packed };
}

export function unpack(file: CachedFile): UsageRecord[] {
  return file.records.map(([recordId, slot, at, input, output, cacheRead, cacheWrite, reasoning]) => ({
    source: file.source,
    recordId,
    model: file.models[slot] ?? '',
    occurredAt: new Date(at).toISOString(),
    inputTokens: input,
    outputTokens: output,
    cacheReadTokens: cacheRead,
    cacheWriteTokens: cacheWrite,
    reasoningTokens: reasoning,
  }));
}

function isPacked(value: unknown, models: number): value is PackedRecord {
  if (!Array.isArray(value) || value.length !== PACKED_LENGTH || typeof value[0] !== 'string') return false;
  const numbers = value.slice(1);
  if (!numbers.every((item) => typeof item === 'number' && Number.isFinite(item) && item >= 0)) return false;
  return Number(value[1]) < models;
}

function isSource(value: unknown): value is AgentSource {
  return typeof value === 'string' && (AGENT_SOURCES as readonly string[]).includes(value);
}

function isModels(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((model) => typeof model === 'string' && model.length > 0);
}

function isRecords(value: unknown, models: number): value is PackedRecord[] {
  return Array.isArray(value) && value.every((record) => isPacked(record, models));
}

export function toCachedFile(value: unknown): CachedFile | null {
  if (!isObject(value) || typeof value.sig !== 'string' || !isSource(value.source)) return null;
  const { models, records } = value;
  if (!isModels(models) || !isRecords(records, models.length)) return null;
  return { sig: value.sig, source: value.source, models, records };
}

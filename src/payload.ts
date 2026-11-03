import {
  INGEST_LIMITS,
  UsageRecordSchema,
  type AgentSource,
  type IngestBatch,
  type SyncCursor,
  type UsageRecord,
} from '@tokenaires/contracts';
import { CLI_VERSION, CURSOR_OVERLAP_MS, UPLOAD_BATCH_SIZE } from '@/config';

export const UPLOAD_FIELDS = [
  'source',
  'recordId',
  'model',
  'occurredAt',
  'inputTokens',
  'outputTokens',
  'cacheReadTokens',
  'cacheWriteTokens',
  'reasoningTokens',
] as const satisfies readonly (keyof UsageRecord)[];

export function toUploadRecord(record: UsageRecord): UsageRecord {
  return {
    source: record.source,
    recordId: record.recordId,
    model: record.model,
    occurredAt: record.occurredAt,
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    cacheReadTokens: record.cacheReadTokens,
    cacheWriteTokens: record.cacheWriteTokens,
    reasoningTokens: record.reasoningTokens,
  };
}

export function cursorStarts(cursors: readonly SyncCursor[]): Map<AgentSource, number> {
  const starts = new Map<AgentSource, number>();
  for (const cursor of cursors) {
    if (cursor.lastOccurredAt === null) continue;
    starts.set(cursor.source, new Date(cursor.lastOccurredAt).getTime() - CURSOR_OVERLAP_MS);
  }
  return starts;
}

export function selectForUpload(records: readonly UsageRecord[], cursors: readonly SyncCursor[]): UsageRecord[] {
  const starts = cursorStarts(cursors);
  return records.filter((record) => {
    const start = starts.get(record.source);
    return start === undefined || new Date(record.occurredAt).getTime() >= start;
  });
}

export interface PreparedRecords {
  valid: UsageRecord[];
  invalid: number;
}

export function prepareRecords(records: readonly UsageRecord[]): PreparedRecords {
  const valid: UsageRecord[] = [];
  let invalid = 0;
  for (const record of records) {
    const upload = toUploadRecord(record);
    if (UsageRecordSchema.safeParse(upload).success) valid.push(upload);
    else invalid += 1;
  }
  return { valid, invalid };
}

export function batchBodies(records: readonly UsageRecord[]): string[] {
  const size = Math.min(UPLOAD_BATCH_SIZE, INGEST_LIMITS.maxRecordsPerBatch);
  const bodies: string[] = [];
  for (let start = 0; start < records.length; start += size) {
    const batch: IngestBatch = {
      cliVersion: CLI_VERSION,
      records: records.slice(start, start + size).map(toUploadRecord),
    };
    bodies.push(JSON.stringify(batch));
  }
  return bodies;
}

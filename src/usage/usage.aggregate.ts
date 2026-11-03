import { UsageRecord } from '@tokenaires/contracts';
import { DailyUsageRow, UsageRecordRow } from '../database/schema';
import { totalTokensOf } from './usage.rules';

export function toRow(
  record: UsageRecord,
  userId: string,
  deviceId: string,
): UsageRecordRow {
  const occurredAt = new Date(record.occurredAt);
  return {
    source: record.source,
    recordId: record.recordId,
    userId,
    deviceId,
    model: record.model,
    occurredAt,
    day: occurredAt.toISOString().slice(0, 10),
    inputTokens: record.inputTokens,
    outputTokens: record.outputTokens,
    cacheReadTokens: record.cacheReadTokens,
    cacheWriteTokens: record.cacheWriteTokens,
    reasoningTokens: record.reasoningTokens,
    totalTokens: totalTokensOf(record),
  };
}

export function rollupDaily(rows: UsageRecordRow[]): DailyUsageRow[] {
  const buckets = new Map<string, DailyUsageRow>();
  for (const row of rows) {
    const key = `${row.day}|${row.source}|${row.model}`;
    const bucket = buckets.get(key) ?? {
      userId: row.userId,
      day: row.day,
      source: row.source,
      model: row.model,
      records: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
    };
    bucket.records = (bucket.records ?? 0) + 1;
    bucket.inputTokens = (bucket.inputTokens ?? 0) + (row.inputTokens ?? 0);
    bucket.outputTokens = (bucket.outputTokens ?? 0) + (row.outputTokens ?? 0);
    bucket.cacheReadTokens =
      (bucket.cacheReadTokens ?? 0) + (row.cacheReadTokens ?? 0);
    bucket.cacheWriteTokens =
      (bucket.cacheWriteTokens ?? 0) + (row.cacheWriteTokens ?? 0);
    bucket.reasoningTokens =
      (bucket.reasoningTokens ?? 0) + (row.reasoningTokens ?? 0);
    bucket.totalTokens = (bucket.totalTokens ?? 0) + (row.totalTokens ?? 0);
    buckets.set(key, bucket);
  }
  return [...buckets.values()];
}

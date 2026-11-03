import type { UsageRecord } from '@tokenaires/contracts';
import { recordTotal } from '@/summary';

export function hasTokens(record: UsageRecord): boolean {
  return recordTotal(record) > 0;
}

export function keepLargest(into: Map<string, UsageRecord>, record: UsageRecord): void {
  const existing = into.get(record.recordId);
  if (!existing || record.outputTokens > existing.outputTokens) {
    into.set(record.recordId, record);
    return;
  }
  if (record.outputTokens === existing.outputTokens && record.occurredAt < existing.occurredAt) into.set(record.recordId, record);
}

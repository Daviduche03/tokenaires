import { describe, expect, it } from 'vitest';
import type { UsageRecord } from '@tokenaires/contracts';
import { batchBodies, prepareRecords, selectForUpload } from '@/payload';

function record(index: number, occurredAt: string, source: UsageRecord['source'] = 'codex'): UsageRecord {
  return {
    source,
    recordId: `session-0000:${index}`,
    model: 'gpt-test',
    occurredAt,
    inputTokens: 10,
    outputTokens: 5,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
  };
}

describe('upload selection and batching', () => {
  it('keeps records from 48 hours before the cursor onward, and everything when the cursor is null', () => {
    const records = [
      record(1, '2026-10-01T00:00:00.000Z'),
      record(2, '2026-10-08T00:00:00.000Z'),
      record(3, '2026-10-09T12:00:00.000Z'),
      record(4, '2026-09-01T00:00:00.000Z', 'claude-code'),
    ];
    const selected = selectForUpload(records, [
      { source: 'codex', lastOccurredAt: '2026-10-10T00:00:00.000Z' },
      { source: 'claude-code', lastOccurredAt: null },
    ]);
    expect(selected.map((item) => item.recordId)).toEqual(['session-0000:2', 'session-0000:3', 'session-0000:4']);
  });

  it('drops records the contract would reject before sending', () => {
    const tooBig = { ...record(1, '2026-10-01T00:00:00.000Z'), inputTokens: 6_000_000 };
    const shortId = { ...record(2, '2026-10-01T00:00:00.000Z'), recordId: 'x' };
    const result = prepareRecords([tooBig, shortId, record(3, '2026-10-01T00:00:00.000Z')]);
    expect(result.invalid).toBe(2);
    expect(result.valid).toHaveLength(1);
  });

  it('splits uploads into batches of 1000', () => {
    const records = Array.from({ length: 2500 }, (_, index) => record(index, '2026-10-01T00:00:00.000Z'));
    const sizes = batchBodies(records).map((body) => (JSON.parse(body) as { records: unknown[] }).records.length);
    expect(sizes).toEqual([1000, 1000, 500]);
  });
});

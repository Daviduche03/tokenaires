import { UsageRecord } from '@tokenaires/contracts';
import { evaluateRecord, totalTokensOf } from './usage.rules';

const now = Date.parse('2026-11-03T12:00:00Z');

const base: UsageRecord = {
  source: 'claude-code',
  recordId: 'msg_011CggL7rskVGoeCVHL8FEK2:req_011CggL7r4PBNcJWqtQWZmPJ',
  model: 'claude-opus-5-5',
  occurredAt: '2026-11-03T11:00:00Z',
  inputTokens: 2,
  outputTokens: 453,
  cacheReadTokens: 27_873,
  cacheWriteTokens: 41_916,
  reasoningTokens: 87,
};

describe('evaluateRecord', () => {
  it('accepts a real looking Claude record', () => {
    expect(evaluateRecord(base, now)).toBeNull();
  });

  it('accepts a Codex record keyed by session and ordinal', () => {
    const codex: UsageRecord = {
      ...base,
      source: 'codex',
      recordId: '01a183fb-b19e-7281-b173-b202b6051a51:18',
      model: 'gpt-6.1-sol',
    };
    expect(evaluateRecord(codex, now)).toBeNull();
  });

  it.each([
    [{ recordId: 'msg_short' }, 'invalid_record_id'],
    [{ source: 'codex' as const }, 'invalid_record_id'],
    [{ occurredAt: '2026-11-04T12:00:00Z' }, 'future_timestamp'],
    [{ occurredAt: '2024-12-01T00:00:00Z' }, 'before_source_launch'],
    [
      { model: 'claude-opus-4-5-20251101', occurredAt: '2025-06-01T00:00:00Z' },
      'before_model_release',
    ],
    [
      { inputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 },
      'implausible_ratio',
    ],
    [{ reasoningTokens: 900 }, 'implausible_ratio'],
    [{ outputTokens: 400_000, reasoningTokens: 0 }, 'implausible_ratio'],
    [{ cacheReadTokens: 4_500_000 }, 'implausible_ratio'],
  ])('rejects %p as %s', (patch, reason) => {
    expect(evaluateRecord({ ...base, ...patch }, now)).toBe(reason);
  });

  it('counts reasoning inside output, not twice', () => {
    expect(totalTokensOf(base)).toBe(2 + 453 + 27_873 + 41_916);
  });
});

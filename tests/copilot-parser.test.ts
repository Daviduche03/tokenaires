import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copilotRecord, copilotTime } from '@/parsers/copilot';
import { RECORD_ID_PATTERN } from '@/parsers/json';
import { copilotSource } from '@/sources/copilot';
import { COPILOT_SECRET, SESSION_A, SESSION_B, createCopilotDb } from './fixtures/copilot';
import { makeTempDir, removeDir } from './helpers/temp';

const expectedId = (sessionId: string, id: number, createdAt: string): string =>
  `copilot:${createHash('sha256').update(`${sessionId}|${id}|${createdAt}`).digest('hex').slice(0, 32)}`;

describe('Copilot CLI parser', () => {
  let root = '';
  let dbPath = '';
  beforeEach(async () => {
    root = await makeTempDir('copilot');
    dbPath = join(root, '.copilot', 'session-store.db');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('subtracts cache from the cache inclusive input and keeps one record per request', async () => {
    await createCopilotDb(dbPath, [
      { sessionId: SESSION_A, createdAt: '2026-10-06T09:00:00.000Z', input: 12_000, output: 400, cacheRead: 9_000, cacheWrite: 1_000, reasoning: 150 },
      { sessionId: SESSION_A, createdAt: '2026-10-06T09:01:00.000Z', input: 5_000, output: 900, initiator: 'compaction' },
      { sessionId: SESSION_A, createdAt: '2026-10-06T09:02:00.000Z', input: 100, output: 10, cacheRead: 200, reasoning: 80 },
    ]);
    const records = (await copilotSource.parse(dbPath)) ?? [];
    expect(records).toEqual([
      {
        source: 'copilot-cli',
        recordId: expectedId(SESSION_A, 1, '2026-10-06T09:00:00.000Z'),
        model: 'claude-test-sonnet',
        occurredAt: '2026-10-06T09:00:00.000Z',
        inputTokens: 2_000,
        outputTokens: 400,
        cacheReadTokens: 9_000,
        cacheWriteTokens: 1_000,
        reasoningTokens: 150,
      },
      {
        source: 'copilot-cli',
        recordId: expectedId(SESSION_A, 2, '2026-10-06T09:01:00.000Z'),
        model: 'claude-test-sonnet',
        occurredAt: '2026-10-06T09:01:00.000Z',
        inputTokens: 5_000,
        outputTokens: 900,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
      },
      {
        source: 'copilot-cli',
        recordId: expectedId(SESSION_A, 3, '2026-10-06T09:02:00.000Z'),
        model: 'claude-test-sonnet',
        occurredAt: '2026-10-06T09:02:00.000Z',
        inputTokens: 0,
        outputTokens: 10,
        cacheReadTokens: 200,
        cacheWriteTokens: 0,
        reasoningTokens: 10,
      },
    ]);
    for (const record of records) expect(record.recordId).toMatch(RECORD_ID_PATTERN);
  });

  it('keeps hashed ids stable across reads and distinct when a reset store reuses row ids', async () => {
    const row = { createdAt: '2026-10-06T09:00:00.000Z', input: 10, output: 5 };
    await createCopilotDb(dbPath, [{ sessionId: SESSION_A, ...row }]);
    const first = (await copilotSource.parse(dbPath)) ?? [];
    const again = (await copilotSource.parse(dbPath)) ?? [];
    const resetPath = join(root, 'reset', 'session-store.db');
    await createCopilotDb(resetPath, [{ sessionId: SESSION_B, ...row }]);
    const reset = (await copilotSource.parse(resetPath)) ?? [];
    expect(first.map((record) => record.recordId)).toEqual(again.map((record) => record.recordId));
    expect(first[0]?.recordId).toBe(expectedId(SESSION_A, 1, row.createdAt));
    expect(reset[0]?.recordId).toBe(expectedId(SESSION_B, 1, row.createdAt));
    expect(reset[0]?.recordId).not.toBe(first[0]?.recordId);
    const later = copilotRecord({ id: 1, session_id: SESSION_A, model: 'm-test', created_at: '2026-10-07T09:00:00.000Z', input_tokens: 10, output_tokens: 5 });
    expect(later?.recordId).not.toBe(first[0]?.recordId);
  });

  it('skips rows without tokens, a model or a time', async () => {
    await createCopilotDb(dbPath, [
      { sessionId: SESSION_A, createdAt: '2026-10-06T09:00:00.000Z', input: 0, output: 0 },
      { sessionId: SESSION_A, createdAt: '2026-10-06T09:01:00.000Z', input: 50, output: 5, model: '' },
      { sessionId: SESSION_A, createdAt: null, input: 50, output: 5 },
      { sessionId: SESSION_A, createdAt: 'not a time', input: 50, output: 5 },
      { sessionId: SESSION_A, createdAt: '2026-10-06T09:04:00.000Z', input: 50, output: 5 },
    ]);
    const records = (await copilotSource.parse(dbPath)) ?? [];
    expect(records.map((record) => record.occurredAt)).toEqual(['2026-10-06T09:04:00.000Z']);
  });

  it('reads epoch and zoneless timestamps as UTC', async () => {
    await createCopilotDb(dbPath, [
      { sessionId: SESSION_A, createdAt: 1_790_000_000, input: 1, output: 1 },
      { sessionId: SESSION_A, createdAt: 1_790_000_000_000, input: 1, output: 1 },
      { sessionId: SESSION_A, createdAt: '2026-08-07 17:56:38', input: 1, output: 1 },
    ]);
    const records = (await copilotSource.parse(dbPath)) ?? [];
    expect(records.map((record) => record.occurredAt)).toEqual([new Date(1_790_000_000_000).toISOString(), new Date(1_790_000_000_000).toISOString(), '2026-08-07T17:56:38.000Z']);
    expect(copilotTime(1_790_000_000)).toBe(new Date(1_790_000_000_000).toISOString());
    expect(copilotTime('2026-08-07T17:56:38+02:00')).toBe('2026-08-07T15:56:38.000Z');
  });

  it('returns no records when the usage table is missing and null when the store is absent', async () => {
    await createCopilotDb(dbPath, [{ sessionId: SESSION_A, createdAt: '2026-10-06T09:00:00.000Z', input: 10, output: 5 }], { table: false });
    expect(await copilotSource.parse(dbPath)).toEqual([]);
    expect(await copilotSource.parse(join(root, 'missing', 'session-store.db'))).toBeNull();
  });

  it('reads stores that predate output_tokens without letting reasoning exceed output', async () => {
    await createCopilotDb(dbPath, [{ sessionId: SESSION_A, createdAt: '2026-10-06T09:00:00.000Z', input: 300, output: 0, cacheRead: 100, reasoning: 40 }], { outputColumn: false });
    expect(await copilotSource.parse(dbPath)).toEqual([expect.objectContaining({ inputTokens: 200, outputTokens: 0, cacheReadTokens: 100, reasoningTokens: 0 })]);
  });

  it('never copies prompt, path or session text into records', async () => {
    await createCopilotDb(dbPath, [{ sessionId: SESSION_A, createdAt: '2026-10-06T09:00:00.000Z', input: 10, output: 5 }]);
    const records = (await copilotSource.parse(dbPath)) ?? [];
    expect(records).toHaveLength(1);
    const serialized = JSON.stringify(records);
    expect(serialized).not.toContain(COPILOT_SECRET);
    expect(serialized).not.toContain(SESSION_A);
  });

  it('discovers the store under COPILOT_HOME or ~/.copilot', async () => {
    await createCopilotDb(dbPath, [{ sessionId: SESSION_A, createdAt: '2026-10-06T09:00:00.000Z', input: 10, output: 5 }]);
    const custom = join(root, 'custom-copilot');
    await createCopilotDb(join(custom, 'session-store.db'), [{ sessionId: SESSION_B, createdAt: '2026-10-06T09:00:00.000Z', input: 10, output: 5 }]);
    expect(await copilotSource.discover({ env: {}, home: root, platform: 'darwin' })).toEqual([dbPath]);
    expect(await copilotSource.discover({ env: { COPILOT_HOME: custom }, home: root, platform: 'darwin' })).toEqual([join(custom, 'session-store.db')]);
    expect(await copilotSource.discover({ env: { COPILOT_HOME: join(root, 'empty') }, home: root, platform: 'darwin' })).toEqual([]);
  });
});

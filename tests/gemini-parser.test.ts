import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { geminiRecord, parseGeminiFile } from '@/parsers/gemini';
import { scanLocal } from '@/scan';
import { GEMINI_CHILD_SESSION, GEMINI_MESSAGE, GEMINI_SECOND, GEMINI_SESSION, geminiChild, geminiLegacy, geminiMessage, geminiSession } from './fixtures/gemini';
import { makeTempDir, removeDir, writeLines } from './helpers/temp';

describe('Gemini CLI parser', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('gemini');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('keeps the last write of each message and maps Gemini usage fields', async () => {
    const path = join(root, 'session.jsonl');
    await writeLines(path, geminiSession);
    const records = (await parseGeminiFile(path)) ?? [];
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      source: 'gemini-cli',
      recordId: `${GEMINI_SESSION}:${GEMINI_MESSAGE}`,
      model: 'gemini-test-pro',
      occurredAt: '2026-10-05T08:01:00.000Z',
      inputTokens: 415,
      outputTokens: 150,
      cacheReadTokens: 600,
      cacheWriteTokens: 0,
      reasoningTokens: 30,
    });
    expect(records[1]).toMatchObject({ recordId: `${GEMINI_SESSION}:${GEMINI_SECOND}`, inputTokens: 57, outputTokens: 5 });
  });

  it('leaves tool prompt tokens out when the reported total already excludes them', () => {
    const message = geminiMessage(GEMINI_MESSAGE, { tokens: { input: 100, output: 10, cached: 0, thoughts: 0, tool: 40, total: 110 } });
    expect(geminiRecord(GEMINI_SESSION, message)).toMatchObject({ inputTokens: 100 });
  });

  it('rejects messages without a stable id, model or usage', () => {
    expect(geminiRecord(GEMINI_SESSION, geminiMessage('short', { tokens: { input: 1 } }))).toBeNull();
    expect(geminiRecord(GEMINI_SESSION, geminiMessage(GEMINI_MESSAGE, {}))).toBeNull();
    expect(geminiRecord(GEMINI_SESSION, geminiMessage(GEMINI_MESSAGE, { model: undefined, tokens: { input: 1 } }))).toBeNull();
  });

  it('reads legacy JSON sessions, subagent folders and dedupes a converted copy', async () => {
    const chats = join(root, '.gemini', 'tmp', 'project-hash', 'chats');
    await writeLines(join(chats, 'session-2026-10-05T08-00-0f1e2d3c.jsonl'), geminiSession);
    await writeFile(join(chats, 'session-2026-10-05T08-00-0f1e2d3c.json'), geminiLegacy);
    await writeLines(join(chats, GEMINI_SESSION, `${GEMINI_CHILD_SESSION}.jsonl`), geminiChild);
    await writeLines(join(root, '.gemini', 'tmp', 'project-hash', 'logs.jsonl'), geminiSession);
    const result = await scanLocal({ env: {}, home: root, cachePath: null });
    const gemini = result.records.filter((record) => record.source === 'gemini-cli');
    expect(result.files['gemini-cli']).toBe(3);
    expect(gemini.map((record) => record.recordId).sort()).toEqual([
      `${GEMINI_CHILD_SESSION}:${GEMINI_MESSAGE}`,
      `${GEMINI_SESSION}:${GEMINI_SECOND}`,
      `${GEMINI_SESSION}:${GEMINI_MESSAGE}`,
    ].sort());
  });

  it('honors GEMINI_CLI_HOME', async () => {
    const other = join(root, 'other');
    await writeLines(join(other, '.gemini', 'tmp', 'p', 'chats', 'session-a.jsonl'), geminiSession);
    const result = await scanLocal({ env: { GEMINI_CLI_HOME: other }, home: root, cachePath: null });
    expect(result.files['gemini-cli']).toBe(1);
  });
});

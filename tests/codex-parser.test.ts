import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UsageRecord } from '@tokenaires/contracts';
import { parseCodexFile, sessionIdFromFileName } from '@/parsers/codex';
import { codexRoots } from '@/parsers/paths';
import { scanLocal } from '@/scan';
import {
  CODEX_CHILD_FILE,
  CODEX_CHILD_ID,
  CODEX_MAIN_FILE,
  CODEX_SESSION_ID,
  codexMainSession,
} from './fixtures/codex';
import { writeFixtureLogs } from './helpers/logs';
import { makeTempDir, removeDir, writeLines } from './helpers/temp';

describe('Codex parser', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('codex');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  async function parseMain(): Promise<UsageRecord[]> {
    const path = `${root}/${CODEX_MAIN_FILE}`;
    await writeLines(path, codexMainSession);
    const into = new Map<string, UsageRecord>();
    await parseCodexFile(path, into);
    return [...into.values()];
  }

  it('uses token_usage_record and drops the token_count that repeats it', async () => {
    const records = await parseMain();
    expect(records.map((record) => record.recordId)).toEqual([
      `${CODEX_SESSION_ID}:4`,
      `${CODEX_SESSION_ID}:8`,
      `${CODEX_SESSION_ID}:9`,
    ]);
    expect(records[0]).toEqual({
      source: 'codex',
      recordId: `${CODEX_SESSION_ID}:4`,
      model: 'gpt-test-1',
      occurredAt: '2026-10-01T10:01:00.000Z',
      inputTokens: 200,
      outputTokens: 100,
      cacheReadTokens: 800,
      cacheWriteTokens: 0,
      reasoningTokens: 40,
    });
  });

  it('falls back to token_count when no usage record covers the call', async () => {
    const records = await parseMain();
    expect(records[1]).toMatchObject({ model: 'gpt-test-2', inputTokens: 450, cacheReadTokens: 0, outputTokens: 50 });
    expect(records[2]).toMatchObject({ model: 'gpt-test-2', inputTokens: 250, outputTokens: 50 });
  });

  it('counts each call once across sessions, archived copies and forked children', async () => {
    const dirs = await writeFixtureLogs(root);
    const result = await scanLocal({ env: { CLAUDE_CONFIG_DIR: dirs.claudeConfig, CODEX_HOME: dirs.codexHome }, home: root });
    const codex = result.records.filter((record) => record.source === 'codex');
    expect(result.files.codex).toBe(3);
    expect(codex).toHaveLength(4);
    const child = codex.find((record) => record.recordId.startsWith(CODEX_CHILD_ID));
    expect(child).toMatchObject({ recordId: `${CODEX_CHILD_ID}:2`, model: 'gpt-test-child', inputTokens: 450 });
  });

  it('reads the session id from the file name, preferring the child id of a fork', () => {
    expect(sessionIdFromFileName(CODEX_MAIN_FILE)).toBe(CODEX_SESSION_ID);
    expect(sessionIdFromFileName(CODEX_CHILD_FILE)).toBe(CODEX_CHILD_ID);
    expect(sessionIdFromFileName('notes.jsonl')).toBeNull();
  });

  it('falls back to the session_meta id when the file name has none', async () => {
    const path = `${root}/custom.jsonl`;
    await writeLines(path, codexMainSession);
    const into = new Map<string, UsageRecord>();
    await parseCodexFile(path, into);
    expect([...into.keys()][0]).toBe(`${CODEX_SESSION_ID}:4`);
  });

  it('uses CODEX_HOME for sessions and archived sessions', () => {
    expect(codexRoots({ CODEX_HOME: '/x' }, '/home/me')).toEqual(['/x/sessions', '/x/archived_sessions']);
    expect(codexRoots({}, '/home/me')).toEqual(['/home/me/.codex/sessions', '/home/me/.codex/archived_sessions']);
  });
});

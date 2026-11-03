import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { zstdCompressSync } from 'node:zlib';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UsageRecord } from '@tokenaires/contracts';
import { createCodexState, parseCodexFile, sessionIdFromFileName } from '@/parsers/codex';
import { toCodexRecord } from '@/parsers/codex-usage';
import { codexRoots } from '@/parsers/paths';
import { scanLocal } from '@/scan';
import { codexSource, dropCompressedTwins } from '@/sources/codex';
import {
  CODEX_CHILD_FILE,
  CODEX_CHILD_ID,
  CODEX_FORK_FILE,
  CODEX_FORK_ID,
  CODEX_LEGACY_FILE,
  CODEX_LEGACY_ID,
  CODEX_MAIN_FILE,
  CODEX_SESSION_ID,
  CODEX_SPAWN_FILE,
  CODEX_SPAWN_ID,
  codexMainSession,
  usage,
} from './fixtures/codex';
import { codexForkSession, codexLegacySession, codexSpawnSession } from './fixtures/codex-edge';
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

  async function parse(name: string, lines: readonly string[]): Promise<UsageRecord[]> {
    const path = join(root, name);
    await writeLines(path, lines);
    return (await parseCodexFile(path)) ?? [];
  }

  it('uses token_usage_record and ignores every token_count once records exist', async () => {
    const records = await parse(CODEX_MAIN_FILE, codexMainSession);
    expect(records.map((record) => record.recordId)).toEqual([
      `${CODEX_SESSION_ID}:4`,
      `${CODEX_SESSION_ID}:8`,
      `${CODEX_SESSION_ID}:11`,
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

  it('counts the compaction call and skips the context update written after it', async () => {
    const records = await parse(CODEX_MAIN_FILE, codexMainSession);
    expect(records[1]).toMatchObject({ model: 'gpt-test-2', inputTokens: 250, outputTokens: 50 });
    expect(records.some((record) => record.inputTokens === 600)).toBe(false);
  });

  it('counts legacy token_count calls, re-emissions once, and calls after a counter reset', async () => {
    const records = await parse(CODEX_LEGACY_FILE, codexLegacySession);
    expect(records.map((record) => record.recordId)).toEqual([
      `${CODEX_LEGACY_ID}:2`,
      `${CODEX_LEGACY_ID}:5`,
      `${CODEX_LEGACY_ID}:6`,
      `${CODEX_LEGACY_ID}:7`,
    ]);
    expect(records[0]).toMatchObject({ model: 'gpt-legacy', inputTokens: 1000, cacheReadTokens: 200, outputTokens: 300, reasoningTokens: 100 });
    expect(records[2]).toMatchObject({ inputTokens: 250, outputTokens: 50 });
    expect(records[3]).toMatchObject({ inputTokens: 400, outputTokens: 50 });
  });

  it('drops history a fork replays from its parent and keeps its own calls', async () => {
    const records = await parse(CODEX_FORK_FILE, codexForkSession);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ recordId: `${CODEX_FORK_ID}:6`, model: 'gpt-fork', inputTokens: 400, cacheReadTokens: 500 });
  });

  it('drops parent events a spawned agent copies with their original timestamps', async () => {
    const records = await parse(CODEX_SPAWN_FILE, codexSpawnSession);
    expect(records.map((record) => record.recordId)).toEqual([`${CODEX_SPAWN_ID}:3`]);
    expect(records[0]).toMatchObject({ model: 'gpt-spawn', inputTokens: 300, outputTokens: 40 });
  });

  it('carves cache writes out of uncached input instead of adding them', () => {
    const state = createCodexState(CODEX_MAIN_FILE);
    const record = toCodexRecord(state, usage({ input: 1000, cached: 600, output: 20, reasoning: 0, cacheWrite: 150 }), '2026-10-01T10:00:00Z', 3);
    expect(record).toMatchObject({ inputTokens: 250, cacheReadTokens: 600, cacheWriteTokens: 150, outputTokens: 20 });
  });

  it('reads zstd compressed rollouts and skips a compressed twin of a plain file', async () => {
    const dir = join(root, 'home', 'sessions', '2026', '09', '01');
    await writeLines(join(dir, CODEX_LEGACY_FILE), codexLegacySession);
    const packed = zstdCompressSync(Buffer.from(`${codexLegacySession.join('\n')}\n`));
    await writeFile(join(dir, `${CODEX_LEGACY_FILE}.zst`), packed);
    await writeFile(join(root, 'home', 'archived.jsonl.zst'), packed);
    const zstOnly = (await parseCodexFile(join(root, 'home', 'archived.jsonl.zst'))) ?? [];
    expect(zstOnly.map((record) => record.recordId)).toEqual((await parse(CODEX_LEGACY_FILE, codexLegacySession)).map((record) => record.recordId));
    const files = await codexSource.discover({ env: { CODEX_HOME: join(root, 'home') }, home: root, platform: 'linux' });
    expect(files).toEqual([join(dir, CODEX_LEGACY_FILE)]);
    expect(dropCompressedTwins(['/a/x.jsonl', '/a/x.jsonl.zst', '/b/y.jsonl.zst'])).toEqual(['/a/x.jsonl', '/b/y.jsonl.zst']);
  });

  it('counts each call once across sessions, archived copies and forked children', async () => {
    const dirs = await writeFixtureLogs(root);
    const result = await scanLocal({ env: { CLAUDE_CONFIG_DIR: dirs.claudeConfig, CODEX_HOME: dirs.codexHome }, home: root, cachePath: null });
    const codex = result.records.filter((record) => record.source === 'codex');
    expect(result.files.codex).toBe(3);
    expect(codex).toHaveLength(4);
    const child = codex.find((record) => record.recordId.startsWith(CODEX_CHILD_ID));
    expect(child).toMatchObject({ recordId: `${CODEX_CHILD_ID}:2`, model: 'gpt-test-child', inputTokens: 450 });
  });

  it('reads the session id from the file name, preferring the child id of a fork', () => {
    expect(sessionIdFromFileName(CODEX_MAIN_FILE)).toBe(CODEX_SESSION_ID);
    expect(sessionIdFromFileName(CODEX_CHILD_FILE)).toBe(CODEX_CHILD_ID);
    expect(sessionIdFromFileName(`${CODEX_MAIN_FILE}.zst`)).toBe(CODEX_SESSION_ID);
    expect(sessionIdFromFileName('notes.jsonl')).toBeNull();
  });

  it('falls back to the session_meta id when the file name has none', async () => {
    const records = await parse('custom.jsonl', codexMainSession);
    expect(records[0]?.recordId).toBe(`${CODEX_SESSION_ID}:4`);
  });

  it('uses CODEX_HOME for sessions and archived sessions', () => {
    expect(codexRoots({ CODEX_HOME: '/x' }, '/home/me')).toEqual(['/x/sessions', '/x/archived_sessions']);
    expect(codexRoots({ CODEX_HOME: '~/alt' }, '/home/me')).toEqual(['/home/me/alt/sessions', '/home/me/alt/archived_sessions']);
    expect(codexRoots({}, '/home/me')).toEqual(['/home/me/.codex/sessions', '/home/me/.codex/archived_sessions']);
  });
});

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { kimiWireOwner, parseKimiWire } from '@/parsers/kimi';
import { scanLocal } from '@/scan';
import { KIMI_FORK, KIMI_MODEL, KIMI_SECRET, KIMI_SESSION, kimiFork, kimiMain, kimiSubagent } from './fixtures/kimi';
import { makeTempDir, removeDir, writeLines } from './helpers/temp';

const wirePath = (root: string, session: string, agent: string): string =>
  join(root, '.kimi-code', 'sessions', 'wd_project_9fa75dc25a95', session, 'agents', agent, 'wire.jsonl');

describe('Kimi Code parser', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('kimi');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('maps usage.record lines to exact token counts', async () => {
    const path = wirePath(root, KIMI_SESSION, 'main');
    await writeLines(path, kimiMain);
    const records = (await parseKimiWire(path)) ?? [];
    expect(records).toHaveLength(2);
    expect(records[0]).toEqual({
      source: 'kimi-code',
      recordId: `${KIMI_SESSION}:main:4`,
      model: 'kimi-for-coding',
      occurredAt: new Date(1793306725000).toISOString(),
      inputTokens: 1200,
      outputTokens: 340,
      cacheReadTokens: 8000,
      cacheWriteTokens: 0,
      reasoningTokens: 90,
    });
    expect(records[1]).toMatchObject({ recordId: `${KIMI_SESSION}:main:6`, inputTokens: 40, cacheReadTokens: 9100, cacheWriteTokens: 300 });
  });

  it('skips usage copied into a fork and keeps what came after the fork', async () => {
    const path = wirePath(root, KIMI_FORK, 'main');
    await writeLines(path, kimiFork);
    const records = (await parseKimiWire(path)) ?? [];
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ recordId: `${KIMI_FORK}:main:${kimiFork.length}`, inputTokens: 70, outputTokens: 20 });
  });

  it('falls back to the usage alias when no request names the model', async () => {
    const path = wirePath(root, KIMI_SESSION, 'agent-7f3a2c91');
    await writeLines(path, kimiSubagent);
    expect(((await parseKimiWire(path)) ?? [])[0]).toMatchObject({ model: KIMI_MODEL, inputTokens: 300 });
  });

  it('ignores wire files outside an agents folder', async () => {
    expect(kimiWireOwner(join(root, 'sessions', 'wire.jsonl'))).toBeNull();
    const path = join(root, 'loose', 'wire.jsonl');
    await writeLines(path, kimiMain);
    expect(await parseKimiWire(path)).toEqual([]);
  });

  it('scans main agents, subagents and forks once each under KIMI_CODE_HOME', async () => {
    const home = join(root, 'custom-kimi');
    const at = (session: string, agent: string): string => join(home, 'sessions', 'wd_project_9fa75dc25a95', session, 'agents', agent, 'wire.jsonl');
    await writeLines(at(KIMI_SESSION, 'main'), kimiMain);
    await writeLines(at(KIMI_SESSION, 'agent-7f3a2c91'), kimiSubagent);
    await writeLines(at(KIMI_FORK, 'main'), kimiFork);
    const summary = await scanLocal({ env: { KIMI_CODE_HOME: home }, home: join(root, 'empty-home'), platform: 'darwin', cachePath: null });
    const kimi = summary.records.filter((record) => record.source === 'kimi-code');
    expect(kimi.map((record) => record.recordId).sort()).toEqual(
      [`${KIMI_FORK}:main:${kimiFork.length}`, `${KIMI_SESSION}:agent-7f3a2c91:2`, `${KIMI_SESSION}:main:4`, `${KIMI_SESSION}:main:6`].sort(),
    );
    expect(summary.files['kimi-code']).toBe(3);
    expect(JSON.stringify(kimi)).not.toContain(KIMI_SECRET);
    expect(await readFile(at(KIMI_SESSION, 'main'), 'utf8')).toContain(KIMI_SECRET);
  });
});

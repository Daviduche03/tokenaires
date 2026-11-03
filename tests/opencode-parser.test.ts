import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UsageRecord } from '@tokenaires/contracts';
import { openCodeDataDir } from '@/parsers/paths';
import { scanLocal } from '@/scan';
import { legacyAssistant, legacyUser, tokens, v2Assistant } from './fixtures/opencode';
import { createOpenCodeDb } from './helpers/opencode-db';
import { makeTempDir, removeDir } from './helpers/temp';

const T = 1_790_000_000_000;

describe('OpenCode parser', () => {
  let root = '';
  let dataDir = '';
  beforeEach(async () => {
    root = await makeTempDir('opencode');
    dataDir = join(root, '.local', 'share', 'opencode');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  async function scanRecords(env: NodeJS.ProcessEnv = {}): Promise<Map<string, UsageRecord>> {
    const result = await scanLocal({ env, home: root, cachePath: null });
    return new Map(result.records.filter((record) => record.source === 'opencode').map((record) => [record.recordId, record]));
  }

  it('reads assistant and compaction messages from both database generations once each', async () => {
    await createOpenCodeDb(
      join(dataDir, 'opencode.db'),
      [
        { id: 'msg_user000000000001', created: T, data: legacyUser },
        { id: 'msg_newschema0000001', created: T + 1, data: legacyAssistant('msg_newschema0000001', T + 1, tokens(100, 50, 20, 1000, 10, 1180)) },
        { id: 'msg_midschema0000002', created: T + 2, data: legacyAssistant('msg_midschema0000002', T + 2, tokens(100, 50, 20, 1000, 10, 1160)) },
        { id: 'msg_oldschema0000003', created: T + 3, data: legacyAssistant('msg_oldschema0000003', T + 3, tokens(100, 50, 70, 0, 0)) },
        { id: 'msg_failedcall000004', created: T + 4, data: legacyAssistant('msg_failedcall000004', T + 4, tokens(0, 0, 0, 0, 0)) },
      ],
      [
        { id: 'msg_newschema0000001', type: 'assistant', created: T + 1, data: v2Assistant(T + 1, tokens(100, 50, 20, 1000, 10)) },
        { id: 'msg_v2assistant00005', type: 'assistant', created: T + 5, data: v2Assistant(T + 5, tokens(300, 40, 25, 2000, 0)) },
        { id: 'msg_v2compaction0006', type: 'compaction', created: T + 6, data: v2Assistant(T + 6, tokens(5000, 400, 0, 0, 0)) },
        { id: 'msg_v2user0000000007', type: 'user', created: T + 7, data: { text: 'hello' } },
      ],
    );
    const records = await scanRecords();
    expect([...records.keys()].sort()).toEqual([
      'msg_midschema0000002',
      'msg_newschema0000001',
      'msg_oldschema0000003',
      'msg_v2assistant00005',
      'msg_v2compaction0006',
    ]);
    expect(records.get('msg_newschema0000001')).toEqual({
      source: 'opencode',
      recordId: 'msg_newschema0000001',
      model: 'claude-test-sonnet',
      occurredAt: new Date(T + 1).toISOString(),
      inputTokens: 100,
      outputTokens: 70,
      cacheReadTokens: 1000,
      cacheWriteTokens: 10,
      reasoningTokens: 20,
    });
    expect(records.get('msg_midschema0000002')).toMatchObject({ outputTokens: 50, reasoningTokens: 20 });
    expect(records.get('msg_oldschema0000003')).toMatchObject({ outputTokens: 50, reasoningTokens: 50 });
    expect(records.get('msg_v2assistant00005')).toMatchObject({ model: 'gpt-test-codex', outputTokens: 65, reasoningTokens: 25, cacheReadTokens: 2000 });
  });

  it('reads the file based message store and dedupes it against the database', async () => {
    await createOpenCodeDb(join(dataDir, 'opencode.db'), [
      { id: 'msg_newschema0000001', created: T + 1, data: legacyAssistant('msg_newschema0000001', T + 1, tokens(100, 50, 20, 1000, 10, 1180)) },
    ]);
    const messages = join(dataDir, 'storage', 'message', 'ses_secretsession01');
    await mkdir(messages, { recursive: true });
    await writeFile(join(messages, 'msg_newschema0000001.json'), JSON.stringify(legacyAssistant('msg_newschema0000001', T + 1, tokens(100, 50, 20, 1000, 10, 1180))));
    await writeFile(join(messages, 'msg_filestore0000009.json'), JSON.stringify(legacyAssistant('msg_filestore0000009', T + 9, tokens(7, 3, 0, 0, 0))));
    await writeFile(join(messages, 'msg_user000000000001.json'), JSON.stringify(legacyUser));
    const records = await scanRecords();
    expect([...records.keys()].sort()).toEqual(['msg_filestore0000009', 'msg_newschema0000001']);
  });

  it('resolves the data folder from OPENCODE_DATA_DIR, then XDG_DATA_HOME', async () => {
    expect(openCodeDataDir({ OPENCODE_DATA_DIR: '/data/oc' }, '/home/me')).toBe('/data/oc');
    expect(openCodeDataDir({ XDG_DATA_HOME: '/xdg' }, '/home/me')).toBe('/xdg/opencode');
    expect(openCodeDataDir({}, '/home/me')).toBe('/home/me/.local/share/opencode');
    const custom = join(root, 'fork-data');
    await createOpenCodeDb(join(custom, 'fork.db'), [
      { id: 'msg_forkprefix000001', created: T, data: legacyAssistant('msg_forkprefix000001', T, tokens(1, 1, 0, 0, 0)) },
    ]);
    expect([...(await scanRecords({ OPENCODE_DATA_DIR: custom, OPENCODE_DB_PREFIX: 'fork' })).keys()]).toEqual(['msg_forkprefix000001']);
  });
});

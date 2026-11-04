import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UsageRecord } from '@tokenaires/contracts';
import { scanLocal } from '@/scan';
import { OPENCODE_SECRET, legacyAssistant, legacyUser, tokens } from './fixtures/opencode';
import { createOpenCodeDb } from './helpers/opencode-db';
import { makeTempDir, removeDir } from './helpers/temp';

const T = 1_793_000_000_000;

const migrated = {
  ...legacyAssistant('msg_migrated00000001', T, tokens(0, 0, 0, 0, 0), 'legacy'),
  providerID: 'legacy',
};

describe('Kilo Code database', () => {
  let root = '';
  let dataDir = '';
  beforeEach(async () => {
    root = await makeTempDir('kilo');
    dataDir = join(root, '.local', 'share', 'kilo');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  async function kiloRecords(env: NodeJS.ProcessEnv = {}): Promise<UsageRecord[]> {
    const result = await scanLocal({ env, home: root, cachePath: null });
    return result.records.filter((record) => record.source === 'kilo-code');
  }

  it('reads kilo.db and channel databases as Kilo Code, skipping zero-token migrated rows', async () => {
    await createOpenCodeDb(join(dataDir, 'kilo.db'), [
      { id: 'msg_user000000000001', created: T, data: legacyUser },
      { id: 'msg_kiloassistant001', created: T + 1, data: legacyAssistant('msg_kiloassistant001', T + 1, tokens(1200, 300, 40, 75, 25), 'minimax/m2.5') },
      { id: 'msg_migrated00000001', created: T + 2, data: migrated },
    ]);
    await createOpenCodeDb(join(dataDir, 'kilo-beta.db'), [
      { id: 'msg_kilobeta00000002', created: T + 3, data: legacyAssistant('msg_kilobeta00000002', T + 3, tokens(50, 10, 0, 0, 0)) },
    ]);
    const records = await kiloRecords();
    expect(records.map((record) => record.recordId)).toEqual(['msg_kiloassistant001', 'msg_kilobeta00000002']);
    expect(records[0]).toMatchObject({ source: 'kilo-code', model: 'minimax/m2.5', inputTokens: 1200, cacheReadTokens: 75, cacheWriteTokens: 25 });
    expect(JSON.stringify(records)).not.toContain(OPENCODE_SECRET);
  });

  it('follows XDG_DATA_HOME and a relative KILO_DB name', async () => {
    const xdg = join(root, 'xdg');
    await createOpenCodeDb(join(xdg, 'kilo', 'custom-store.sqlite'), [
      { id: 'msg_kilocustom000003', created: T + 4, data: legacyAssistant('msg_kilocustom000003', T + 4, tokens(80, 20, 0, 0, 0)) },
    ]);
    const records = await kiloRecords({ XDG_DATA_HOME: xdg, KILO_DB: 'custom-store.sqlite' });
    expect(records.map((record) => record.recordId)).toEqual(['msg_kilocustom000003']);
  });
});

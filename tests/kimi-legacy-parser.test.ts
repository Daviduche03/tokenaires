import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { kimiConfigModel, parseKimiLegacyWire, resetKimiModelCache } from '@/parsers/kimi-legacy';
import { scanLocal } from '@/scan';
import { KIMI_SECRET } from './fixtures/kimi';
import { makeTempDir, removeDir, writeLines } from './helpers/temp';

const status = (timestamp: number, messageId: string | null, usage: Record<string, number> | null): string =>
  JSON.stringify({
    timestamp,
    message: { type: 'StatusUpdate', payload: { context_usage: 0.2, token_usage: usage, message_id: messageId, plan_mode: false } },
  });

const CONFIG = `default_model = "kimi-for-coding"

[models."kimi-for-coding"]
provider = "kimi"
model = "kimi-k2-turbo-preview"
max_context_size = 262144

[providers.kimi]
type = "kimi"
`;

const mainWire = [
  JSON.stringify({ type: 'metadata', protocol_version: '1.3' }),
  JSON.stringify({ timestamp: 1790000000.1, message: { type: 'TurnBegin', payload: { user_input: KIMI_SECRET } } }),
  status(1790000001.5, 'chatcmpl-a1b2c3d4e5f6', { input_other: 900, output: 210, input_cache_read: 4096, input_cache_creation: 0 }),
  status(1790000002.5, 'chatcmpl-a1b2c3d4e5f6', { input_other: 900, output: 230, input_cache_read: 4096, input_cache_creation: 0 }),
  status(1790000003.5, null, { input_other: 10, output: 5 }),
  status(1790000004.5, 'chatcmpl-f6e5d4c3b2a1', null),
  JSON.stringify({ timestamp: 1790000005, message: { type: 'SubagentEvent', payload: { event: { type: 'StatusUpdate', payload: { token_usage: { input_other: 1, output: 1 }, message_id: 'chatcmpl-subagent0001' } } } } }),
];

const subagentWire = [status(1790000006, 'chatcmpl-subagent0001', { input_other: 120, output: 40, input_cache_read: 0, input_cache_creation: 0 })];

describe('legacy kimi-cli parser', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('kimi-legacy');
    resetKimiModelCache();
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('reads the configured model name behind the default alias', () => {
    expect(kimiConfigModel(CONFIG)).toBe('kimi-k2-turbo-preview');
    expect(kimiConfigModel('default_model = "plain"\n')).toBe('plain');
    expect(kimiConfigModel('[providers.kimi]\n')).toBeNull();
  });

  it('keeps the last update per provider message id and skips wrapped subagent copies', async () => {
    const share = join(root, '.kimi');
    await writeFile(join(await makeShare(share), 'config.toml'), CONFIG);
    const path = join(share, 'sessions', 'a3f1c2', '6b1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f', 'wire.jsonl');
    await writeLines(path, mainWire);
    const records = (await parseKimiLegacyWire(path)) ?? [];
    expect(records).toEqual([
      {
        source: 'kimi-code',
        recordId: 'chatcmpl-a1b2c3d4e5f6',
        model: 'kimi-k2-turbo-preview',
        occurredAt: new Date(1790000002500).toISOString(),
        inputTokens: 900,
        outputTokens: 230,
        cacheReadTokens: 4096,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
      },
    ]);
  });

  it('scans legacy sessions and subagents under KIMI_SHARE_DIR next to Kimi Code without config', async () => {
    const share = join(root, 'custom-share');
    const session = join(share, 'sessions', 'a3f1c2', '6b1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f');
    await writeLines(join(session, 'wire.jsonl'), mainWire);
    await writeLines(join(session, 'subagents', 'coder', 'wire.jsonl'), subagentWire);
    await writeLines(join(session, 'subagents', 'copy', 'wire.jsonl'), subagentWire);
    const summary = await scanLocal({ env: { KIMI_SHARE_DIR: share }, home: root, cachePath: null });
    const kimi = summary.records.filter((record) => record.source === 'kimi-code');
    expect(kimi.map((record) => [record.recordId, record.model, record.outputTokens])).toEqual([
      ['chatcmpl-a1b2c3d4e5f6', 'kimi-cli', 230],
      ['chatcmpl-subagent0001', 'kimi-cli', 40],
    ]);
    expect(summary.files['kimi-code']).toBe(3);
    expect(JSON.stringify(kimi)).not.toContain(KIMI_SECRET);
  });
});

async function makeShare(share: string): Promise<string> {
  await writeLines(join(share, 'sessions', '.keep'), []);
  return share;
}

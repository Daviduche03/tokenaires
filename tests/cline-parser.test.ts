import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { UsageRecordSchema, type UsageRecord } from '@tokenaires/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environmentModel, grossInputIncludesCache, sessionRecords, taskFileParser, taskUsageRecord } from '@/parsers/cline';
import { clineSource, kiloExtensionSource, rooSource } from '@/sources/cline';
import {
  CLINE_SECRET,
  CLINE_TASK,
  CLINE_TS,
  KILO_AFTER,
  KILO_BETWEEN,
  KILO_TASK,
  ROO_AFTER,
  ROO_BEFORE,
  ROO_TASK,
  SDK_FORK,
  SDK_SESSION,
  SDK_TS,
  apiHistory,
  apiRow,
  clineLegacyRows,
  clineTaskMetadata,
  kiloRows,
  rooRows,
  sdkFork,
  sdkManifest,
  sdkSession,
} from './fixtures/cline';
import { makeTempDir, removeDir } from './helpers/temp';

async function put(path: string, body: unknown): Promise<string> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, typeof body === 'string' ? body : JSON.stringify(body));
  return path;
}

const iso = (ts: number): string => new Date(ts).toISOString();
const parseCline = taskFileParser('cline');
const parseRoo = taskFileParser('roo-code');
const parseKilo = taskFileParser('kilo-code');

describe('Cline family parser', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('cline');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('maps legacy Cline task rows with separate cache buckets and per-row models', async () => {
    const dir = join(root, 'tasks', CLINE_TASK);
    await put(join(dir, 'task_metadata.json'), clineTaskMetadata);
    const records = (await parseCline(await put(join(dir, 'ui_messages.json'), clineLegacyRows()))) ?? [];
    expect(records).toEqual([
      {
        source: 'cline',
        recordId: `${CLINE_TASK}:${CLINE_TS}`,
        model: 'claude-sonnet-4-5',
        occurredAt: iso(CLINE_TS),
        inputTokens: 1200,
        outputTokens: 300,
        cacheReadTokens: 5000,
        cacheWriteTokens: 800,
        reasoningTokens: 0,
      },
      expect.objectContaining({ recordId: `${CLINE_TASK}:${CLINE_TS + 60_000}`, model: 'gpt-5', inputTokens: 40, outputTokens: 25, cacheReadTokens: 6000 }),
      expect.objectContaining({ recordId: `${CLINE_TASK}:${CLINE_TS + 200_000}`, model: 'gpt-5', inputTokens: 700, outputTokens: 90, cacheReadTokens: 100 }),
    ]);
  });

  it('subtracts Roo cache from tokensIn only when the row reports gross input', async () => {
    const dir = join(root, 'tasks', ROO_TASK);
    await put(join(dir, 'api_conversation_history.json'), apiHistory([
      { ts: ROO_BEFORE + 5, model: 'claude-sonnet-4-5' },
      { ts: ROO_AFTER + 5, model: 'gpt-5' },
    ]));
    const records = (await parseRoo(await put(join(dir, 'ui_messages.json'), rooRows()))) ?? [];
    expect(records.map((record) => [record.recordId, record.model, record.inputTokens, record.cacheReadTokens, record.cacheWriteTokens, record.outputTokens])).toEqual([
      [`${ROO_TASK}:${ROO_BEFORE}`, 'claude-sonnet-4-5', 300, 600, 100, 10],
      [`${ROO_TASK}:${ROO_BEFORE + 60_000}`, 'claude-sonnet-4-5', 300, 600, 100, 10],
      [`${ROO_TASK}:${ROO_AFTER}`, 'gpt-5', 300, 600, 100, 20],
      [`${ROO_TASK}:${ROO_AFTER + 60_000}`, 'gpt-5', 0, 700, 0, 5],
    ]);
    expect(records.every((record) => record.source === 'roo-code')).toBe(true);
  });

  it('uses the later Kilo cutoff and falls back to the source name as model', async () => {
    const path = await put(join(root, 'tasks', KILO_TASK, 'ui_messages.json'), kiloRows());
    const records = (await parseKilo(path)) ?? [];
    expect(records.map((record) => [record.source, record.model, record.inputTokens, record.cacheReadTokens])).toEqual([
      ['kilo-code', 'kilo-code', 300, 600],
      ['kilo-code', 'kilo-code', 300, 600],
    ]);
    expect(records.map((record) => record.occurredAt)).toEqual([iso(KILO_BETWEEN), iso(KILO_AFTER)]);
  });

  it('applies the cache convention by source, date and protocol', () => {
    expect(grossInputIncludesCache('cline', KILO_AFTER, 'openai')).toBe(false);
    expect(grossInputIncludesCache('roo-code', ROO_BEFORE, 'anthropic')).toBe(false);
    expect(grossInputIncludesCache('roo-code', ROO_BEFORE, 'bedrock/OpenAI')).toBe(true);
    expect(grossInputIncludesCache('roo-code', ROO_BEFORE, undefined)).toBe(false);
    expect(grossInputIncludesCache('roo-code', KILO_BETWEEN, 'anthropic')).toBe(true);
    expect(grossInputIncludesCache('kilo-code', KILO_BETWEEN, 'anthropic')).toBe(false);
    expect(grossInputIncludesCache('kilo-code', KILO_AFTER, 'anthropic')).toBe(true);
  });

  it('falls back to the source name when no model can be recovered', async () => {
    const rows = clineLegacyRows().map((row) => ({ ...row, modelInfo: undefined }));
    const records = (await parseCline(await put(join(root, 'tasks', CLINE_TASK, 'ui_messages.json'), rows))) ?? [];
    expect(records.map((record) => record.model)).toEqual(['cline', 'cline', 'cline']);
  });

  it('keeps one record per row when the entry is rewritten in place', async () => {
    const path = join(root, 'tasks', CLINE_TASK, 'ui_messages.json');
    await put(path, [apiRow(CLINE_TS, { tokensIn: 100, tokensOut: 5 })]);
    expect(((await parseCline(path)) ?? []).map((record) => record.outputTokens)).toEqual([5]);
    await put(path, [apiRow(CLINE_TS, { tokensIn: 100, tokensOut: 240, cacheReads: 900, cost: 0.02 })]);
    expect(((await parseCline(path)) ?? []).map((record) => [record.recordId, record.outputTokens])).toEqual([[`${CLINE_TASK}:${CLINE_TS}`, 240]]);
    await put(path, [apiRow(CLINE_TS, { tokensIn: 100, tokensOut: 5 }), apiRow(CLINE_TS, { tokensIn: 100, tokensOut: 240 })]);
    expect(((await parseCline(path)) ?? []).map((record) => record.outputTokens)).toEqual([240]);
  });

  it('rejects rows without a usable id, timestamp or plausible usage', () => {
    expect(taskUsageRecord('cline', 'short', apiRow(CLINE_TS, { tokensIn: 5, tokensOut: 5 }), 'm')).toBeNull();
    expect(taskUsageRecord('cline', CLINE_TASK, apiRow(CLINE_TS, { tokensIn: 0, tokensOut: 9 }), 'm')).toBeNull();
    expect(taskUsageRecord('cline', CLINE_TASK, { ...apiRow(CLINE_TS, { tokensIn: 5 }), ts: 'later' }, 'm')).toBeNull();
    expect(taskUsageRecord('cline', CLINE_TASK, { ...apiRow(CLINE_TS, { tokensIn: 5 }), text: '{broken' }, 'm')).toBeNull();
  });

  it('reads the model only from the current mode of environment details', () => {
    expect(environmentModel('<environment_details>\n# Current Mode\n<slug>code</slug>\n<model>gpt-5</model>\n</environment_details>')).toBe('gpt-5');
    expect(environmentModel('<task><model>evil</model></task>')).toBeNull();
    expect(environmentModel(`<environment_details>\n# Current Mode\n<model>${'x'.repeat(121)}</model>\n</environment_details>`)).toBeNull();
  });

  it('maps SDK sessions and skips the synthesized legacy totals block', async () => {
    const dir = join(root, 'sessions', SDK_SESSION);
    await put(join(dir, `${SDK_SESSION}.json`), sdkManifest(SDK_SESSION));
    const path = await put(join(dir, `${SDK_SESSION}.messages.json`), sdkSession());
    const records = (await clineSource.parse(path)) ?? [];
    expect(records).toEqual([
      {
        source: 'cline',
        recordId: `${SDK_SESSION}:${SDK_TS + 100}`,
        model: 'claude-sonnet-4-6',
        occurredAt: iso(SDK_TS + 100),
        inputTokens: 200,
        outputTokens: 80,
        cacheReadTokens: 1500,
        cacheWriteTokens: 400,
        reasoningTokens: 0,
      },
      expect.objectContaining({ recordId: `${SDK_SESSION}:${SDK_TS + 60_000}`, model: 'claude-sonnet-4-6', inputTokens: 300, outputTokens: 20 }),
    ]);
  });

  it('skips messages a forked session copied from its parent', () => {
    const manifest = sdkManifest(SDK_FORK, { fork: { forkedFromSessionId: SDK_SESSION, forkedAt: iso(SDK_TS + 200_000), source: 'cli' } });
    const records = sessionRecords(sdkFork(), manifest, SDK_FORK);
    expect(records.map((record) => [record.recordId, record.model, record.inputTokens, record.cacheReadTokens])).toEqual([
      [`${SDK_FORK}:${SDK_TS + 400_000}`, 'claude-sonnet-4-6', 500, 2000],
    ]);
  });

  it('falls back to the manifest model, then to cline, for SDK sessions', () => {
    const bare = { sessionId: SDK_SESSION, messages: [{ role: 'assistant', ts: SDK_TS, metrics: { inputTokens: 50, outputTokens: 5 } }] };
    expect(sessionRecords(bare, sdkManifest(SDK_SESSION), SDK_SESSION).map((record) => record.model)).toEqual(['mistralai/mixtral-8x22b-instruct']);
    expect(sessionRecords(bare, undefined, SDK_SESSION).map((record) => record.model)).toEqual(['cline']);
  });

  it('discovers extension, standalone and SDK logs across hosts', async () => {
    const support = join(root, 'Library', 'Application Support');
    const code = await put(join(support, 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'tasks', CLINE_TASK, 'ui_messages.json'), clineLegacyRows());
    const cursorRoo = await put(join(support, 'Cursor', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks', ROO_TASK, 'ui_messages.json'), rooRows());
    const remoteRoo = await put(join(root, '.vscode-server', 'data', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks', ROO_TASK, 'ui_messages.json'), rooRows());
    const kilo = await put(join(support, 'Windsurf', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks', KILO_TASK, 'ui_messages.json'), kiloRows());
    const standalone = await put(join(root, '.cline', 'data', 'tasks', CLINE_TASK, 'ui_messages.json'), clineLegacyRows());
    const session = await put(join(root, '.cline', 'data', 'sessions', SDK_SESSION, `${SDK_SESSION}.messages.json`), sdkSession());
    await put(join(root, '.cline', 'data', 'sessions', SDK_SESSION, `${SDK_SESSION}.json`), sdkManifest(SDK_SESSION));
    await put(join(support, 'Cursor', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks', '_index.json'), []);
    await put(join(support, 'Cursor', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'tasks', ROO_TASK, 'history_item.json'), {});
    const ctx = { env: {}, home: root, platform: 'darwin' as const };
    expect(await clineSource.discover(ctx)).toEqual([code, standalone, session].sort());
    expect(await rooSource.discover(ctx)).toEqual([cursorRoo, remoteRoo].sort());
    expect(await kiloExtensionSource.discover(ctx)).toEqual([kilo]);
  });

  it('honors Linux, Windows and Cline directory overrides', async () => {
    const xdg = join(root, 'xdg');
    const linux = await put(join(xdg, 'VSCodium', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'tasks', CLINE_TASK, 'ui_messages.json'), []);
    const appData = join(root, 'AppData');
    const windows = await put(join(appData, 'Code - Insiders', 'User', 'globalStorage', 'kilocode.kilo-code', 'tasks', KILO_TASK, 'ui_messages.json'), []);
    const clineDir = join(root, 'custom-cline');
    const tasks = await put(join(clineDir, 'data', 'tasks', CLINE_TASK, 'ui_messages.json'), []);
    const sessions = join(root, 'custom-sessions');
    const session = await put(join(sessions, SDK_SESSION, `${SDK_SESSION}.messages.json`), sdkSession());
    expect(await clineSource.discover({ env: { XDG_CONFIG_HOME: xdg, CLINE_DIR: clineDir, CLINE_SESSION_DATA_DIR: sessions }, home: root, platform: 'linux' })).toEqual(
      [linux, tasks, session].sort(),
    );
    expect(await kiloExtensionSource.discover({ env: { APPDATA: appData }, home: root, platform: 'win32' })).toEqual([windows]);
  });

  it('changes the signature when model sidecar files change', async () => {
    const dir = join(root, 'tasks', ROO_TASK);
    const path = await put(join(dir, 'ui_messages.json'), rooRows());
    const before = await rooSource.signature?.(path);
    await put(join(dir, 'api_conversation_history.json'), apiHistory([{ ts: ROO_BEFORE, model: 'gpt-5' }]));
    expect(await rooSource.signature?.(path)).not.toBe(before);
    expect(await rooSource.signature?.(join(dir, 'missing.json'))).toBeNull();
  });

  it('never copies prompt, answer or path text into records', async () => {
    const dir = join(root, 'tasks', ROO_TASK);
    await put(join(dir, 'task_metadata.json'), clineTaskMetadata);
    await put(join(dir, 'api_conversation_history.json'), apiHistory([{ ts: ROO_BEFORE, model: 'gpt-5' }]));
    const records: UsageRecord[] = [
      ...((await parseRoo(await put(join(dir, 'ui_messages.json'), rooRows()))) ?? []),
      ...((await parseCline(await put(join(root, 'tasks', CLINE_TASK, 'ui_messages.json'), clineLegacyRows()))) ?? []),
      ...sessionRecords(sdkSession(), sdkManifest(SDK_SESSION), SDK_SESSION),
    ];
    expect(records.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(records);
    expect(serialized).not.toContain(CLINE_SECRET);
    expect(serialized).not.toContain('evil');
    expect(serialized).not.toContain('Warning');
    for (const record of records) {
      expect(record.reasoningTokens).toBeLessThanOrEqual(record.outputTokens);
      expect(UsageRecordSchema.safeParse(record).success).toBe(true);
    }
  });
});

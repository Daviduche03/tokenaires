import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { UsageRecord } from '@tokenaires/contracts';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RECORD_ID_PATTERN } from '@/parsers/json';
import { keepLargest } from '@/parsers/merge';
import { parseQwenFile, qwenLegacyRecord, qwenRecord } from '@/parsers/qwen';
import { qwenSource } from '@/sources/qwen';
import type { SourceContext } from '@/sources/types';
import {
  QWEN_AGENT_ID,
  QWEN_AGENT_TURN,
  QWEN_BRANCH_SESSION,
  QWEN_GEMINI,
  QWEN_LEGACY,
  QWEN_OPENAI,
  QWEN_SECRET,
  QWEN_SESSION,
  qwenAgent,
  qwenAgentMeta,
  qwenAssistant,
  qwenBranch,
  qwenLegacy,
  qwenSession,
} from './fixtures/qwen';
import { makeTempDir, removeDir, writeLines } from './helpers/temp';

async function scanQwen(ctx: SourceContext): Promise<{ files: string[]; records: UsageRecord[] }> {
  const files = await qwenSource.discover(ctx);
  const merged = new Map<string, UsageRecord>();
  for (const file of files) for (const record of (await qwenSource.parse(file)) ?? []) keepLargest(merged, record);
  return { files, records: [...merged.values()].sort((a, b) => a.recordId.localeCompare(b.recordId)) };
}

describe('Qwen Code parser', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('qwen');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('maps assistant usage and splits cached prompt tokens', async () => {
    const path = join(root, 'session.jsonl');
    await writeLines(path, qwenSession);
    const records = (await parseQwenFile(path)) ?? [];
    expect(records).toEqual([
      {
        source: 'qwen-code',
        recordId: QWEN_OPENAI,
        model: 'qwen3-coder-plus',
        occurredAt: '2026-10-06T09:01:00.000Z',
        inputTokens: 400,
        outputTokens: 150,
        cacheReadTokens: 600,
        cacheWriteTokens: 0,
        reasoningTokens: 0,
      },
      {
        source: 'qwen-code',
        recordId: QWEN_GEMINI,
        model: 'gemini-2.5-pro',
        occurredAt: '2026-10-06T09:02:00.000Z',
        inputTokens: 200,
        outputTokens: 65,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        reasoningTokens: 25,
      },
    ]);
    for (const record of records) expect(record.recordId).toMatch(RECORD_ID_PATTERN);
    expect(JSON.stringify(records)).not.toContain(QWEN_SECRET);
  });

  it('keeps estimated thoughts inside candidates and handles missing totals', () => {
    const estimated = qwenAssistant(QWEN_OPENAI, { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 20, totalTokenCount: 120 } });
    expect(qwenRecord(estimated)).toMatchObject({ outputTokens: 20, reasoningTokens: 0 });
    const noTotal = qwenAssistant(QWEN_OPENAI, { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20, thoughtsTokenCount: 5 } });
    expect(qwenRecord(noTotal)).toMatchObject({ inputTokens: 100, outputTokens: 20, reasoningTokens: 0 });
    const overCached = qwenAssistant(QWEN_OPENAI, { usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, cachedContentTokenCount: 30, totalTokenCount: 15 } });
    expect(qwenRecord(overCached)).toMatchObject({ inputTokens: 0, cacheReadTokens: 30 });
    const tool = qwenAssistant(QWEN_OPENAI, { usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 10, thoughtsTokenCount: 4, toolUsePromptTokenCount: 6, totalTokenCount: 120 } });
    expect(qwenRecord(tool)).toMatchObject({ inputTokens: 106, outputTokens: 14, reasoningTokens: 4 });
  });

  it('skips lines without usage, model, a stable uuid or tokens', () => {
    expect(qwenRecord(qwenAssistant(QWEN_OPENAI, { usageMetadata: undefined }))).toBeNull();
    expect(qwenRecord(qwenAssistant(QWEN_OPENAI, { model: undefined }))).toBeNull();
    expect(qwenRecord(qwenAssistant('short', {}))).toBeNull();
    expect(qwenRecord(qwenAssistant(QWEN_OPENAI, { uuid: undefined }))).toBeNull();
    expect(qwenRecord(qwenAssistant(QWEN_OPENAI, { timestamp: 'not-a-time' }))).toBeNull();
    expect(qwenRecord(qwenAssistant(QWEN_OPENAI, { usageMetadata: { promptTokenCount: 0, totalTokenCount: 0 } }))).toBeNull();
    expect(qwenRecord(qwenAssistant(QWEN_OPENAI, { type: 'user' }))).toBeNull();
    expect(qwenLegacyRecord({ id: QWEN_LEGACY, type: 'qwen', timestamp: '2025-09-01T08:01:00.000Z' })).toBeNull();
  });

  it('collapses a /branch copy, reads subagents and legacy JSON, and ignores sidecars', async () => {
    const base = join(root, '.qwen');
    const project = join(base, 'projects', '-Users-someone-secret-project');
    await writeLines(join(project, 'chats', `${QWEN_SESSION}.jsonl`), qwenSession);
    await writeLines(join(project, 'chats', `${QWEN_BRANCH_SESSION}.jsonl`), qwenBranch);
    await writeFile(join(project, 'chats', `${QWEN_SESSION}.runtime.json`), qwenLegacy);
    const agentDir = join(project, 'subagents', QWEN_SESSION);
    await writeLines(join(agentDir, `agent-${QWEN_AGENT_ID}.jsonl`), qwenAgent);
    await writeFile(join(agentDir, `agent-${QWEN_AGENT_ID}.meta.json`), qwenAgentMeta);
    await writeLines(join(agentDir, `agent-${QWEN_AGENT_ID}.jsonl.stream`), qwenAgent);
    await writeLines(join(agentDir, 'agent-workflow-1.jsonl'), qwenAgent.map((line) => line.replace(QWEN_AGENT_TURN, 'e0e1e2e3-0000-4000-8000-0000000000aa')));
    await writeLines(join(project, 'workflows', 'run-1', 'journal.jsonl'), qwenSession);
    await writeLines(join(base, 'tmp', 'project-hash', 'chats', 'session-2025-09-01T08-00-3c2b1a09.json'), [qwenLegacy]);
    const { files, records } = await scanQwen({ env: {}, home: root, platform: 'darwin' });
    expect(files).toHaveLength(5);
    expect(records.map((record) => record.recordId)).toEqual([QWEN_OPENAI, QWEN_GEMINI, QWEN_AGENT_TURN, QWEN_LEGACY].sort());
    expect(records.find((record) => record.recordId === QWEN_OPENAI)).toMatchObject({ occurredAt: '2026-10-06T09:01:00.000Z', inputTokens: 400 });
    expect(records.find((record) => record.recordId === QWEN_AGENT_TURN)).toMatchObject({ model: 'qwen3-coder-flash', inputTokens: 60, outputTokens: 12, cacheReadTokens: 20 });
    expect(records.find((record) => record.recordId === QWEN_LEGACY)).toMatchObject({ model: 'qwen3-coder-plus', inputTokens: 400, outputTokens: 60, cacheReadTokens: 100 });
    expect(JSON.stringify(records)).not.toContain(QWEN_SECRET);
  });

  it('honors QWEN_HOME as the .qwen directory and adds QWEN_RUNTIME_DIR', async () => {
    const custom = join(root, 'custom-qwen');
    const runtime = join(root, 'runtime');
    await writeLines(join(custom, 'projects', 'p', 'chats', `${QWEN_SESSION}.jsonl`), qwenSession);
    await writeLines(join(runtime, 'projects', 'p', 'chats', `${QWEN_BRANCH_SESSION}.jsonl`), qwenBranch);
    await writeLines(join(root, '.qwen', 'projects', 'p', 'chats', 'ignored.jsonl'), qwenSession);
    const homeOnly = await scanQwen({ env: { QWEN_HOME: custom }, home: root, platform: 'linux' });
    expect(homeOnly.files).toEqual([join(custom, 'projects', 'p', 'chats', `${QWEN_SESSION}.jsonl`)]);
    const both = await scanQwen({ env: { QWEN_HOME: custom, QWEN_RUNTIME_DIR: runtime }, home: root, platform: 'linux' });
    expect(both.files).toHaveLength(2);
    expect(both.records.map((record) => record.recordId)).toEqual([QWEN_OPENAI, QWEN_GEMINI].sort());
    const tilde = await scanQwen({ env: { QWEN_RUNTIME_DIR: '~/runtime' }, home: root, platform: 'linux' });
    expect(tilde.files).toHaveLength(2);
  });
});

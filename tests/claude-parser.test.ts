import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UsageRecord } from '@tokenaires/contracts';
import { wslHomes } from '@/files/wsl';
import { parseClaudeFile, parseClaudeLine } from '@/parsers/claude';
import { claudeDesktopRoots, claudeRoots } from '@/parsers/paths';
import { scanLocal } from '@/scan';
import { claudeAssistant, claudeEdgeSession, claudeMainSession } from './fixtures/claude';
import { writeFixtureLogs } from './helpers/logs';
import { makeTempDir, removeDir, writeLines } from './helpers/temp';

describe('Claude Code parser', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('claude');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('maps usage fields and builds the record id from message and request ids', () => {
    const record = parseClaudeLine(claudeMainSession[2] ?? '');
    expect(record).toEqual({
      source: 'claude-code',
      recordId: 'msg_011AAAAAAAAAAAAAAAAAAAAA:req_011AAAAAAAAAAAAAAAAAAAAA',
      model: 'claude-test-model',
      occurredAt: '2026-10-01T10:00:00.000Z',
      inputTokens: 10,
      outputTokens: 50,
      cacheReadTokens: 1000,
      cacheWriteTokens: 200,
      reasoningTokens: 20,
    });
  });

  it('skips user lines, synthetic models, blank and malformed lines', () => {
    expect(parseClaudeLine(claudeMainSession[0] ?? '')).toBeNull();
    expect(parseClaudeLine(claudeMainSession[4] ?? '')).toBeNull();
    expect(parseClaudeLine(claudeMainSession[5] ?? '')).toBeNull();
    expect(parseClaudeLine('')).toBeNull();
  });

  it('keeps the streamed line with the largest output for each record id', async () => {
    const path = `${root}/session.jsonl`;
    await writeLines(path, claudeMainSession);
    const records = (await parseClaudeFile(path)) ?? [];
    const into = new Map<string, UsageRecord>(records.map((record) => [record.recordId, record]));
    expect(into.size).toBe(2);
    expect(into.get('msg_011AAAAAAAAAAAAAAAAAAAAA:req_011AAAAAAAAAAAAAAAAAAAAA')?.outputTokens).toBe(50);
    expect(into.get('msg_011BBBBBBBBBBBBBBBBBBBBB')?.outputTokens).toBe(7);
  });

  it('walks nested subagent folders and dedupes across files', async () => {
    const dirs = await writeFixtureLogs(root);
    const result = await scanLocal({ env: { CLAUDE_CONFIG_DIR: dirs.claudeConfig, CODEX_HOME: dirs.codexHome }, home: root });
    const claude = result.records.filter((record) => record.source === 'claude-code');
    expect(result.files['claude-code']).toBe(2);
    expect(claude.map((record) => record.recordId).sort()).toEqual([
      'msg_011AAAAAAAAAAAAAAAAAAAAA:req_011AAAAAAAAAAAAAAAAAAAAA',
      'msg_011BBBBBBBBBBBBBBBBBBBBB',
      'msg_011CCCCCCCCCCCCCCCCCCCCC:req_011CCCCCCCCCCCCCCCCCCCCC',
    ]);
  });

  it('reads both default locations unless CLAUDE_CONFIG_DIR is set', () => {
    expect(claudeRoots({}, '/home/me')).toEqual(['/home/me/.claude/projects', '/home/me/.config/claude/projects']);
    expect(claudeRoots({ CLAUDE_CONFIG_DIR: '/a, /b' }, '/home/me')).toEqual(['/a/projects', '/b/projects']);
  });

  it('returns nothing when the log folders do not exist', async () => {
    const result = await scanLocal({ env: {}, home: `${root}/missing` });
    expect(result.records).toEqual([]);
  });
});

describe('Claude Code edge cases', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('claude-edge');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('skips zero usage lines and emits advisor sub calls under the advisor model', async () => {
    const path = join(root, 'edge.jsonl');
    await writeLines(path, claudeEdgeSession);
    const records = (await parseClaudeFile(path)) ?? [];
    expect(records.map((record) => record.recordId)).toEqual([
      'msg_011EEEEEEEEEEEEEEEEEEEEE:req_011EEEEEEEEEEEEEEEEEEEEE',
      'msg_011EEEEEEEEEEEEEEEEEEEEE:req_011EEEEEEEEEEEEEEEEEEEEE:advisor:0',
    ]);
    expect(records[0]).toMatchObject({ inputTokens: 5, outputTokens: 40, cacheReadTokens: 300, cacheWriteTokens: 20 });
    expect(records[1]).toMatchObject({ model: 'claude-advisor-model', inputTokens: 900, outputTokens: 60, cacheWriteTokens: 100 });
  });

  it('keeps the earliest copy when the same call appears in two files with equal output', async () => {
    const usage = { input_tokens: 1, output_tokens: 9, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
    const id = 'msg_011FFFFFFFFFFFFFFFFFFFFF';
    const request = 'req_011FFFFFFFFFFFFFFFFFFFFF';
    const project = join(root, 'claude', 'projects', 'p');
    await writeLines(join(project, 'a.jsonl'), [claudeAssistant(id, request, '2026-10-04T10:00:30.000Z', usage)]);
    await writeLines(join(project, 'b.jsonl'), [claudeAssistant(id, request, '2026-10-04T10:00:00.000Z', usage)]);
    const result = await scanLocal({ env: { CLAUDE_CONFIG_DIR: join(root, 'claude') }, home: root, cachePath: null });
    expect(result.records).toHaveLength(1);
    expect(result.records[0]?.occurredAt).toBe('2026-10-04T10:00:00.000Z');
  });

  it('reads Claude Desktop agent transcripts but not its audit log copies', async () => {
    const base = join(root, 'Library', 'Application Support', 'Claude', 'local-agent-mode-sessions', 'org', 'user');
    const transcript = claudeMainSession[2] ?? '';
    const auditCopy = JSON.stringify({ ...JSON.parse(transcript) as Record<string, unknown>, requestId: undefined });
    await writeLines(join(base, 'local_1', '.claude', 'projects', '-sessions-x', 's.jsonl'), [transcript]);
    await writeLines(join(base, 'local_1', 'audit.jsonl'), [auditCopy]);
    const result = await scanLocal({ env: { CLAUDE_CONFIG_DIR: join(root, 'none') }, home: root, platform: 'darwin', cachePath: null });
    expect(result.files['claude-code']).toBe(1);
    expect(result.records.map((record) => record.recordId)).toEqual(['msg_011AAAAAAAAAAAAAAAAAAAAA:req_011AAAAAAAAAAAAAAAAAAAAA']);
  });

  it('expands home, splits on commas and the path delimiter, and adds XDG_CONFIG_HOME', () => {
    expect(claudeRoots({ CLAUDE_CONFIG_DIR: '~/one,~/two' }, '/home/me')).toEqual(['/home/me/one/projects', '/home/me/two/projects']);
    expect(claudeRoots({ CLAUDE_CONFIG_DIR: '/a:/b' }, '/home/me')).toEqual(['/a/projects', '/b/projects']);
    expect(claudeRoots({ XDG_CONFIG_HOME: '/xdg' }, '/home/me')).toContain('/xdg/claude/projects');
    expect(claudeDesktopRoots({ APPDATA: 'C:/Users/me/AppData/Roaming' }, '/home/me', 'win32')[0]).toContain('local-agent-mode-sessions');
  });

  it('finds Claude and Codex homes inside WSL distros on Windows only', async () => {
    const tree: Record<string, string[]> = {
      '\\\\wsl.localhost\\': ['Ubuntu', 'docker-desktop'],
      '\\\\wsl.localhost\\Ubuntu\\home': ['ada'],
    };
    const list = (dir: string): Promise<string[]> => Promise.resolve(tree[dir] ?? []);
    expect(await wslHomes('win32', list)).toEqual(['\\\\wsl.localhost\\Ubuntu\\home\\ada', '\\\\wsl.localhost\\Ubuntu\\root']);
    expect(await wslHomes('darwin', list)).toEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UsageRecord } from '@tokenaires/contracts';
import { parseClaudeFile, parseClaudeLine } from '@/parsers/claude';
import { claudeRoots } from '@/parsers/paths';
import { scanLocal } from '@/scan';
import { claudeMainSession } from './fixtures/claude';
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
    const into = new Map<string, UsageRecord>();
    await parseClaudeFile(path, into);
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

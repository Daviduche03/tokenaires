import type { AgentSource, UsageRecord } from '@tokenaires/contracts';
import { PARSE_CONCURRENCY } from '@/config';
import { findAll } from '@/files/walk';
import { runPool } from '@/files/lines';
import { parseClaudeFile } from '@/parsers/claude';
import { parseCodexFile } from '@/parsers/codex';
import { claudeRoots, codexRoots } from '@/parsers/paths';

export interface ScanOptions {
  env: NodeJS.ProcessEnv;
  home: string;
}

export interface ScanResult {
  records: UsageRecord[];
  files: Record<AgentSource, number>;
}

type FileParser = (path: string, into: Map<string, UsageRecord>) => Promise<void>;

async function collect(roots: string[], parse: FileParser): Promise<{ records: UsageRecord[]; files: number }> {
  const files = await findAll(roots);
  const into = new Map<string, UsageRecord>();
  await runPool(files, PARSE_CONCURRENCY, (file) => parse(file, into));
  return { records: [...into.values()], files: files.length };
}

export function byTime(a: UsageRecord, b: UsageRecord): number {
  if (a.occurredAt !== b.occurredAt) return a.occurredAt < b.occurredAt ? -1 : 1;
  return a.recordId < b.recordId ? -1 : a.recordId > b.recordId ? 1 : 0;
}

export async function scanLocal(options: ScanOptions): Promise<ScanResult> {
  const [claude, codex] = await Promise.all([
    collect(claudeRoots(options.env, options.home), parseClaudeFile),
    collect(codexRoots(options.env, options.home), parseCodexFile),
  ]);
  return {
    records: [...claude.records, ...codex.records].sort(byTime),
    files: { 'claude-code': claude.files, codex: codex.files },
  };
}

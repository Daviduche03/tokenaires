import { join } from 'node:path';
import { claudeMainSession, claudeSubagentSession } from '../fixtures/claude';
import { CODEX_CHILD_FILE, CODEX_MAIN_FILE, codexChildSession, codexMainSession } from '../fixtures/codex';
import { writeLines } from './temp';

export interface LogDirs {
  claudeConfig: string;
  codexHome: string;
}

export async function writeFixtureLogs(root: string): Promise<LogDirs> {
  const claudeConfig = join(root, 'claude');
  const codexHome = join(root, 'codex');
  const project = join(claudeConfig, 'projects', '-Users-someone-secret-project');
  await writeLines(join(project, 'session-one.jsonl'), claudeMainSession);
  await writeLines(join(project, 'session-one', 'subagents', 'agent-1.jsonl'), claudeSubagentSession);
  await writeLines(join(codexHome, 'sessions', '2026', '10', '01', CODEX_MAIN_FILE), codexMainSession);
  await writeLines(join(codexHome, 'archived_sessions', CODEX_CHILD_FILE), codexChildSession);
  await writeLines(join(codexHome, 'archived_sessions', CODEX_MAIN_FILE), codexMainSession);
  return { claudeConfig, codexHome };
}

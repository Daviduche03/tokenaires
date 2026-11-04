import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const COPILOT_SECRET = 'COPILOT_SECRET_PROMPT';
export const SESSION_A = '0f6b1c2e-4d5a-4b7c-9e8f-a1b2c3d4e5f6';
export const SESSION_B = '7a8b9c0d-1e2f-4a3b-8c4d-5e6f7a8b9c0d';

export interface UsageRow {
  sessionId: string;
  createdAt: string | number | null;
  input: number;
  output: number;
  cacheRead?: number;
  cacheWrite?: number;
  reasoning?: number;
  model?: string | null;
  initiator?: string | null;
}

export interface CopilotDbOptions {
  table?: boolean;
  outputColumn?: boolean;
}

export async function createCopilotDb(path: string, rows: readonly UsageRow[], options: CopilotDbOptions = {}): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('CREATE TABLE sessions (id TEXT PRIMARY KEY, cwd TEXT, repository TEXT, summary TEXT, created_at TEXT)');
  const sessions = db.prepare('INSERT OR IGNORE INTO sessions VALUES (?, ?, ?, ?, ?)');
  for (const row of rows) sessions.run(row.sessionId, `/Users/someone/${COPILOT_SECRET}`, 'someone/secret-repo', COPILOT_SECRET, '2026-10-01T00:00:00.000Z');
  if (options.table !== false) {
    const output = options.outputColumn === false ? '' : 'output_tokens INTEGER, ';
    db.exec(`CREATE TABLE assistant_usage_events (id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, model TEXT NOT NULL,
      input_tokens INTEGER, ${output}cache_read_tokens INTEGER, cache_write_tokens INTEGER, reasoning_tokens INTEGER,
      initiator TEXT, request_text TEXT, created_at TEXT DEFAULT (datetime('now')))`);
    const columns = options.outputColumn === false ? '' : 'output_tokens, ';
    const values = options.outputColumn === false ? '' : '?, ';
    const insert = db.prepare(`INSERT INTO assistant_usage_events (session_id, model, input_tokens, ${columns}cache_read_tokens, cache_write_tokens, reasoning_tokens, initiator, request_text, created_at)
      VALUES (?, ?, ?, ${values}?, ?, ?, ?, ?, ?)`);
    for (const row of rows) {
      const tokens = options.outputColumn === false ? [row.input] : [row.input, row.output];
      insert.run(row.sessionId, row.model ?? 'claude-test-sonnet', ...tokens, row.cacheRead ?? 0, row.cacheWrite ?? 0, row.reasoning ?? 0, row.initiator ?? null, COPILOT_SECRET, row.createdAt);
    }
  }
  db.close();
}

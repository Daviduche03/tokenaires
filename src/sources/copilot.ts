import { join } from 'node:path';
import type { UsageRecord } from '@tokenaires/contracts';
import type { DatabaseSync } from 'node:sqlite';
import { ENV_KEYS, readEnv } from '@/config';
import { listDir } from '@/files/walk';
import { copilotRecord } from '@/parsers/copilot';
import { expandHome } from '@/parsers/paths';
import { dbSignature, withReadOnlyDb } from '@/sqlite/open';
import type { LogSource, SourceContext } from '@/sources/types';

export const COPILOT_ENV = ENV_KEYS.copilotHome;

const DB_NAME = 'session-store.db';
const TABLE = 'assistant_usage_events';
const COLUMNS = ['id', 'session_id', 'model', 'created_at', 'input_tokens', 'output_tokens', 'cache_read_tokens', 'cache_write_tokens', 'reasoning_tokens'];
const REQUIRED = ['id', 'session_id', 'model', 'created_at'];

export function copilotHome(ctx: SourceContext): string {
  return expandHome(readEnv(ctx.env, COPILOT_ENV) ?? join(ctx.home, '.copilot'), ctx.home);
}

export function readCopilotDb(db: DatabaseSync): UsageRecord[] {
  const present = new Set(db.prepare(`PRAGMA table_info(${TABLE})`).all().map((row) => row.name));
  if (REQUIRED.some((column) => !present.has(column))) return [];
  const select = COLUMNS.map((column) => (present.has(column) ? column : `NULL AS ${column}`)).join(', ');
  const records = new Map<string, UsageRecord>();
  for (const row of db.prepare(`SELECT ${select} FROM ${TABLE} ORDER BY id`).all()) {
    const record = copilotRecord(row);
    if (record && !records.has(record.recordId)) records.set(record.recordId, record);
  }
  return [...records.values()];
}

export const copilotSource: LogSource = {
  source: 'copilot-cli',
  async discover(ctx) {
    const dir = copilotHome(ctx);
    return (await listDir(dir)).filter((name) => name === DB_NAME).map((name) => join(dir, name));
  },
  parse: (path) => withReadOnlyDb(path, readCopilotDb),
  signature: dbSignature,
};

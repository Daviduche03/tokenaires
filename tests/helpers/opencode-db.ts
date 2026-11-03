import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface LegacyRow {
  id: string;
  created: number;
  data: Record<string, unknown>;
}

export interface V2Row {
  id: string;
  type: string;
  created: number;
  data: Record<string, unknown>;
}

export async function createOpenCodeDb(path: string, legacy: LegacyRow[], v2: V2Row[] = []): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('CREATE TABLE session (id text PRIMARY KEY, parent_id text, directory text, title text, time_created integer)');
  db.exec('CREATE TABLE message (id text PRIMARY KEY, session_id text, time_created integer, data text)');
  db.exec('CREATE TABLE part (id text PRIMARY KEY, message_id text, session_id text, data text)');
  db.prepare('INSERT INTO session VALUES (?, NULL, ?, ?, ?)').run('ses_secretsession01', '/Users/someone/opencode-secret', 'secret title', 1);
  const insert = db.prepare('INSERT INTO message VALUES (?, ?, ?, ?)');
  for (const row of legacy) insert.run(row.id, 'ses_secretsession01', row.created, JSON.stringify(row.data));
  if (v2.length > 0) {
    db.exec('CREATE TABLE session_v2 (id text PRIMARY KEY, parent_id text, directory text, title text, time_created integer)');
    db.exec('CREATE TABLE session_message (id text PRIMARY KEY, session_id text, type text, seq integer, time_created integer, data blob)');
    const insertV2 = db.prepare('INSERT INTO session_message VALUES (?, ?, ?, ?, ?, ?)');
    v2.forEach((row, seq) => insertV2.run(row.id, 'ses_secretsession01', row.type, seq, row.created, new TextEncoder().encode(JSON.stringify(row.data))));
  }
  db.close();
}

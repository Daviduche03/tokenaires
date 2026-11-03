import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface ConversationRows {
  generations: Uint8Array[];
  steps?: { idx: number; metadata: Uint8Array }[];
}

const SCHEMA = [
  'CREATE TABLE steps (idx integer PRIMARY KEY, step_type integer NOT NULL DEFAULT 0, metadata blob, step_payload blob)',
  'CREATE TABLE gen_metadata (idx integer PRIMARY KEY, data blob, size integer NOT NULL DEFAULT 0)',
];

export async function createConversation(path: string, rows: ConversationRows, wal = false): Promise<DatabaseSync> {
  await mkdir(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  if (wal) db.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0;');
  for (const statement of SCHEMA) db.exec(statement);
  const insertGeneration = db.prepare('INSERT INTO gen_metadata (idx, data, size) VALUES (?, ?, ?)');
  rows.generations.forEach((data, index) => insertGeneration.run(index, data, data.length));
  const insertStep = db.prepare('INSERT INTO steps (idx, metadata, step_payload) VALUES (?, ?, ?)');
  for (const step of rows.steps ?? []) insertStep.run(step.idx, step.metadata, new TextEncoder().encode('secret step payload'));
  return db;
}

import type { UsageRecord } from '@tokenaires/contracts';
import type { DatabaseSync } from 'node:sqlite';
import { isObject, parseObject, type JsonObject } from '@/parsers/json';
import { openCodeRecord, type OpenCodeLayout } from '@/parsers/opencode';

const TABLES = "SELECT name FROM sqlite_master WHERE type = 'table'";
const field = (path: string): string => `json_extract(CAST(data AS TEXT), '${path}')`;

const LEGACY = `SELECT id, time_created AS created, ${field('$.modelID')} AS model,
  ${field('$.time.created')} AS at, ${field('$.tokens')} AS tokens
  FROM message WHERE ${field('$.role')} IN ('assistant', 'model')`;

const V2 = `SELECT id, time_created AS created, ${field('$.model.id')} AS model,
  NULL AS at, ${field('$.tokens')} AS tokens
  FROM session_message WHERE type IN ('assistant', 'compaction')`;

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asTokens(value: unknown): JsonObject | null {
  if (isObject(value)) return value;
  return typeof value === 'string' ? parseObject(value) : null;
}

function readRows(db: DatabaseSync, sql: string, layout: OpenCodeLayout, into: Map<string, UsageRecord>): void {
  for (const row of db.prepare(sql).all()) {
    const record = openCodeRecord({
      id: asText(row.id),
      model: asText(row.model),
      createdAt: row.at ?? row.created,
      tokens: asTokens(row.tokens),
      layout,
    });
    if (record && !into.has(record.recordId)) into.set(record.recordId, record);
  }
}

export function readOpenCodeDb(db: DatabaseSync): UsageRecord[] {
  const tables = new Set(db.prepare(TABLES).all().map((row) => row.name));
  const into = new Map<string, UsageRecord>();
  if (tables.has('message')) readRows(db, LEGACY, 'legacy', into);
  if (tables.has('session_message')) readRows(db, V2, 'v2', into);
  return [...into.values()];
}

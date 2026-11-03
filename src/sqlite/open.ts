import { copyFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { DatabaseSync } from 'node:sqlite';

type SqliteModule = typeof import('node:sqlite');

const WAL_SUFFIX = '-wal';
const COPY_LIMIT_BYTES = 256 * 1024 * 1024;
const TEMP_PREFIX = 'tokenaires-db-';

let loaded: Promise<SqliteModule | null> | null = null;

function loadSqlite(): Promise<SqliteModule | null> {
  loaded ??= import('node:sqlite').catch(() => null);
  return loaded;
}

async function sizeOf(path: string): Promise<number | null> {
  try {
    return (await stat(path)).size;
  } catch {
    return null;
  }
}

export async function dbSignature(path: string): Promise<string | null> {
  try {
    const main = await stat(path);
    const wal = await stat(`${path}${WAL_SUFFIX}`).catch(() => null);
    return [main.size, main.mtimeMs, wal?.size ?? 0, wal?.mtimeMs ?? 0].join(':');
  } catch {
    return null;
  }
}

function openImmutable(sqlite: SqliteModule, path: string): DatabaseSync {
  const url = new URL(`${pathToFileURL(path).href}?immutable=1`);
  return new sqlite.DatabaseSync(url, { readOnly: true });
}

async function copyWithWal(path: string): Promise<{ dir: string; copy: string }> {
  const dir = await mkdtemp(join(tmpdir(), TEMP_PREFIX));
  const copy = join(dir, basename(path));
  await copyFile(path, copy);
  await copyFile(`${path}${WAL_SUFFIX}`, `${copy}${WAL_SUFFIX}`);
  return { dir, copy };
}

export async function withReadOnlyDb<T>(path: string, read: (db: DatabaseSync) => T): Promise<T | null> {
  const sqlite = await loadSqlite();
  const size = await sizeOf(path);
  if (!sqlite || size === null) return null;
  const wal = (await sizeOf(`${path}${WAL_SUFFIX}`)) ?? 0;
  let tempDir: string | null = null;
  let db: DatabaseSync | null = null;
  try {
    if (wal > 0 && size + wal <= COPY_LIMIT_BYTES) {
      const copied = await copyWithWal(path);
      tempDir = copied.dir;
      db = new sqlite.DatabaseSync(copied.copy, { readOnly: true });
    } else {
      db = openImmutable(sqlite, path);
    }
    return read(db);
  } catch {
    return null;
  } finally {
    db?.close();
    if (tempDir) await rm(tempDir, { recursive: true, force: true });
  }
}

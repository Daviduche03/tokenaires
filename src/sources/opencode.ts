import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import type { UsageRecord } from '@tokenaires/contracts';
import { findAll, listDir, type FileFilter } from '@/files/walk';
import { parseObject } from '@/parsers/json';
import { legacyMessage, openCodeRecord } from '@/parsers/opencode';
import { openCodeDataDir, openCodeDbPrefix } from '@/parsers/paths';
import { dbSignature, withReadOnlyDb } from '@/sqlite/open';
import { readOpenCodeDb } from '@/sources/opencode-db';
import type { LogSource } from '@/sources/types';

const DB_SUFFIX = '.db';
const JSON_SUFFIX = '.json';

const isMessageFile: FileFilter = (_path, name) => name.endsWith(JSON_SUFFIX);

export async function parseOpenCodeMessageFile(path: string): Promise<UsageRecord[] | null> {
  try {
    const data = parseObject(await readFile(path, 'utf8'));
    const message = data ? legacyMessage(data, basename(path, JSON_SUFFIX), null) : null;
    const record = message ? openCodeRecord(message) : null;
    return record ? [record] : [];
  } catch {
    return null;
  }
}

export const openCodeSource: LogSource = {
  source: 'opencode',
  async discover(ctx) {
    const dir = openCodeDataDir(ctx.env, ctx.home);
    const prefix = openCodeDbPrefix(ctx.env);
    const dbs = (await listDir(dir)).filter((name) => name.startsWith(prefix) && name.endsWith(DB_SUFFIX));
    const messages = await findAll([join(dir, 'storage', 'message')], isMessageFile);
    return [...dbs.map((name) => join(dir, name)), ...messages];
  },
  parse: (path) => (path.endsWith(DB_SUFFIX) ? withReadOnlyDb(path, readOpenCodeDb) : parseOpenCodeMessageFile(path)),
  signature: async (path) => (path.endsWith(DB_SUFFIX) ? dbSignature(path) : null),
};

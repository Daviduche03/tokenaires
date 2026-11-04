import { join } from 'node:path';
import { listDir } from '@/files/walk';
import { kiloDataDir, kiloDbOverride } from '@/parsers/paths';
import { dbSignature, withReadOnlyDb } from '@/sqlite/open';
import { kiloExtensionSource } from '@/sources/cline';
import { readOpenCodeDb } from '@/sources/opencode-db';
import type { LogSource } from '@/sources/types';

const DB_SUFFIX = '.db';
const DB_PREFIXES = ['kilo', 'opencode'];
const UI_MESSAGES = 'ui_messages.json';

const isDbPath = (path: string): boolean => !path.endsWith(UI_MESSAGES);

const isKiloDb = (name: string): boolean => name.endsWith(DB_SUFFIX) && DB_PREFIXES.some((prefix) => name.startsWith(prefix));

export const kiloSource: LogSource = {
  source: 'kilo-code',
  async discover(ctx) {
    const dir = kiloDataDir(ctx.env, ctx.home);
    const found = (await listDir(dir)).filter(isKiloDb).map((name) => join(dir, name));
    const override = kiloDbOverride(ctx.env, ctx.home);
    const dbs = override && !found.includes(override) ? [...found, override] : found;
    return [...dbs, ...(await kiloExtensionSource.discover(ctx))];
  },
  parse: (path) => (isDbPath(path) ? withReadOnlyDb(path, (db) => readOpenCodeDb(db, 'kilo-code')) : kiloExtensionSource.parse(path)),
  signature: async (path) => (isDbPath(path) ? dbSignature(path) : ((await kiloExtensionSource.signature?.(path)) ?? null)),
};

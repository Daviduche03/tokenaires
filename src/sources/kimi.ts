import { sep } from 'node:path';
import { findAll, type FileFilter } from '@/files/walk';
import { kimiWireOwner, parseKimiWire } from '@/parsers/kimi';
import { parseKimiLegacyWire } from '@/parsers/kimi-legacy';
import { kimiLegacySessionsRoot, kimiSessionsRoot } from '@/parsers/paths';
import type { LogSource } from '@/sources/types';

const WIRE_FILE = 'wire.jsonl';
const AGENTS = `${sep}agents${sep}`;

const isWire: FileFilter = (path, name) => name === WIRE_FILE && path.includes(AGENTS);
const isLegacyWire: FileFilter = (_path, name) => name === WIRE_FILE;

export const kimiSource: LogSource = {
  source: 'kimi-code',
  async discover(ctx) {
    const [current, legacy] = await Promise.all([
      findAll([kimiSessionsRoot(ctx.env, ctx.home)], isWire),
      findAll([kimiLegacySessionsRoot(ctx.env, ctx.home)], isLegacyWire),
    ]);
    return [...current, ...legacy.filter((path) => !current.includes(path))];
  },
  parse: (path) => (kimiWireOwner(path) ? parseKimiWire(path) : parseKimiLegacyWire(path)),
};

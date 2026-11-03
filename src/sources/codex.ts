import { join } from 'node:path';
import { ENV_KEYS, readEnv } from '@/config';
import { isZstd } from '@/files/lines';
import { findAll, type FileFilter } from '@/files/walk';
import { wslHomes } from '@/files/wsl';
import { parseCodexFile } from '@/parsers/codex';
import { codexRoots } from '@/parsers/paths';
import type { LogSource, SourceContext } from '@/sources/types';

const ZSTD_SUFFIX = '.zst';

const isRollout: FileFilter = (_path, name) => name.endsWith('.jsonl') || name.endsWith(`.jsonl${ZSTD_SUFFIX}`);

export function dropCompressedTwins(paths: readonly string[]): string[] {
  const plain = new Set(paths.filter((path) => !isZstd(path)));
  return paths.filter((path) => !isZstd(path) || !plain.has(path.slice(0, -ZSTD_SUFFIX.length)));
}

async function roots(ctx: SourceContext): Promise<string[]> {
  const base = codexRoots(ctx.env, ctx.home);
  if (readEnv(ctx.env, ENV_KEYS.codexHome)) return base;
  const homes = await wslHomes(ctx.platform);
  return [...base, ...homes.flatMap((home) => [join(home, '.codex', 'sessions'), join(home, '.codex', 'archived_sessions')])];
}

export const codexSource: LogSource = {
  source: 'codex',
  async discover(ctx) {
    return dropCompressedTwins(await findAll(await roots(ctx), isRollout));
  },
  parse: parseCodexFile,
};

import { join, sep } from 'node:path';
import { ENV_KEYS, readEnv } from '@/config';
import { findAll, type FileFilter } from '@/files/walk';
import { expandHome } from '@/parsers/paths';
import { parseQwenFile } from '@/parsers/qwen';
import type { LogSource } from '@/sources/types';

export const QWEN_ENV = [ENV_KEYS.qwenRuntime, ENV_KEYS.qwenHome] as const;

const [RUNTIME_DIR, QWEN_HOME] = QWEN_ENV;
const CHATS = `${sep}chats${sep}`;
const SUBAGENTS = `${sep}subagents${sep}`;
const LEGACY_PREFIX = 'session-';

export function qwenRoots(env: NodeJS.ProcessEnv, home: string): string[] {
  const runtime = readEnv(env, RUNTIME_DIR);
  const global = expandHome(readEnv(env, QWEN_HOME) ?? join(home, '.qwen'), home);
  const bases = runtime ? [expandHome(runtime, home), global] : [global];
  return [...new Set(bases)].flatMap((base) => [join(base, 'projects'), join(base, 'tmp')]);
}

const isSessionFile: FileFilter = (path, name) => {
  if (name.endsWith('.jsonl')) return path.includes(CHATS) || path.includes(SUBAGENTS);
  return name.startsWith(LEGACY_PREFIX) && name.endsWith('.json') && path.includes(CHATS);
};

export const qwenSource: LogSource = {
  source: 'qwen-code',
  discover: (ctx) => findAll(qwenRoots(ctx.env, ctx.home), isSessionFile),
  parse: parseQwenFile,
};

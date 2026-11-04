import { stat } from 'node:fs/promises';
import { dirname, join, sep } from 'node:path';
import { ENV_KEYS, readEnv } from '@/config';
import { findAll, type FileFilter } from '@/files/walk';
import {
  API_HISTORY_FILE,
  SESSION_MESSAGES_SUFFIX,
  TASK_METADATA_FILE,
  UI_MESSAGES_FILE,
  parseClineSessionFile,
  sessionManifestPath,
  taskFileParser,
  type ClineFamilySource,
} from '@/parsers/cline';
import { expandHome } from '@/parsers/paths';
import { extensionTaskRoots } from '@/sources/vscode-hosts';
import type { LogSource, SourceContext } from '@/sources/types';

export const CLINE_ENV = [ENV_KEYS.clineDir, ENV_KEYS.clineData, ENV_KEYS.clineSessions] as const;

const [CLINE_DIR, CLINE_DATA_DIR, CLINE_SESSION_DATA_DIR] = CLINE_ENV;
const TASKS = `${sep}tasks${sep}`;

export const EXTENSION_IDS: Readonly<Record<ClineFamilySource, string>> = {
  cline: 'saoudrizwan.claude-dev',
  'roo-code': 'rooveterinaryinc.roo-cline',
  'kilo-code': 'kilocode.kilo-code',
};

const isTaskLog: FileFilter = (path, name) => name === UI_MESSAGES_FILE && path.includes(TASKS);
const isSessionLog: FileFilter = (_path, name) => name.endsWith(SESSION_MESSAGES_SUFFIX);

function envDir(ctx: SourceContext, key: string): string | null {
  const value = readEnv(ctx.env, key);
  return value ? expandHome(value, ctx.home) : null;
}

export function clineDataDir(ctx: SourceContext): string {
  return envDir(ctx, CLINE_DATA_DIR) ?? join(envDir(ctx, CLINE_DIR) ?? join(ctx.home, '.cline'), 'data');
}

export function clineSessionsDir(ctx: SourceContext): string {
  return envDir(ctx, CLINE_SESSION_DATA_DIR) ?? join(clineDataDir(ctx), 'sessions');
}

async function stamp(path: string): Promise<string | null> {
  try {
    const info = await stat(path);
    return `${info.size}:${info.mtimeMs}`;
  } catch {
    return null;
  }
}

async function filesSignature(path: string, siblings: readonly string[]): Promise<string | null> {
  const main = await stamp(path);
  if (!main) return null;
  const rest = await Promise.all(siblings.map(stamp));
  return [main, ...rest.map((value) => value ?? '-')].join('|');
}

const isSessionPath = (path: string): boolean => path.endsWith(SESSION_MESSAGES_SUFFIX);

function taskSignature(path: string): Promise<string | null> {
  const dir = dirname(path);
  return filesSignature(path, [join(dir, TASK_METADATA_FILE), join(dir, API_HISTORY_FILE)]);
}

function extensionSource(source: ClineFamilySource): LogSource {
  return {
    source,
    discover: async (ctx) => findAll(await extensionTaskRoots(ctx, EXTENSION_IDS[source]), isTaskLog),
    parse: taskFileParser(source),
    signature: taskSignature,
  };
}

const parseClineTask = taskFileParser('cline');

export const clineSource: LogSource = {
  source: 'cline',
  async discover(ctx) {
    const [extension, standalone, sessions] = await Promise.all([
      findAll(await extensionTaskRoots(ctx, EXTENSION_IDS.cline), isTaskLog),
      findAll([join(clineDataDir(ctx), 'tasks')], isTaskLog),
      findAll([clineSessionsDir(ctx)], isSessionLog),
    ]);
    return [...new Set([...extension, ...standalone, ...sessions])].sort();
  },
  parse: (path) => (isSessionPath(path) ? parseClineSessionFile(path) : parseClineTask(path)),
  signature: (path) => (isSessionPath(path) ? filesSignature(path, [sessionManifestPath(path)]) : taskSignature(path)),
};

export const rooSource: LogSource = extensionSource('roo-code');

export const kiloExtensionSource: LogSource = extensionSource('kilo-code');

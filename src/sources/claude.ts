import { join, sep } from 'node:path';
import { findAll, isJsonl, type FileFilter } from '@/files/walk';
import { wslHomes } from '@/files/wsl';
import { parseClaudeFile } from '@/parsers/claude';
import { claudeDesktopRoots, claudeRoots } from '@/parsers/paths';
import { ENV_KEYS, readEnv } from '@/config';
import type { LogSource, SourceContext } from '@/sources/types';

const DESKTOP_PROJECTS = `${sep}.claude${sep}projects${sep}`;

const isDesktopTranscript: FileFilter = (path, name) => isJsonl(path, name) && path.includes(DESKTOP_PROJECTS);

async function roots(ctx: SourceContext): Promise<string[]> {
  const base = claudeRoots(ctx.env, ctx.home);
  if (readEnv(ctx.env, ENV_KEYS.claudeConfig)) return base;
  const homes = await wslHomes(ctx.platform);
  return [...base, ...homes.flatMap((home) => [join(home, '.claude', 'projects'), join(home, '.config', 'claude', 'projects')])];
}

export const claudeSource: LogSource = {
  source: 'claude-code',
  async discover(ctx) {
    const [projects, desktop] = await Promise.all([
      findAll(await roots(ctx), isJsonl),
      findAll(claudeDesktopRoots(ctx.env, ctx.home, ctx.platform), isDesktopTranscript),
    ]);
    return [...projects, ...desktop];
  },
  parse: parseClaudeFile,
};

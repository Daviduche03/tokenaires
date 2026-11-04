import { join } from 'node:path';
import { ENV_KEYS, readEnv } from '@/config';
import { wslHomes } from '@/files/wsl';
import type { SourceContext } from '@/sources/types';

export const VSCODE_HOSTS = ['Code', 'Code - Insiders', 'Cursor', 'Windsurf', 'VSCodium', 'Kiro', 'Trae', 'Antigravity'] as const;
export const VSCODE_SERVERS = ['.vscode-server', '.vscode-server-insiders', '.cursor-server', '.windsurf-server'] as const;

export function desktopConfigBase(env: NodeJS.ProcessEnv, home: string, platform: NodeJS.Platform): string {
  if (platform === 'darwin') return join(home, 'Library', 'Application Support');
  if (platform === 'win32') return readEnv(env, 'APPDATA') ?? join(home, 'AppData', 'Roaming');
  return readEnv(env, ENV_KEYS.xdgConfig) ?? join(home, '.config');
}

export function desktopUserDirs(env: NodeJS.ProcessEnv, home: string, platform: NodeJS.Platform): string[] {
  const base = desktopConfigBase(env, home, platform);
  return VSCODE_HOSTS.map((host) => join(base, host, 'User'));
}

export function remoteUserDirs(home: string): string[] {
  return VSCODE_SERVERS.map((server) => join(home, server, 'data', 'User'));
}

export async function vscodeUserDirs(ctx: SourceContext): Promise<string[]> {
  const homes = await wslHomes(ctx.platform);
  const dirs = [...desktopUserDirs(ctx.env, ctx.home, ctx.platform), ...[ctx.home, ...homes].flatMap(remoteUserDirs)];
  return [...new Set(dirs)];
}

export async function extensionTaskRoots(ctx: SourceContext, extensionId: string): Promise<string[]> {
  return (await vscodeUserDirs(ctx)).map((dir) => join(dir, 'globalStorage', extensionId, 'tasks'));
}

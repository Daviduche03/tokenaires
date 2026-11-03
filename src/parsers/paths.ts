import { join } from 'node:path';
import { ENV_KEYS, readEnv } from '@/config';

export function claudeRoots(env: NodeJS.ProcessEnv, home: string): string[] {
  const configured = readEnv(env, ENV_KEYS.claudeConfig);
  if (configured) {
    return configured
      .split(',')
      .map((dir) => dir.trim())
      .filter((dir) => dir.length > 0)
      .map((dir) => join(dir, 'projects'));
  }
  return [join(home, '.claude', 'projects'), join(home, '.config', 'claude', 'projects')];
}

export function codexRoots(env: NodeJS.ProcessEnv, home: string): string[] {
  const codexHome = readEnv(env, ENV_KEYS.codexHome) ?? join(home, '.codex');
  return [join(codexHome, 'sessions'), join(codexHome, 'archived_sessions')];
}

import { chmod, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { CONFIG_FILE_MODE, RECORD_RULES_VERSION, SYNC_STATE_FILE_NAME } from '@/config';
import { isObject } from '@/parsers/json';
import { configPath } from '@/store';

export function syncStatePath(env: NodeJS.ProcessEnv, home: string): string {
  return join(dirname(configPath(env, home)), SYNC_STATE_FILE_NAME);
}

export async function needsFullUpload(path: string, handle: string): Promise<boolean> {
  try {
    const state: unknown = JSON.parse(await readFile(path, 'utf8'));
    return !isObject(state) || state.handle !== handle || state.rulesVersion !== RECORD_RULES_VERSION;
  } catch {
    return true;
  }
}

export async function markFullUpload(path: string, handle: string): Promise<void> {
  try {
    await writeFile(path, `${JSON.stringify({ handle, rulesVersion: RECORD_RULES_VERSION })}\n`, { mode: CONFIG_FILE_MODE });
    await chmod(path, CONFIG_FILE_MODE);
  } catch {
    return;
  }
}

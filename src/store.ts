import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  CONFIG_DIR_MODE,
  CONFIG_DIR_NAME,
  CONFIG_FILE_MODE,
  CONFIG_FILE_NAME,
  ENV_KEYS,
  readEnv,
} from '@/config';
import { isObject } from '@/parsers/json';

export interface StoredConfig {
  apiUrl: string;
  token: string;
  deviceId: string;
  privateKeyPem: string;
  handle: string;
}

const FIELDS = ['apiUrl', 'token', 'deviceId', 'privateKeyPem', 'handle'] as const;

export function configPath(env: NodeJS.ProcessEnv, home: string): string {
  const base = readEnv(env, ENV_KEYS.xdgConfig) ?? join(home, '.config');
  return join(base, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
}

function toConfig(value: unknown): StoredConfig | null {
  if (!isObject(value)) return null;
  const read = (key: (typeof FIELDS)[number]): string | null => {
    const field = value[key];
    return typeof field === 'string' && field.length > 0 ? field : null;
  };
  const [apiUrl, token, deviceId, privateKeyPem, handle] = FIELDS.map(read);
  if (!apiUrl || !token || !deviceId || !privateKeyPem || !handle) return null;
  return { apiUrl, token, deviceId, privateKeyPem, handle };
}

export async function loadConfig(path: string): Promise<StoredConfig | null> {
  try {
    const raw = await readFile(path, 'utf8');
    return toConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveConfig(path: string, config: StoredConfig): Promise<void> {
  const dir = dirname(path);
  await mkdir(dir, { recursive: true, mode: CONFIG_DIR_MODE });
  await chmod(dir, CONFIG_DIR_MODE);
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, { mode: CONFIG_FILE_MODE });
  await chmod(path, CONFIG_FILE_MODE);
}

export async function deleteConfig(path: string): Promise<boolean> {
  try {
    await rm(path);
    return true;
  } catch {
    return false;
  }
}

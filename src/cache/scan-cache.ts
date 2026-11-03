import { chmod, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';
import type { AgentSource, UsageRecord } from '@tokenaires/contracts';
import {
  CLI_VERSION,
  CONFIG_DIR_MODE,
  CONFIG_FILE_MODE,
  ENV_KEYS,
  SCAN_CACHE_FILE_NAME,
  SCAN_CACHE_VERSION,
  readEnv,
} from '@/config';
import { isObject } from '@/parsers/json';
import { configPath } from '@/store';
import { pack, toCachedFile, unpack, type CachedFile } from '@/cache/records';

const CACHE_VERSION = `${SCAN_CACHE_VERSION}:${CLI_VERSION}`;

export function scanCachePath(env: NodeJS.ProcessEnv, home: string): string | null {
  if (readEnv(env, ENV_KEYS.noCache)) return null;
  return join(dirname(configPath(env, home)), SCAN_CACHE_FILE_NAME);
}

export class ScanCache {
  private readonly live = new Map<string, CachedFile>();
  private changed = false;
  hits = 0;

  constructor(
    private readonly path: string | null,
    private readonly previous: ReadonlyMap<string, CachedFile>,
  ) {}

  get(file: string, sig: string): UsageRecord[] | null {
    const entry = this.previous.get(file);
    if (entry?.sig !== sig) return null;
    this.live.set(file, entry);
    this.hits += 1;
    return unpack(entry);
  }

  set(file: string, sig: string, source: AgentSource, records: readonly UsageRecord[]): void {
    this.live.set(file, pack(sig, source, records));
    this.changed = true;
  }

  async save(): Promise<void> {
    if (!this.path) return;
    if (!this.changed && this.live.size === this.previous.size) return;
    const body = { version: CACHE_VERSION, files: Object.fromEntries(this.live) };
    const dir = dirname(this.path);
    const temp = `${this.path}.${process.pid}.tmp`;
    try {
      await mkdir(dir, { recursive: true, mode: CONFIG_DIR_MODE });
      await writeFile(temp, gzipSync(JSON.stringify(body), { level: 1 }), { mode: CONFIG_FILE_MODE });
      await chmod(temp, CONFIG_FILE_MODE);
      await rename(temp, this.path);
    } catch {
      await rm(temp, { force: true });
    }
  }
}

function readEntries(raw: Buffer): Map<string, CachedFile> {
  const entries = new Map<string, CachedFile>();
  const parsed: unknown = JSON.parse(gunzipSync(raw).toString('utf8'));
  if (!isObject(parsed) || parsed.version !== CACHE_VERSION || !isObject(parsed.files)) return entries;
  for (const [file, value] of Object.entries(parsed.files)) {
    const entry = toCachedFile(value);
    if (entry) entries.set(file, entry);
  }
  return entries;
}

export async function loadScanCache(path: string | null): Promise<ScanCache> {
  if (!path) return new ScanCache(null, new Map());
  try {
    return new ScanCache(path, readEntries(await readFile(path)));
  } catch {
    return new ScanCache(path, new Map());
  }
}

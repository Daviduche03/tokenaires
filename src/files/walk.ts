import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export type FileFilter = (path: string, name: string) => boolean;

export const isJsonl: FileFilter = (_path, name) => name.endsWith('.jsonl');

export async function findFiles(root: string, keep: FileFilter): Promise<string[]> {
  const found: string[] = [];
  const pending: string[] = [root];
  while (pending.length > 0) {
    const dir = pending.pop();
    if (dir === undefined) break;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) pending.push(path);
      else if (entry.isFile() && keep(path, entry.name)) found.push(path);
    }
  }
  return found.sort();
}

export async function findAll(roots: readonly string[], keep: FileFilter = isJsonl): Promise<string[]> {
  const lists = await Promise.all([...new Set(roots)].map((root) => findFiles(root, keep)));
  return [...new Set(lists.flat())].sort();
}

export async function listDir(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).sort();
  } catch {
    return [];
  }
}

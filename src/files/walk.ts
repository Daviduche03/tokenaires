import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function findJsonlFiles(root: string): Promise<string[]> {
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
      else if (entry.isFile() && entry.name.endsWith('.jsonl')) found.push(path);
    }
  }
  return found.sort();
}

export async function findAll(roots: readonly string[]): Promise<string[]> {
  const lists = await Promise.all(roots.map((root) => findJsonlFiles(root)));
  return [...new Set(lists.flat())];
}

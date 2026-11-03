import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export async function makeTempDir(prefix: string): Promise<string> {
  return mkdtemp(join(tmpdir(), `tokenaires-${prefix}-`));
}

export async function writeLines(path: string, lines: readonly string[]): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${lines.join('\n')}\n`);
}

export async function removeDir(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
}

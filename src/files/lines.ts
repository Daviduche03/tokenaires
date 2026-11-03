import { open } from 'node:fs/promises';
import { createInterface } from 'node:readline';

export async function eachLine(
  path: string,
  onLine: (line: string, index: number) => void,
): Promise<void> {
  let handle;
  try {
    handle = await open(path, 'r');
  } catch {
    return;
  }
  const stream = handle.createReadStream({ encoding: 'utf8' });
  const reader = createInterface({ input: stream, crlfDelay: Infinity });
  let index = 0;
  try {
    for await (const line of reader) {
      onLine(line, index);
      index += 1;
    }
  } catch {
    return;
  } finally {
    reader.close();
    stream.destroy();
    await handle.close().catch(() => undefined);
  }
}

export async function runPool<T>(
  items: readonly T[],
  limit: number,
  task: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      if (item !== undefined) await task(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

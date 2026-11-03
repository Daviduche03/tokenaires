import { createReadStream } from 'node:fs';
import type { Readable } from 'node:stream';
import * as zlib from 'node:zlib';

export type LineHandler = (line: Buffer, index: number) => void;

const NEWLINE = 0x0a;
const RETURN = 0x0d;
const READ_CHUNK = 1024 * 1024;
const ZSTD_SUFFIX = '.zst';

export function canReadZstd(): boolean {
  return typeof zlib.createZstdDecompress === 'function';
}

export function isZstd(path: string): boolean {
  return path.endsWith(ZSTD_SUFFIX);
}

function openStream(path: string): Readable | null {
  const raw = createReadStream(path, { highWaterMark: READ_CHUNK });
  if (!isZstd(path)) return raw;
  if (!canReadZstd()) {
    raw.destroy();
    return null;
  }
  const inflate = zlib.createZstdDecompress();
  raw.on('error', (error) => inflate.destroy(error));
  inflate.on('close', () => raw.destroy());
  return raw.pipe(inflate);
}

function trimReturn(line: Buffer): Buffer {
  return line.length > 0 && line[line.length - 1] === RETURN ? line.subarray(0, line.length - 1) : line;
}

export async function eachLine(path: string, onLine: LineHandler): Promise<boolean> {
  const stream = openStream(path);
  if (!stream) return false;
  let carry: Buffer[] = [];
  let index = 0;
  const emit = (line: Buffer): void => {
    onLine(trimReturn(line), index);
    index += 1;
  };
  try {
    for await (const chunk of stream) {
      const data = chunk as Buffer;
      let start = 0;
      let end = data.indexOf(NEWLINE, start);
      while (end !== -1) {
        const piece = data.subarray(start, end);
        if (carry.length > 0) {
          emit(Buffer.concat([...carry, piece]));
          carry = [];
        } else {
          emit(piece);
        }
        start = end + 1;
        end = data.indexOf(NEWLINE, start);
      }
      if (start < data.length) carry.push(data.subarray(start));
    }
    if (carry.length > 0) emit(Buffer.concat(carry));
    return true;
  } catch {
    return false;
  } finally {
    stream.destroy();
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

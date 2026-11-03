export type JsonObject = Record<string, unknown>;

export const RECORD_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,159}$/;

export function parseObject(line: string): JsonObject | null {
  try {
    const value: unknown = JSON.parse(line);
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

export function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function child(value: unknown, key: string): JsonObject | null {
  if (!isObject(value)) return null;
  const next = value[key];
  return isObject(next) ? next : null;
}

export function text(value: unknown, key: string): string | null {
  if (!isObject(value)) return null;
  const next = value[key];
  return typeof next === 'string' && next.length > 0 ? next : null;
}

export function count(value: unknown, key: string): number {
  if (!isObject(value)) return 0;
  return toCount(value[key]);
}

export function toCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

export function isoTime(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function epochTime(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null;
  return isoTime(value < 1e12 ? value * 1000 : value);
}

const ID_PART = /^[A-Za-z0-9][A-Za-z0-9_.:-]{7,}$/;

export function nativeId(...parts: (string | null | undefined)[]): string | null {
  if (parts.some((part) => !part || !ID_PART.test(part))) return null;
  const id = parts.join(':');
  return RECORD_ID_PATTERN.test(id) ? id : null;
}

export function bytesHave(line: Buffer, markers: readonly Buffer[]): boolean {
  return markers.some((marker) => line.includes(marker));
}

export function markerBuffers(...markers: string[]): Buffer[] {
  return markers.map((marker) => Buffer.from(marker));
}

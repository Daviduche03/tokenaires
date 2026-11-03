export type JsonObject = Record<string, unknown>;

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
  const next = value[key];
  if (typeof next !== 'number' || !Number.isFinite(next) || next <= 0) return 0;
  return Math.floor(next);
}

export function isoTime(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

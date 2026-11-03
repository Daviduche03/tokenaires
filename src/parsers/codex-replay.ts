const MAX_GAP_MS = 1000;
const MAX_WINDOW_MS = 5000;
const HEAD_BYTES = 96;
const HEAD_TIMESTAMP = /^\{"timestamp":"([^"]+)"/;

export interface ReplayWindow {
  startedAt: number;
  lastAt: number;
  active: boolean;
}

export function openReplayWindow(timestamp: unknown): ReplayWindow | null {
  if (typeof timestamp !== 'string') return null;
  const startedAt = Date.parse(timestamp);
  return Number.isFinite(startedAt) ? { startedAt, lastAt: startedAt, active: true } : null;
}

export function isReplayed(window: ReplayWindow | null, timestamp: unknown): boolean {
  if (!window?.active || typeof timestamp !== 'string') return false;
  const at = Date.parse(timestamp);
  if (!Number.isFinite(at)) return false;
  if (at < window.startedAt) return true;
  if (at - window.startedAt > MAX_WINDOW_MS) {
    window.active = false;
    return false;
  }
  if (at < window.lastAt) return true;
  if (at - window.lastAt > MAX_GAP_MS) {
    window.active = false;
    return false;
  }
  window.lastAt = at;
  return true;
}

export function headTimestamp(line: Buffer): string | null {
  const head = line.subarray(0, HEAD_BYTES).toString('utf8');
  return HEAD_TIMESTAMP.exec(head)?.[1] ?? null;
}

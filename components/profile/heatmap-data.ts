import { HEATMAP_WEEKS } from "@/lib/constants";

export interface HeatmapCell {
  day: string;
  tokens: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

const DAY_MS = 86_400_000;

function levelFor(tokens: number, thresholds: number[]): HeatmapCell["level"] {
  if (tokens <= 0) return 0;
  if (tokens <= thresholds[0]) return 1;
  if (tokens <= thresholds[1]) return 2;
  if (tokens <= thresholds[2]) return 3;
  return 4;
}

export function buildHeatmap(daily: Array<{ day: string; tokens: number }>, today: Date): HeatmapCell[][] {
  const byDay = new Map(daily.map((entry) => [entry.day, entry.tokens]));
  const values = daily.map((entry) => entry.tokens).filter((value) => value > 0).sort((a, b) => a - b);
  const quantile = (q: number) => values[Math.floor((values.length - 1) * q)] ?? 0;
  const thresholds = [quantile(0.25), quantile(0.5), quantile(0.75)];
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const end = todayUtc + (6 - new Date(todayUtc).getUTCDay()) * DAY_MS;
  const start = end - (HEATMAP_WEEKS * 7 - 1) * DAY_MS;
  const weeks: HeatmapCell[][] = [];
  for (let week = 0; week < HEATMAP_WEEKS; week += 1) {
    const cells: HeatmapCell[] = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const time = start + (week * 7 + weekday) * DAY_MS;
      const day = new Date(time).toISOString().slice(0, 10);
      const tokens = byDay.get(day) ?? 0;
      cells.push({ day, tokens, level: levelFor(tokens, thresholds), future: time > todayUtc });
    }
    weeks.push(cells);
  }
  return weeks;
}

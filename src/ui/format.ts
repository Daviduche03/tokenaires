const UNITS = [
  { value: 1e3, suffix: 'K' },
  { value: 1e6, suffix: 'M' },
  { value: 1e9, suffix: 'B' },
  { value: 1e12, suffix: 'T' },
] as const;

const integer = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatInt(value: number): string {
  return integer.format(Math.round(value));
}

function scaled(abs: number, unit: number): string {
  const value = abs / unit;
  return value >= 100 ? value.toFixed(0) : value.toFixed(1).replace(/\.0$/, '');
}

export function formatCompact(value: number): string {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs < 1000) return `${sign}${formatInt(abs)}`;
  for (const [index, unit] of UNITS.entries()) {
    const text = scaled(abs, unit.value);
    const isLast = index === UNITS.length - 1;
    if (isLast || Number(text) < 1000) return `${sign}${text}${unit.suffix}`;
  }
  return `${sign}${formatInt(abs)}`;
}

export function formatPercent(ratio: number): string {
  const percent = ratio * 100;
  if (percent > 0 && percent < 0.1) return '<0.1%';
  return `${percent.toFixed(1)}%`;
}

export function formatDay(iso: string): string {
  return iso.slice(0, 10);
}

export function formatRank(rank: number | null): string {
  return rank === null ? 'unranked' : `#${formatInt(rank)}`;
}

export function plural(count: number, one: string, many: string): string {
  return `${formatInt(count)} ${count === 1 ? one : many}`;
}

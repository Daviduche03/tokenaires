import { nextTier, TIERS, type MeSummary } from '@tokenaires/contracts';
import { padEnd, visibleWidth } from '@/ui/ansi';
import { formatCompact, formatInt, formatPercent, formatRank } from '@/ui/format';
import { progressBar, symbols, theme } from '@/ui/theme';

const MIN_INNER = 44;
const MAX_INNER = 60;
const BOX_CHROME = 8;
const RANK_COLUMN = 16;
const PERCENT_ROOM = 9;

export function tierLabel(id: MeSummary['tier']): string {
  return TIERS.find((tier) => tier.id === id)?.label ?? id;
}

export function spread(left: string, right: string, width: number): string {
  const gap = Math.max(2, width - visibleWidth(left) - visibleWidth(right));
  return `${left}${' '.repeat(gap)}${right}`;
}

export function renderBox(lines: readonly string[], minInner: number, columns: number): string[] {
  const inner = Math.max(minInner, ...lines.map(visibleWidth));
  if (inner + BOX_CHROME > columns) return lines.map((line) => `  ${line}`.trimEnd());
  const { box } = symbols;
  const edge = (left: string, right: string): string => `  ${theme.dim(left + box.h.repeat(inner + 4) + right)}`;
  return [
    edge(box.tl, box.tr),
    ...lines.map((line) => `  ${theme.dim(box.v)}  ${padEnd(line, inner)}  ${theme.dim(box.v)}`),
    edge(box.bl, box.br),
  ];
}

export function cardWidth(columns: number): number {
  return Math.min(MAX_INNER, Math.max(MIN_INNER, columns - BOX_CHROME));
}

export interface TierProgress {
  ratio: number;
  next: string | null;
  remaining: number;
}

export function tierProgress(total: number): TierProgress {
  const next = nextTier(total);
  if (!next) return { ratio: 1, next: null, remaining: 0 };
  const index = TIERS.findIndex((tier) => tier.id === next.id);
  const floor = TIERS[index - 1]?.min ?? 0;
  const ratio = next.min > floor ? (total - floor) / (next.min - floor) : 0;
  return { ratio, next: next.label, remaining: next.min - total };
}

function rankRows(me: MeSummary): string[] {
  const ranks = [
    { value: me.ranks.all, label: 'all time' },
    { value: me.ranks.month, label: 'this month' },
    { value: me.ranks.week, label: 'this week' },
  ];
  const value = ranks
    .map((rank) => padEnd(rank.value === null ? theme.dim(formatRank(null)) : theme.strong(theme.accent(formatRank(rank.value))), RANK_COLUMN))
    .join('')
    .trimEnd();
  const label = theme.dim(ranks.map((rank) => rank.label.padEnd(RANK_COLUMN)).join('').trimEnd());
  return [value, label];
}

function progressRows(total: number, inner: number): string[] {
  const progress = tierProgress(total);
  if (!progress.next) return [`${theme.good(symbols.tick)} Top tier reached`];
  const bar = progressBar(progress.ratio, inner - PERCENT_ROOM);
  return [
    `${bar}  ${theme.strong(formatPercent(progress.ratio).padStart(6))}`,
    theme.dim(`${formatCompact(progress.remaining)} more tokens ${symbols.arrow} ${progress.next}`),
  ];
}

export function renderProfileCard(me: MeSummary, profile: string, columns: number): string[] {
  const inner = cardWidth(columns);
  const handle = theme.strong(`@${me.user.handle}`);
  const tier = theme.accent(tierLabel(me.tier));
  const tokens = `${theme.strong(theme.accent(formatCompact(me.totalTokens)))} tokens`;
  const lines = [
    spread(handle, tier, inner),
    spread(tokens, theme.dim(formatInt(me.totalTokens)), inner),
    '',
    ...rankRows(me),
    '',
    ...progressRows(me.totalTokens, inner),
  ];
  if (me.status === 'review') {
    lines.push('', `${theme.warn(symbols.warn)} Under review. Your rank shows once it clears.`);
  }
  return [...renderBox(lines, inner, columns), `  ${theme.dim(profile)}`];
}

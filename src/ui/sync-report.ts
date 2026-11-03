import { TIERS, type MeSummary, type RejectionReason } from '@tokenaires/contracts';
import type { SyncTotals } from '@/ingest-totals';
import { formatCompact, formatInt, formatRank } from '@/ui/format';
import { renderTable, type Column, type Row } from '@/ui/table';
import { theme } from '@/ui/theme';

const REASON_LABELS: Record<RejectionReason, string> = {
  invalid_record_id: 'invalid record id',
  future_timestamp: 'timestamp in the future',
  before_source_launch: 'older than the agent itself',
  before_model_release: 'older than the model release',
  claimed_by_other_user: 'already claimed by another account',
  implausible_ratio: 'implausible token ratio',
};

export function tierLabel(id: MeSummary['tier']): string {
  return TIERS.find((tier) => tier.id === id)?.label ?? id;
}

export function renderSyncReport(totals: SyncTotals, me: MeSummary, profile: string): string[] {
  const columns: Column[] = [
    { header: 'Result', align: 'left' },
    { header: 'Records', align: 'right' },
  ];
  const rows: Row[] = [
    { cells: ['Accepted', formatInt(totals.accepted)], paint: theme.good },
    { cells: ['Already synced', formatInt(totals.duplicates)] },
  ];
  for (const [reason, count] of totals.rejected) {
    if (count > 0) rows.push({ cells: [`Rejected: ${REASON_LABELS[reason]}`, formatInt(count)], paint: theme.warn });
  }
  if (totals.invalid > 0) rows.push({ cells: ['Skipped locally (out of range)', formatInt(totals.invalid)], paint: theme.dim });
  const lines = ['', ...renderTable(columns, rows, theme.dim), ''];
  if (totals.acceptedTokens > 0) lines.push(`  ${theme.good('+')} ${formatCompact(totals.acceptedTokens)} new tokens counted`);
  if (totals.underReview) lines.push(`  ${theme.warn('Your account is under review.')} Your rank shows again once it clears.`);
  lines.push(
    `  ${theme.strong(`@${me.user.handle}`)}  ${tierLabel(me.tier)}  ${formatCompact(me.totalTokens)} tokens`,
    `  Rank ${theme.strong(formatRank(me.ranks.all))} all time   ${formatRank(me.ranks.month)} this month   ${formatRank(me.ranks.week)} this week`,
    theme.dim(`  ${profile}`),
    '',
  );
  return lines;
}

import type { MeSummary, RejectionReason } from '@tokenaires/contracts';
import type { Context } from '@/context';
import type { SyncTotals } from '@/ingest-totals';
import { renderProfileCard } from '@/ui/card';
import { formatCompact, formatInt } from '@/ui/format';
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

function resultRows(totals: SyncTotals): Row[] {
  const rows: Row[] = [
    { cells: ['Accepted', formatInt(totals.accepted)], paint: totals.accepted > 0 ? theme.good : undefined },
    { cells: ['Already synced', formatInt(totals.duplicates)], paint: theme.dim },
  ];
  for (const [reason, count] of totals.rejected) {
    if (count > 0) rows.push({ cells: [`Rejected: ${REASON_LABELS[reason]}`, formatInt(count)], paint: theme.warn });
  }
  if (totals.invalid > 0) rows.push({ cells: ['Skipped locally (out of range)', formatInt(totals.invalid)], paint: theme.dim });
  return rows;
}

export function renderSyncReport(ctx: Context, totals: SyncTotals, me: MeSummary, profile: string): string[] {
  const lines = [''];
  if (totals.sent > 0) {
    const columns: Column[] = [
      { header: 'Result', align: 'left' },
      { header: 'Records', align: 'right' },
    ];
    lines.push(...renderTable(columns, resultRows(totals), theme.dim), '');
  }
  if (totals.acceptedTokens > 0) {
    lines.push(`  ${theme.good(`+${formatCompact(totals.acceptedTokens)}`)} new tokens counted`, '');
  }
  if (totals.underReview && me.status !== 'review') {
    lines.push(`  ${theme.warn('Your account is under review.')} Your rank shows again once it clears.`, '');
  }
  lines.push(...renderProfileCard(me, profile, ctx.term.width()), '');
  return lines;
}

import { AGENT_SOURCE_LABELS, type AgentSource } from '@tokenaires/contracts';
import type { ScanSummary, TokenTotals } from '@/summary';
import { formatCompact, formatDay, formatInt, formatPercent, plural } from '@/ui/format';
import { renderTable, type Column, type Row } from '@/ui/table';
import { theme } from '@/ui/theme';

const COLUMNS: Column[] = [
  { header: 'Source', align: 'left' },
  { header: 'Records', align: 'right' },
  { header: 'Input', align: 'right' },
  { header: 'Output', align: 'right' },
  { header: 'Cache read', align: 'right' },
  { header: 'Cache write', align: 'right' },
  { header: 'Total', align: 'right' },
];

function cells(label: string, totals: TokenTotals): string[] {
  return [
    label,
    formatInt(totals.records),
    formatCompact(totals.input),
    formatCompact(totals.output),
    formatCompact(totals.cacheRead),
    formatCompact(totals.cacheWrite),
    formatCompact(totals.total),
  ];
}

export function renderScanReport(summary: ScanSummary, sources: readonly AgentSource[]): string[] {
  const rows: Row[] = sources.map((source) => ({
    cells: cells(AGENT_SOURCE_LABELS[source], summary.bySource[source]),
  }));
  rows.push({ cells: cells('All sources', summary.overall), paint: theme.strong });
  const lines = ['', ...renderTable(COLUMNS, rows, theme.dim), ''];
  if (summary.topModels.length > 0) {
    const modelRows = summary.topModels.map((model) => ({
      cells: [model.model, formatCompact(model.total), formatPercent(model.share)],
    }));
    const modelColumns: Column[] = [
      { header: 'Top models', align: 'left' },
      { header: 'Tokens', align: 'right' },
      { header: 'Share', align: 'right' },
    ];
    lines.push(...renderTable(modelColumns, modelRows, theme.dim), '');
  }
  lines.push(`  ${theme.strong(formatInt(summary.overall.total))} tokens across ${plural(summary.overall.records, 'record', 'records')}`);
  if (summary.firstAt && summary.lastAt) {
    lines.push(theme.dim(`  From ${formatDay(summary.firstAt)} to ${formatDay(summary.lastAt)}`));
  }
  if (summary.overall.reasoning > 0) {
    lines.push(theme.dim(`  Reasoning tokens (already inside output): ${formatCompact(summary.overall.reasoning)}`));
  }
  return lines;
}

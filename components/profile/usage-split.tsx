import { AGENT_SOURCE_LABELS, type ProfileResponse } from "@tokenaires/contracts";
import type { ReactNode } from "react";
import { SourceIcon } from "@/components/brand/source-icon";
import { formatCompact, formatFull } from "@/lib/format";

function sharePercent(tokens: number, total: number): string {
  if (total <= 0 || tokens <= 0) return "";
  const percent = Math.round((tokens / total) * 100);
  return percent < 1 ? "<1%" : `${percent}%`;
}

interface LedgerRow {
  key: string;
  label: ReactNode;
  tokens: number;
}

function Ledger({ title, rows, total }: { title: string; rows: LedgerRow[]; total: number }) {
  return (
    <section aria-label={title} className="panel p-5 sm:p-6">
      <h2 className="text-base font-medium tracking-[-0.02em]">{title}</h2>
      <ul className="mt-4 flex flex-col gap-3.5">
        {rows.map((row) => (
          <li key={row.key}>
            <span className="flex items-center gap-3 text-sm">
              <span className="flex min-w-0 flex-1 items-center gap-2 truncate text-t2">{row.label}</span>
              <span className="w-10 text-right text-xs text-t4 tabular">{sharePercent(row.tokens, total)}</span>
              <span className="w-14 text-right font-medium tabular" title={formatFull(row.tokens)}>{formatCompact(row.tokens)}</span>
            </span>
            <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-foreground/[0.07]" aria-hidden="true">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(1, (row.tokens / total) * 100)}%` }} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function UsageSplit({ profile }: { profile: ProfileResponse }) {
  const total = profile.totals.total;
  if (total === 0) return null;
  const tools = profile.bySource.map((entry) => ({
    key: entry.source,
    label: (
      <>
        <SourceIcon source={entry.source} />
        {AGENT_SOURCE_LABELS[entry.source]}
      </>
    ),
    tokens: entry.tokens,
  }));
  const models = profile.byModel.map((entry) => ({
    key: entry.model,
    label: <span className="truncate font-mono text-xs">{entry.model}</span>,
    tokens: entry.tokens,
  }));
  return (
    <div className="mt-3 grid items-start gap-3 sm:grid-cols-2">
      <Ledger title="Tools" rows={tools} total={total} />
      <Ledger title="Top models" rows={models} total={total} />
    </div>
  );
}

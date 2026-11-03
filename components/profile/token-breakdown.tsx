import type { TokenBreakdown as Breakdown } from "@tokenaires/contracts";
import { formatCompact, formatFull } from "@/lib/format";

const PARTS = [
  { key: "cacheRead", label: "Cache reads", tone: "bg-accent" },
  { key: "cacheWrite", label: "Cache writes", tone: "bg-accent/55" },
  { key: "input", label: "Input", tone: "bg-foreground/45" },
  { key: "output", label: "Output", tone: "bg-foreground" },
] as const;

export function TokenBreakdown({ totals }: { totals: Breakdown }) {
  if (totals.total === 0) return null;
  return (
    <div className="mt-6 border-t border-line pt-5">
      <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
        {PARTS.map((part) => (
          <span key={part.key} className={`${part.tone} min-w-1 rounded-full`} style={{ width: `${(totals[part.key] / totals.total) * 100}%` }} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {PARTS.map((part) => (
          <div key={part.key}>
            <dt className="flex items-center gap-2 text-xs text-t3">
              <span className={`size-2 shrink-0 rounded-full ${part.tone}`} aria-hidden="true" />
              {part.label}
            </dt>
            <dd className="mt-1 text-sm font-medium tabular" title={formatFull(totals[part.key])}>
              {formatCompact(totals[part.key])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

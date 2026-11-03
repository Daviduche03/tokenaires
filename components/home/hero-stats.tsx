"use client";

import NumberFlow from "@number-flow/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/use-board";

const COMPACT = { notation: "compact", maximumFractionDigits: 1 } as const;
const LABELS = [
  { short: "Developers", long: "Developers" },
  { short: "Tokens", long: "Tokens ranked" },
  { short: "Last 24h", long: "Last 24 hours" },
] as const;

export function HeroStats() {
  const { data, isPending, isError } = useStats();
  if (isError) return null;
  const values = data ? [data.developers, data.totalTokens, data.tokensLast24h] : null;
  return (
    <dl className="panel grid grid-cols-3 divide-x divide-line">
      {LABELS.map((label, index) => (
        <div key={label.long} className="px-3 py-5 text-center sm:px-6">
          <dt className="label">
            <span className="sm:hidden">{label.short}</span>
            <span className="hidden sm:inline">{label.long}</span>
          </dt>
          <dd className="mt-2 text-[24px] font-[450] leading-none tracking-[-0.03em] tabular sm:text-[34px]">
            {isPending || !values ? (
              <Skeleton className="mx-auto h-6 w-16 sm:h-8 sm:w-24" />
            ) : (
              <NumberFlow value={values[index]} format={index === 0 ? undefined : COMPACT} />
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

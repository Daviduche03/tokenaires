"use client";

import NumberFlow from "@number-flow/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/use-board";

const COMPACT = { notation: "compact", maximumFractionDigits: 1 } as const;

export function BoardSummary() {
  const { data, isPending, isError } = useStats();
  if (isError) return null;
  if (isPending) return <Skeleton className="mt-1.5 h-3 w-52" />;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-t3 tabular">
      <span>
        <NumberFlow value={data.developers} className="font-medium text-t2" /> {data.developers === 1 ? "developer" : "developers"}
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <NumberFlow value={data.totalTokens} format={COMPACT} className="font-medium text-t2" /> tokens
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <NumberFlow value={data.tokensLast24h} format={COMPACT} className="font-medium text-accent-text" /> in the last 24h
      </span>
    </p>
  );
}

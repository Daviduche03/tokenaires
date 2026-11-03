"use client";

import type { BoardEntry } from "@tokenaires/contracts";
import { UserPlusRoundedIcon } from "@solar-icons/react/linear";
import { motion } from "motion/react";
import Link from "next/link";
import { TierBadge } from "@/components/brand/tier-badge";
import { Avatar } from "@/components/ui/avatar";
import { formatCompact, formatFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import { LADDER } from "./ladder";
import { ShareBar } from "./share-bar";

function RankChip({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-semibold tabular",
        rank === 1 ? "bg-accent text-accent-ink" : "bg-foreground/[0.08] text-t2",
      )}
    >
      #{rank}
    </span>
  );
}

function Step({ rank, height }: { rank: number; height: string }) {
  const first = rank === 1;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative hidden overflow-hidden rounded-b-[var(--radius-card)] border-x border-b sm:block",
        height,
        first
          ? "border-accent/40 bg-[linear-gradient(180deg,hsl(var(--glow)/0.22),hsl(var(--glow)/0.04))]"
          : "border-line bg-[linear-gradient(180deg,hsl(var(--foreground)/0.06),hsl(var(--foreground)/0.015))]",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[44px] font-[300] leading-none tracking-[-0.06em] tabular",
          first ? "text-accent-text" : "text-t4",
          rank === 3 && "text-[28px]",
        )}
      >
        {rank}
      </span>
    </div>
  );
}

function OpenCard({ rank }: { rank: number }) {
  return (
    <div className="flex min-h-[168px] flex-col justify-between rounded-[var(--radius-card)] border border-dashed border-line-strong p-4 sm:rounded-b-none">
      <RankChip rank={rank} />
      <span className="flex items-center gap-2 text-sm text-t3">
        <UserPlusRoundedIcon className="size-4" aria-hidden="true" />
        Open seat
      </span>
    </div>
  );
}

function Card({ entry, leader }: { entry: BoardEntry; leader: number }) {
  const name = entry.user.name ?? entry.user.handle;
  const first = entry.rank === 1;
  return (
    <Link
      href={`/u/${entry.user.handle}`}
      aria-label={`${name}, rank ${entry.rank}, ${formatFull(entry.tokens)} tokens`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-panel-raised p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong sm:rounded-b-none",
        first && "border-accent/40 hover:border-accent/70",
      )}
    >
      {first && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,hsl(var(--glow)/0.16),transparent_70%)]"
        />
      )}
      <span className="relative flex items-center justify-between">
        <RankChip rank={entry.rank} />
        <TierBadge tier={entry.tier} />
      </span>
      <span className="relative mt-4 flex items-center gap-3">
        <Avatar src={entry.user.avatarUrl} name={name} size={first ? 48 : 40} priority />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{name}</span>
          <span className="block truncate text-xs text-t3">@{entry.user.handle}</span>
        </span>
      </span>
      <span className="relative mt-5 flex items-baseline gap-1.5">
        <span
          className={cn("font-[450] leading-none tracking-[-0.04em] tabular", first ? "text-[32px]" : "text-[26px]")}
          title={`${formatFull(entry.tokens)} tokens`}
        >
          {formatCompact(entry.tokens)}
        </span>
        <span className="text-xs text-t3">tokens</span>
      </span>
      <ShareBar tokens={entry.tokens} leader={leader} className="relative mt-3" />
    </Link>
  );
}

export function TopThree({ entries, leader }: { entries: BoardEntry[]; leader: number }) {
  return (
    <ol aria-label="Top three" className="grid gap-3 sm:grid-cols-3 sm:items-end">
      {LADDER.map(({ rank, step, order, delay }) => {
        const entry = entries.find((candidate) => candidate.rank === rank);
        return (
          <motion.li
            key={entry?.user.handle ?? `open-${rank}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
            className={cn("flex flex-col", order)}
          >
            {entry ? <Card entry={entry} leader={leader} /> : <OpenCard rank={rank} />}
            <Step rank={rank} height={step} />
          </motion.li>
        );
      })}
    </ol>
  );
}

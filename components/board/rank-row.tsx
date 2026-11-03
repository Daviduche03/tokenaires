import type { BoardEntry } from "@tokenaires/contracts";
import { ShieldWarningIcon } from "@solar-icons/react/linear";
import Link from "next/link";
import { SourceIcon } from "@/components/brand/source-icon";
import { TierBadge } from "@/components/brand/tier-badge";
import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { formatCompact, formatFull } from "@/lib/format";
import { Movement } from "./movement";
import { ShareBar } from "./share-bar";

export const ROW_GRID =
  "grid grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-x-3 md:grid-cols-[3.25rem_minmax(0,1fr)_4rem_7.5rem_10rem_8.5rem]";

export function RankHeader() {
  return (
    <div className={`${ROW_GRID} label px-3 pb-2`} aria-hidden="true">
      <span>Rank</span>
      <span>Developer</span>
      <span className="hidden md:block">Tools</span>
      <span className="hidden md:block">Tier</span>
      <span className="hidden md:block">Vs No. 1</span>
      <span className="text-right">Net worth</span>
    </div>
  );
}

export function RankRow({ entry, leader, showMovement }: { entry: BoardEntry; leader: number; showMovement: boolean }) {
  const name = entry.user.name ?? entry.user.handle;
  return (
    <li className={`${ROW_GRID} rounded-[14px] px-3 transition-colors duration-150 hover:bg-foreground/[0.035]`}>
      <span className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-t2 tabular">{entry.rank}</span>
        {showMovement && <Movement change={entry.change} className="text-[10px]" />}
      </span>
      <Link href={`/u/${entry.user.handle}`} className="group flex min-h-14 min-w-0 items-center gap-3 py-2">
        <Avatar src={entry.user.avatarUrl} name={name} size={32} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium transition-colors group-hover:text-accent-text">{name}</span>
            {entry.status === "review" && (
              <Tooltip label="Under review for unusual activity">
                <span tabIndex={0} className="inline-flex shrink-0 rounded-full text-warn" aria-label="Under review">
                  <ShieldWarningIcon className="size-3.5" aria-hidden="true" />
                </span>
              </Tooltip>
            )}
          </span>
          <span className="block truncate text-xs text-t3">@{entry.user.handle}</span>
        </span>
      </Link>
      <span className="hidden items-center gap-2 md:flex">
        {entry.sources.map((source) => (
          <SourceIcon key={source} source={source} />
        ))}
      </span>
      <span className="hidden md:block">
        <TierBadge tier={entry.tier} />
      </span>
      <ShareBar tokens={entry.tokens} leader={leader} className="hidden md:block" />
      <span className="text-right text-sm font-medium tabular" title={`${formatFull(entry.tokens)} tokens`}>
        <span className="md:hidden">{formatCompact(entry.tokens)}</span>
        <span className="hidden md:inline">{formatFull(entry.tokens)}</span>
      </span>
    </li>
  );
}

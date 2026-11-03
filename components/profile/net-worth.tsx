import { nextTier, TIERS, type ProfileResponse } from "@tokenaires/contracts";
import { GlowSurface } from "@/components/motion/glow-surface";
import { RollingNumber } from "@/components/motion/rolling-number";
import { PERIOD_LABELS } from "@/lib/constants";
import { formatCompact, formatFull } from "@/lib/format";
import { TokenBreakdown } from "./token-breakdown";

const RANK_ORDER = ["all", "month", "week"] as const;

function TierProgress({ total }: { total: number }) {
  const upcoming = nextTier(total);
  if (!upcoming || total === 0) return null;
  const current = [...TIERS].reverse().find((tier) => tier.min <= total) ?? TIERS[0];
  const progress = (total - current.min) / (upcoming.min - current.min);
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between text-xs text-t3">
        <span>{current.label}</span>
        <span>
          {formatCompact(upcoming.min - total)} more to <span className="text-foreground">{upcoming.label}</span>
        </span>
      </div>
      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-foreground/[0.07]" aria-hidden="true">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.min(100, Math.max(1, progress * 100))}%` }} />
      </span>
    </div>
  );
}

export function NetWorth({ profile }: { profile: ProfileResponse }) {
  return (
    <GlowSurface className="mt-8 rounded-[var(--radius-panel)]" radius={420}>
    <section aria-label="Net worth" className="panel relative overflow-hidden bg-[radial-gradient(55%_70%_at_100%_0%,hsl(var(--glow)/0.12),transparent_70%)] p-5 sm:p-7">
      <p className="label relative">Net worth</p>
      <p className="relative mt-2 break-all text-[42px] font-[350] leading-none tracking-[-0.05em] tabular sm:text-[64px]">
        <RollingNumber value={profile.totals.total} />
        <span className="ml-2 align-baseline text-base tracking-normal text-t3">tokens</span>
      </p>
      <div className="relative">
        <TierProgress total={profile.totals.total} />
      </div>
      <dl className="relative mt-6 grid grid-cols-3 gap-2">
        {RANK_ORDER.map((period) => {
          const rank = profile.ranks[period];
          return (
            <div key={period} className="rounded-[var(--radius-card)] bg-panel-raised px-4 py-3">
              <dt className="label">{PERIOD_LABELS[period]}</dt>
              <dd className="mt-1 text-xl font-medium tracking-[-0.03em] tabular">
                {rank === null ? <span className="text-t4">Unranked</span> : `#${formatFull(rank)}`}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="relative">
        <TokenBreakdown totals={profile.totals} />
      </div>
    </section>
    </GlowSurface>
  );
}

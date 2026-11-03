import { TIERS, type TierId } from "@tokenaires/contracts";
import { cn } from "@/lib/utils";

const RICH: ReadonlySet<TierId> = new Set(["billionaire", "trillionaire"]);

export function tierLabel(tier: TierId): string {
  return TIERS.find((entry) => entry.id === tier)?.label ?? tier;
}

export function TierBadge({ tier, className }: { tier: TierId; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-t3",
        RICH.has(tier) && "bg-accent-soft text-accent-text",
        className,
      )}
    >
      {tierLabel(tier)}
    </span>
  );
}

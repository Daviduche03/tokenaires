import { formatCompact, formatDate, formatFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import { buildHeatmap } from "./heatmap-data";
import { ScrollToEnd } from "./scroll-to-end";

const LEVELS = [
  "bg-[hsl(var(--heat-0))]",
  "bg-accent/25",
  "bg-accent/45",
  "bg-accent/70",
  "bg-accent",
] as const;

interface ActivityHeatmapProps {
  daily: Array<{ day: string; tokens: number }>;
  streakDays: number;
  activeDays: number;
}

export function ActivityHeatmap({ daily, streakDays, activeDays }: ActivityHeatmapProps) {
  const cells = buildHeatmap(daily, new Date()).flat();
  return (
    <section aria-label="Daily activity" className="panel mt-3 p-5 sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-medium tracking-[-0.02em]">Activity</h2>
        <p className="text-xs text-t3 tabular">
          {streakDays > 0 ? `${formatFull(streakDays)} day streak · ` : ""}
          {formatFull(activeDays)} active {activeDays === 1 ? "day" : "days"}
        </p>
      </div>
      <ScrollToEnd className="mt-5 overflow-x-auto pb-1">
        <div
          role="img"
          aria-label="Tokens per day over the last year"
          className="grid min-w-[560px] grid-flow-col grid-rows-7 gap-[3px] [grid-auto-columns:minmax(0,1fr)]"
        >
          {cells.map((cell) => (
            <span
              key={cell.day}
              title={cell.future ? undefined : `${formatDate(cell.day)}: ${cell.tokens > 0 ? `${formatCompact(cell.tokens)} tokens` : "no usage"}`}
              className={cn("aspect-square rounded-[3px]", cell.future ? "opacity-0" : LEVELS[cell.level])}
            />
          ))}
        </div>
      </ScrollToEnd>
    </section>
  );
}

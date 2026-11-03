import { cn } from "@/lib/utils";

export function Movement({ change, className }: { change: number | null; className?: string }) {
  if (change === null || change === 0) return null;
  const up = change > 0;
  return (
    <span
      className={cn("font-medium tabular", up ? "text-up" : "text-down", className)}
      aria-label={`${up ? "Up" : "Down"} ${Math.abs(change)} this week`}
    >
      {up ? "▲" : "▼"}
      {Math.abs(change)}
    </span>
  );
}

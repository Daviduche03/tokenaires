import { shareOfLeader } from "@/lib/share";
import { cn } from "@/lib/utils";

export function ShareBar({ tokens, leader, className }: { tokens: number; leader: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn("block h-1 overflow-hidden rounded-full bg-foreground/[0.07]", className)}>
      <span className="block h-full rounded-full bg-accent" style={{ width: `${shareOfLeader(tokens, leader) * 100}%` }} />
    </span>
  );
}

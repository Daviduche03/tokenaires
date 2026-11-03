import { cn } from "@/lib/utils";

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[16px] font-[650] tracking-[-0.03em]", className)}>
      <span className="grid size-5 place-items-center rounded-[6px] bg-accent text-[11px] font-bold text-accent-ink" aria-hidden="true">
        T
      </span>
      tokenaires
    </span>
  );
}

import type { AgentSource } from "@tokenaires/contracts";
import { AGENT_SOURCE_LABELS } from "@tokenaires/contracts";
import type { CSSProperties } from "react";
import { SourceIcon } from "@/components/brand/source-icon";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function agentList(sources: AgentSource[]) {
  return new Intl.ListFormat("en", { type: "conjunction" }).format(
    sources.map((source) => AGENT_SOURCE_LABELS[source]),
  );
}

export function AgentStack({ sources, className }: { sources: AgentSource[]; className?: string }) {
  if (sources.length === 0) return null;
  const label = agentList(sources);
  return (
    <Tooltip label={label}>
      <span className={cn("flex shrink-0 items-center", className)}>
        {sources.map((source, index) => (
          <span
            key={source}
            aria-hidden="true"
            style={{ "--fan": `${(sources.length - 1 - index) * -4}px`, zIndex: sources.length - index } as CSSProperties}
            className="relative -ml-2 flex size-7 items-center justify-center rounded-full border border-line-strong bg-panel ring-2 ring-panel-raised transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] first:ml-0 group-hover:[transform:translateX(var(--fan))]"
          >
            <SourceIcon source={source} />
          </span>
        ))}
      </span>
    </Tooltip>
  );
}

export function AgentStackCompact({ sources, max = 3, className }: { sources: AgentSource[]; max?: number; className?: string }) {
  if (sources.length === 0) return null;
  const shown = sources.slice(0, max);
  const extra = sources.length - shown.length;
  return (
    <span aria-hidden="true" className={cn("flex shrink-0 items-center", className)}>
      {shown.map((source, index) => (
        <span
          key={source}
          style={{ zIndex: shown.length - index }}
          className="relative -ml-1.5 flex size-5 items-center justify-center rounded-full border border-line-strong bg-panel ring-[1.5px] ring-panel-raised first:ml-0"
        >
          <SourceIcon source={source} className="size-3" />
        </span>
      ))}
      {extra > 0 && (
        <span className="relative -ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-line-strong bg-panel px-1 text-[9px] font-medium text-t3 ring-[1.5px] ring-panel-raised tabular">
          +{extra}
        </span>
      )}
    </span>
  );
}

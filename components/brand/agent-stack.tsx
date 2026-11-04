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

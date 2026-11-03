import type { AgentSource } from "@tokenaires/contracts";
import { AGENT_SOURCE_LABELS } from "@tokenaires/contracts";
import { RiOpenaiFill } from "react-icons/ri";
import { SiClaude } from "react-icons/si";
import { cn } from "@/lib/utils";

const ICONS = { "claude-code": SiClaude, codex: RiOpenaiFill } as const;
const TINTS = { "claude-code": "text-claude", codex: "text-t2" } as const;

export function SourceIcon({ source, className }: { source: AgentSource; className?: string }) {
  const Icon = ICONS[source];
  return <Icon className={cn("size-3.5 shrink-0", TINTS[source], className)} aria-label={AGENT_SOURCE_LABELS[source]} role="img" />;
}

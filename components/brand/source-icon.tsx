import type { AgentSource } from "@tokenaires/contracts";
import { AGENT_SOURCE_LABELS } from "@tokenaires/contracts";
import type { IconType } from "react-icons";
import { RiOpenaiFill } from "react-icons/ri";
import { SiClaude, SiGoogle, SiGooglegemini, SiOpencode } from "react-icons/si";
import { cn } from "@/lib/utils";

const ICONS: Record<AgentSource, IconType> = {
  "claude-code": SiClaude,
  codex: RiOpenaiFill,
  "gemini-cli": SiGooglegemini,
  antigravity: SiGoogle,
  opencode: SiOpencode,
};

const TINTS: Record<AgentSource, string> = {
  "claude-code": "text-claude",
  codex: "text-t2",
  "gemini-cli": "text-gemini",
  antigravity: "text-gemini",
  opencode: "text-t2",
};

export function SourceIcon({ source, className }: { source: AgentSource; className?: string }) {
  const Icon = ICONS[source];
  return <Icon className={cn("size-3.5 shrink-0", TINTS[source], className)} aria-label={AGENT_SOURCE_LABELS[source]} role="img" />;
}

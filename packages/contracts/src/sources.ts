import { z } from 'zod';

export const AGENT_SOURCES = ['claude-code', 'codex'] as const;

export const AgentSourceSchema = z.enum(AGENT_SOURCES);
export type AgentSource = z.infer<typeof AgentSourceSchema>;

export const AGENT_SOURCE_LABELS: Record<AgentSource, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
};

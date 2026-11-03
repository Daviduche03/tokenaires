import type { AgentSource, UsageRecord } from '@tokenaires/contracts';

export interface SourceContext {
  env: NodeJS.ProcessEnv;
  home: string;
  platform: NodeJS.Platform;
}

export interface LogSource {
  source: AgentSource;
  discover(ctx: SourceContext): Promise<string[]>;
  parse(path: string): Promise<UsageRecord[] | null>;
  signature?(path: string): Promise<string | null>;
}

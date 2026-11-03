import { AGENT_SOURCES, type AgentSource, type UsageRecord } from '@tokenaires/contracts';

export interface TokenTotals {
  records: number;
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  reasoning: number;
  total: number;
}

export interface ModelTotal {
  model: string;
  total: number;
  share: number;
}

export interface ScanSummary {
  bySource: Record<AgentSource, TokenTotals>;
  overall: TokenTotals;
  topModels: ModelTotal[];
  firstAt: string | null;
  lastAt: string | null;
}

export function emptyTotals(): TokenTotals {
  return { records: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0, total: 0 };
}

export function recordTotal(record: UsageRecord): number {
  return record.inputTokens + record.outputTokens + record.cacheReadTokens + record.cacheWriteTokens;
}

function add(totals: TokenTotals, record: UsageRecord): void {
  totals.records += 1;
  totals.input += record.inputTokens;
  totals.output += record.outputTokens;
  totals.cacheRead += record.cacheReadTokens;
  totals.cacheWrite += record.cacheWriteTokens;
  totals.reasoning += record.reasoningTokens;
  totals.total += recordTotal(record);
}

export function summarize(records: readonly UsageRecord[], topLimit: number): ScanSummary {
  const bySource = Object.fromEntries(AGENT_SOURCES.map((source) => [source, emptyTotals()])) as Record<
    AgentSource,
    TokenTotals
  >;
  const overall = emptyTotals();
  const models = new Map<string, number>();
  let firstAt: string | null = null;
  let lastAt: string | null = null;
  for (const record of records) {
    add(bySource[record.source], record);
    add(overall, record);
    models.set(record.model, (models.get(record.model) ?? 0) + recordTotal(record));
    if (firstAt === null || record.occurredAt < firstAt) firstAt = record.occurredAt;
    if (lastAt === null || record.occurredAt > lastAt) lastAt = record.occurredAt;
  }
  const topModels = [...models.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topLimit)
    .map(([model, total]) => ({ model, total, share: overall.total > 0 ? total / overall.total : 0 }));
  return { bySource, overall, topModels, firstAt, lastAt };
}

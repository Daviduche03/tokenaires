import { z } from 'zod';
import { AgentSourceSchema } from './sources';

export const INGEST_LIMITS = {
  maxRecordsPerBatch: 2000,
  maxTokensPerField: 5_000_000,
  maxRecordIdLength: 160,
  maxModelLength: 120,
} as const;

const tokenCount = z
  .number()
  .int()
  .min(0)
  .max(INGEST_LIMITS.maxTokensPerField);

export const UsageRecordSchema = z.object({
  source: AgentSourceSchema,
  recordId: z.string().min(8).max(INGEST_LIMITS.maxRecordIdLength),
  model: z.string().min(1).max(INGEST_LIMITS.maxModelLength),
  occurredAt: z.iso.datetime(),
  inputTokens: tokenCount,
  outputTokens: tokenCount,
  cacheReadTokens: tokenCount,
  cacheWriteTokens: tokenCount,
  reasoningTokens: tokenCount,
});
export type UsageRecord = z.infer<typeof UsageRecordSchema>;

export const IngestBatchSchema = z.object({
  cliVersion: z.string().min(1).max(32),
  records: z.array(UsageRecordSchema).max(INGEST_LIMITS.maxRecordsPerBatch),
});
export type IngestBatch = z.infer<typeof IngestBatchSchema>;

export const REJECTION_REASONS = [
  'invalid_record_id',
  'future_timestamp',
  'before_source_launch',
  'before_model_release',
  'claimed_by_other_user',
  'implausible_ratio',
] as const;
export const RejectionReasonSchema = z.enum(REJECTION_REASONS);
export type RejectionReason = z.infer<typeof RejectionReasonSchema>;

export const IngestResultSchema = z.object({
  accepted: z.number().int(),
  duplicates: z.number().int(),
  rejected: z.array(
    z.object({ reason: RejectionReasonSchema, count: z.number().int() }),
  ),
  acceptedTokens: z.number(),
  underReview: z.boolean(),
});
export type IngestResult = z.infer<typeof IngestResultSchema>;

export const TokenBreakdownSchema = z.object({
  input: z.number(),
  output: z.number(),
  cacheRead: z.number(),
  cacheWrite: z.number(),
  reasoning: z.number(),
  total: z.number(),
});
export type TokenBreakdown = z.infer<typeof TokenBreakdownSchema>;

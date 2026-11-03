import { z } from 'zod';
import { AgentSourceSchema } from './sources';
import { PublicUserSchema } from './auth';
import { TierIdSchema } from './tiers';
import { TokenBreakdownSchema } from './usage';

export const BOARD_PERIODS = ['all', 'month', 'week'] as const;
export const BoardPeriodSchema = z.enum(BOARD_PERIODS);
export type BoardPeriod = z.infer<typeof BoardPeriodSchema>;

export const BoardSourceSchema = z.union([z.literal('all'), AgentSourceSchema]);
export type BoardSource = z.infer<typeof BoardSourceSchema>;

export const BOARD_PAGE_SIZE = 50;

export const ACCOUNT_STATUSES = ['ok', 'review'] as const;
export const AccountStatusSchema = z.enum(ACCOUNT_STATUSES);
export type AccountStatus = z.infer<typeof AccountStatusSchema>;

export const BoardEntrySchema = z.object({
  rank: z.number().int(),
  change: z.number().int().nullable(),
  user: PublicUserSchema,
  tokens: z.number(),
  outputTokens: z.number(),
  tier: TierIdSchema,
  sources: z.array(AgentSourceSchema),
  status: AccountStatusSchema,
});
export type BoardEntry = z.infer<typeof BoardEntrySchema>;

export const BoardResponseSchema = z.object({
  period: BoardPeriodSchema,
  source: BoardSourceSchema,
  generatedAt: z.iso.datetime(),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalEntries: z.number().int(),
  leaderTokens: z.number(),
  entries: z.array(BoardEntrySchema),
});
export type BoardResponse = z.infer<typeof BoardResponseSchema>;

export const GlobalStatsSchema = z.object({
  developers: z.number().int(),
  totalTokens: z.number(),
  tokensLast24h: z.number(),
  generatedAt: z.iso.datetime(),
});
export type GlobalStats = z.infer<typeof GlobalStatsSchema>;

export const ProfileRanksSchema = z.object({
  all: z.number().int().nullable(),
  month: z.number().int().nullable(),
  week: z.number().int().nullable(),
});
export type ProfileRanks = z.infer<typeof ProfileRanksSchema>;

export const ProfileResponseSchema = z.object({
  user: PublicUserSchema,
  joinedAt: z.iso.datetime(),
  lastSyncedAt: z.iso.datetime().nullable(),
  tier: TierIdSchema,
  status: AccountStatusSchema,
  totals: TokenBreakdownSchema,
  ranks: ProfileRanksSchema,
  bySource: z.array(z.object({ source: AgentSourceSchema, tokens: z.number() })),
  byModel: z.array(z.object({ model: z.string(), tokens: z.number() })),
  daily: z.array(z.object({ day: z.string(), tokens: z.number() })),
  streakDays: z.number().int(),
  activeDays: z.number().int(),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const MeSummarySchema = z.object({
  user: PublicUserSchema,
  tier: TierIdSchema,
  status: AccountStatusSchema,
  totalTokens: z.number(),
  ranks: ProfileRanksSchema,
  cursors: z.array(
    z.object({ source: AgentSourceSchema, lastOccurredAt: z.iso.datetime().nullable() }),
  ),
});
export type MeSummary = z.infer<typeof MeSummarySchema>;

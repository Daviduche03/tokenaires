import {
  bigint,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { devices } from './devices';
import { users } from './users';

const tokens = (name: string) =>
  bigint(name, { mode: 'number' }).notNull().default(0);

export const usageRecords = pgTable(
  'usage_records',
  {
    source: text('source').notNull(),
    recordId: text('record_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deviceId: text('device_id').references(() => devices.id, {
      onDelete: 'set null',
    }),
    model: text('model').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    day: date('day', { mode: 'string' }).notNull(),
    inputTokens: tokens('input_tokens'),
    outputTokens: tokens('output_tokens'),
    cacheReadTokens: tokens('cache_read_tokens'),
    cacheWriteTokens: tokens('cache_write_tokens'),
    reasoningTokens: tokens('reasoning_tokens'),
    totalTokens: tokens('total_tokens'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.source, table.recordId] }),
    index('usage_records_user_time_idx').on(table.userId, table.occurredAt),
    index('usage_records_occurred_at_idx').on(table.occurredAt),
  ],
);

export const dailyUsage = pgTable(
  'daily_usage',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    day: date('day', { mode: 'string' }).notNull(),
    source: text('source').notNull(),
    model: text('model').notNull(),
    records: integer('records').notNull().default(0),
    inputTokens: tokens('input_tokens'),
    outputTokens: tokens('output_tokens'),
    cacheReadTokens: tokens('cache_read_tokens'),
    cacheWriteTokens: tokens('cache_write_tokens'),
    reasoningTokens: tokens('reasoning_tokens'),
    totalTokens: tokens('total_tokens'),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.day, table.source, table.model],
    }),
    index('daily_usage_day_idx').on(table.day),
  ],
);

export const flags = pgTable(
  'flags',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    detail: jsonb('detail').$type<Record<string, string | number>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  (table) => [index('flags_user_id_idx').on(table.userId)],
);

export type UsageRecordRow = typeof usageRecords.$inferInsert;
export type DailyUsageRow = typeof dailyUsage.$inferInsert;

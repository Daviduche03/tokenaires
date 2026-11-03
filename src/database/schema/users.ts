import {
  bigint,
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    githubId: bigint('github_id', { mode: 'number' }),
    handle: text('handle').notNull(),
    name: text('name'),
    avatarUrl: text('avatar_url'),
    country: text('country'),
    status: text('status', { enum: ['ok', 'review'] })
      .notNull()
      .default('ok'),
    hidden: boolean('hidden').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_github_id_key').on(table.githubId),
    uniqueIndex('users_handle_lower_key').on(sql`lower(${table.handle})`),
    index('users_created_at_idx').on(table.createdAt),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;

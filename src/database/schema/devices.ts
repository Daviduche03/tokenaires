import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const devices = pgTable(
  'devices',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    platform: text('platform').notNull(),
    publicKey: text('public_key').notNull(),
    tokenHash: text('token_hash').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('devices_token_hash_key').on(table.tokenHash),
    index('devices_user_id_idx').on(table.userId),
  ],
);

export const deviceSessions = pgTable('device_sessions', {
  id: text('id').primaryKey(),
  userCode: text('user_code').notNull(),
  githubDeviceCode: text('github_device_code'),
  status: text('status', {
    enum: ['pending', 'approved', 'complete', 'expired', 'denied'],
  })
    .notNull()
    .default('pending'),
  approvedUserId: text('approved_user_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  intervalSeconds: integer('interval_seconds').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const uploadSignatures = pgTable(
  'upload_signatures',
  {
    signature: text('signature').primaryKey(),
    deviceId: text('device_id')
      .notNull()
      .references(() => devices.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('upload_signatures_created_at_idx').on(table.createdAt)],
);

export type DeviceRow = typeof devices.$inferSelect;
export type DeviceSessionRow = typeof deviceSessions.$inferSelect;

import { z } from 'zod';
import { AgentSourceSchema } from './sources';

export const SIGNATURE_HEADERS = {
  device: 'x-tokenaires-device',
  timestamp: 'x-tokenaires-timestamp',
  signature: 'x-tokenaires-signature',
} as const;

export const SIGNATURE_MAX_SKEW_MS = 5 * 60 * 1000;

export const DeviceStartResponseSchema = z.object({
  sessionId: z.string(),
  userCode: z.string(),
  verificationUri: z.url(),
  expiresIn: z.number().int(),
  interval: z.number().int(),
});
export type DeviceStartResponse = z.infer<typeof DeviceStartResponseSchema>;

export const DevicePollRequestSchema = z.object({
  sessionId: z.string().min(1).max(64),
  publicKey: z.string().min(40).max(200),
  deviceName: z.string().min(1).max(80),
  platform: z.string().min(1).max(32),
});
export type DevicePollRequest = z.infer<typeof DevicePollRequestSchema>;

export const PublicUserSchema = z.object({
  handle: z.string(),
  name: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  country: z.string().nullable(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

export const DevicePollResponseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ status: z.literal('slow_down'), interval: z.number().int() }),
  z.object({ status: z.literal('expired') }),
  z.object({ status: z.literal('denied') }),
  z.object({
    status: z.literal('complete'),
    token: z.string(),
    deviceId: z.string(),
    user: PublicUserSchema,
  }),
]);
export type DevicePollResponse = z.infer<typeof DevicePollResponseSchema>;

export const SyncCursorSchema = z.object({
  source: AgentSourceSchema,
  lastOccurredAt: z.iso.datetime().nullable(),
});
export type SyncCursor = z.infer<typeof SyncCursorSchema>;

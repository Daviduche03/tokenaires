import { z } from 'zod';

export const TIERS = [
  { id: 'hopeful', label: 'Hopeful', min: 0 },
  { id: 'thousandaire', label: 'Thousandaire', min: 1_000 },
  { id: 'millionaire', label: 'Millionaire', min: 1_000_000 },
  { id: 'billionaire', label: 'Billionaire', min: 1_000_000_000 },
  { id: 'trillionaire', label: 'Trillionaire', min: 1_000_000_000_000 },
] as const;

export type TierId = (typeof TIERS)[number]['id'];
export const TierIdSchema = z.enum(TIERS.map((tier) => tier.id) as [TierId, ...TierId[]]);

export function tierFor(tokens: number): TierId {
  let current: TierId = TIERS[0].id;
  for (const tier of TIERS) {
    if (tokens >= tier.min) current = tier.id;
  }
  return current;
}

export function nextTier(tokens: number): (typeof TIERS)[number] | null {
  return TIERS.find((tier) => tier.min > tokens) ?? null;
}

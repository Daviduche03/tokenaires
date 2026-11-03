import { REJECTION_REASONS, type IngestResult, type RejectionReason } from '@tokenaires/contracts';

export interface SyncTotals {
  accepted: number;
  duplicates: number;
  acceptedTokens: number;
  rejected: Map<RejectionReason, number>;
  underReview: boolean;
  invalid: number;
  sent: number;
}

export function emptySyncTotals(invalid: number): SyncTotals {
  return { accepted: 0, duplicates: 0, acceptedTokens: 0, rejected: new Map(), underReview: false, invalid, sent: 0 };
}

export function addResult(totals: SyncTotals, result: IngestResult): void {
  totals.accepted += result.accepted;
  totals.duplicates += result.duplicates;
  totals.acceptedTokens += result.acceptedTokens;
  totals.underReview ||= result.underReview;
  totals.sent += 1;
  for (const item of result.rejected) {
    if (REJECTION_REASONS.includes(item.reason) && item.count > 0) {
      totals.rejected.set(item.reason, (totals.rejected.get(item.reason) ?? 0) + item.count);
    }
  }
}

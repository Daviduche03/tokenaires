import type { MeSummary } from '@tokenaires/contracts';
import { profileUrl, resolveApiUrl } from '@/config';
import type { Context } from '@/context';
import { createClient, type ApiClient } from '@/api/client';
import { fetchMe, uploadBatch } from '@/api/endpoints';
import { UsageError, NOT_LOGGED_IN_MESSAGE } from '@/api/errors';
import { withRateLimitRetry } from '@/api/retry';
import { addResult, emptySyncTotals, type SyncTotals } from '@/ingest-totals';
import { batchBodies, prepareRecords, selectForUpload } from '@/payload';
import { scanLocal } from '@/scan';
import { configPath, loadConfig, type StoredConfig } from '@/store';
import { renderSyncReport } from '@/ui/sync-report';
import { plural } from '@/ui/format';
import { theme } from '@/ui/theme';

export interface SyncOptions {
  quiet: boolean;
}

function uploadingLine(records: number, batches: number): string {
  if (records === 0) return '  Nothing new to upload.';
  return `  Uploading ${plural(records, 'record', 'records')} in ${plural(batches, 'batch', 'batches')}...`;
}

async function upload(ctx: Context, client: ApiClient, config: StoredConfig, me: MeSummary, quiet: boolean): Promise<SyncTotals> {
  const scanned = await scanLocal({ env: ctx.env, home: ctx.home });
  const prepared = prepareRecords(selectForUpload(scanned.records, me.cursors));
  const bodies = batchBodies(prepared.valid);
  const totals = emptySyncTotals(prepared.invalid);
  if (!quiet) ctx.out.line(theme.dim(uploadingLine(prepared.valid.length, bodies.length)));
  for (const body of bodies) {
    const result = await withRateLimitRetry(() => uploadBatch(client, config, body, ctx.now()), {
      sleep: (ms) => ctx.sleep(ms),
      onWait: (ms) => {
        if (!quiet) ctx.out.line(theme.dim(`  Rate limited, waiting ${Math.ceil(ms / 1000)}s...`));
      },
    });
    addResult(totals, result);
  }
  return totals;
}

export async function sync(ctx: Context, options: SyncOptions, existing?: StoredConfig): Promise<SyncTotals> {
  const config = existing ?? (await loadConfig(configPath(ctx.env, ctx.home)));
  if (!config) throw new UsageError(NOT_LOGGED_IN_MESSAGE);
  const client = createClient(resolveApiUrl(ctx.env, config.apiUrl), ctx.fetch);
  const before = await fetchMe(client, config.token);
  const totals = await upload(ctx, client, config, before, options.quiet);
  const after = totals.accepted > 0 ? await fetchMe(client, config.token) : before;
  if (!options.quiet) {
    for (const line of renderSyncReport(totals, after, profileUrl(ctx.env, after.user.handle))) ctx.out.line(line);
  }
  return totals;
}

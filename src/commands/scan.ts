import { TOP_MODELS_LIMIT } from '@/config';
import type { Context } from '@/context';
import { LOG_SOURCES, scanLocal } from '@/scan';
import { summarize } from '@/summary';
import { formatInt, plural } from '@/ui/format';
import { renderScanReport } from '@/ui/scan-report';
import { theme } from '@/ui/theme';

export async function scan(ctx: Context): Promise<void> {
  const started = ctx.now();
  const result = await scanLocal({ env: ctx.env, home: ctx.home, platform: ctx.platform });
  const summary = summarize(result.records, TOP_MODELS_LIMIT);
  const seconds = ((ctx.now() - started) / 1000).toFixed(1);
  ctx.out.line();
  ctx.out.line(`  ${theme.title('Local scan')} ${theme.dim('(dry run, nothing was uploaded)')}`);
  for (const line of renderScanReport(summary, LOG_SOURCES.map((source) => source.source))) ctx.out.line(line);
  const files = Object.values(result.files).reduce((sum, value) => sum + value, 0);
  const cached = result.cachedFiles > 0 ? `, ${formatInt(result.cachedFiles)} unchanged since the last scan` : '';
  ctx.out.line(theme.dim(`  Read ${plural(files, 'log file', 'log files')} in ${seconds}s${cached}`));
  ctx.out.line();
}


import { TOP_MODELS_LIMIT } from '@/config';
import type { Context } from '@/context';
import { scanLocal } from '@/scan';
import { summarize } from '@/summary';
import { plural } from '@/ui/format';
import { renderScanReport } from '@/ui/scan-report';
import { theme } from '@/ui/theme';

export async function scan(ctx: Context): Promise<void> {
  const started = ctx.now();
  const result = await scanLocal({ env: ctx.env, home: ctx.home });
  const summary = summarize(result.records, TOP_MODELS_LIMIT);
  const seconds = ((ctx.now() - started) / 1000).toFixed(1);
  ctx.out.line();
  ctx.out.line(`  ${theme.title('Local scan')} ${theme.dim('(dry run, nothing was uploaded)')}`);
  for (const line of renderScanReport(summary)) ctx.out.line(line);
  const files = result.files['claude-code'] + result.files.codex;
  ctx.out.line(theme.dim(`  Read ${plural(files, 'log file', 'log files')} in ${seconds}s`));
  ctx.out.line();
}


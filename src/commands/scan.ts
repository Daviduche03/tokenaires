import { TOP_MODELS_LIMIT } from '@/config';
import type { Context } from '@/context';
import { LOG_SOURCES, scanLocal } from '@/scan';
import type { ScanProgress } from '@/scan-progress';
import { configPath, loadConfig } from '@/store';
import { summarize } from '@/summary';
import { elapsed, withTask } from '@/ui/live';
import { renderScanReport } from '@/ui/scan-report';
import { renderScanProgress, scanDoneText } from '@/ui/scan-progress';
import { theme } from '@/ui/theme';

export async function scan(ctx: Context): Promise<void> {
  const started = ctx.now();
  let progress: Readonly<ScanProgress> | null = null;
  const result = await withTask(
    ctx,
    () => renderScanProgress(ctx, progress),
    async (task) => {
      const scanned = await scanLocal({
        env: ctx.env,
        home: ctx.home,
        platform: ctx.platform,
        onProgress: (next) => {
          progress = next;
        },
      });
      task.succeed(`${scanDoneText(scanned)} ${elapsed(ctx, started)}`);
      return scanned;
    },
  );
  const summary = summarize(result.records, TOP_MODELS_LIMIT);
  ctx.out.line();
  ctx.out.line(`  ${theme.title('Local scan')} ${theme.dim('(dry run, nothing was uploaded)')}`);
  for (const line of renderScanReport(summary, LOG_SOURCES.map((source) => source.source))) ctx.out.line(line);
  ctx.out.line();
  const loggedIn = (await loadConfig(configPath(ctx.env, ctx.home)).catch(() => null)) !== null;
  if (!loggedIn && summary.overall.records > 0) {
    ctx.out.line(`  Run ${theme.accent('npx tokenaires')} to put these tokens on the board.`);
    ctx.out.line();
  }
}

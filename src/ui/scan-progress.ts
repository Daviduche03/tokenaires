import { AGENT_SOURCE_LABELS } from '@tokenaires/contracts';
import type { Context } from '@/context';
import type { ScanProgress } from '@/scan-progress';
import type { ScanResult } from '@/scan';
import { barLine } from '@/ui/live';
import { formatInt, plural } from '@/ui/format';
import { symbols } from '@/ui/theme';

export function renderScanProgress(ctx: Context, progress: Readonly<ScanProgress> | null): string {
  if (!progress || progress.searching > 0) {
    const found = progress && progress.found > 0 ? ` ${symbols.dot} ${plural(progress.found, 'file', 'files')} so far` : '';
    return `Looking for agent logs${found}`;
  }
  if (progress.found === 0) return 'Looking for agent logs';
  const details = [`${formatInt(progress.read)}/${formatInt(progress.found)} files`];
  if (progress.reading) details.push(AGENT_SOURCE_LABELS[progress.reading]);
  return barLine(ctx, 'Reading logs', progress.read / progress.found, details);
}

export function scanDoneText(result: ScanResult): string {
  const files = Object.values(result.files).reduce((sum, value) => sum + value, 0);
  if (files === 0) return 'No agent logs found on this machine';
  const cached = result.cachedFiles > 0 ? ` ${symbols.dot} ${formatInt(result.cachedFiles)} unchanged` : '';
  return `Read ${plural(files, 'log file', 'log files')}${cached}`;
}

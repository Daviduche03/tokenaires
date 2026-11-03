import { nextTier, TIERS } from '@tokenaires/contracts';
import { profileUrl, resolveApiUrl } from '@/config';
import type { Context } from '@/context';
import { createClient } from '@/api/client';
import { fetchMe } from '@/api/endpoints';
import { configPath, loadConfig } from '@/store';
import { formatCompact, formatPercent, formatRank } from '@/ui/format';
import { tierLabel } from '@/ui/sync-report';
import { progressBar, theme } from '@/ui/theme';

const BAR_WIDTH = 24;

function tierProgress(total: number): string[] {
  const next = nextTier(total);
  if (!next) return [`  ${theme.good('Top tier reached.')}`];
  const index = TIERS.findIndex((tier) => tier.id === next.id);
  const floor = TIERS[index - 1]?.min ?? 0;
  const ratio = next.min > floor ? (total - floor) / (next.min - floor) : 0;
  return [
    `  ${progressBar(ratio, BAR_WIDTH)}  ${formatPercent(ratio)} of the way to ${next.label}`,
    theme.dim(`  ${formatCompact(next.min - total)} more tokens to go`),
  ];
}

export async function status(ctx: Context): Promise<void> {
  const config = await loadConfig(configPath(ctx.env, ctx.home));
  ctx.out.line();
  if (!config) {
    ctx.out.line('  Not logged in. Run tokenaires login to join the board.');
    ctx.out.line(theme.dim('  You can still run tokenaires scan to see your local totals.'));
    ctx.out.line();
    return;
  }
  const client = createClient(resolveApiUrl(ctx.env, config.apiUrl), ctx.fetch);
  const me = await fetchMe(client, config.token);
  ctx.out.line(`  Logged in as ${theme.strong(`@${me.user.handle}`)} ${theme.dim(`on ${config.apiUrl}`)}`);
  ctx.out.line();
  ctx.out.line(`  Tier      ${theme.strong(tierLabel(me.tier))}`);
  ctx.out.line(`  Tokens    ${formatCompact(me.totalTokens)}`);
  ctx.out.line(`  Rank      ${formatRank(me.ranks.all)} all time, ${formatRank(me.ranks.month)} this month, ${formatRank(me.ranks.week)} this week`);
  if (me.status === 'review') ctx.out.line(`  ${theme.warn('Account under review.')} Your rank is hidden until it clears.`);
  ctx.out.line();
  for (const line of tierProgress(me.totalTokens)) ctx.out.line(line);
  ctx.out.line(theme.dim(`  ${profileUrl(ctx.env, me.user.handle)}`));
  ctx.out.line();
}

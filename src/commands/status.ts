import { profileUrl, resolveApiUrl } from '@/config';
import type { Context } from '@/context';
import { createClient } from '@/api/client';
import { fetchMe } from '@/api/endpoints';
import { configPath, loadConfig } from '@/store';
import { renderProfileCard } from '@/ui/card';
import { withTask } from '@/ui/live';
import { theme } from '@/ui/theme';

export async function status(ctx: Context): Promise<void> {
  const config = await loadConfig(configPath(ctx.env, ctx.home));
  if (!config) {
    ctx.out.line(`  Not logged in. Run ${theme.accent('tokenaires login')} to join the board.`);
    ctx.out.line(theme.dim('  You can still run tokenaires scan to see your local totals.'));
    ctx.out.line();
    return;
  }
  const client = createClient(resolveApiUrl(ctx.env, config.apiUrl), ctx.fetch);
  const me = await withTask(ctx, () => 'Fetching your rank', async (task) => {
    const result = await fetchMe(client, config.token);
    task.clear();
    return result;
  });
  ctx.out.line(`  Logged in as ${theme.strong(`@${me.user.handle}`)} ${theme.dim(`on ${config.apiUrl}`)}`);
  ctx.out.line();
  for (const line of renderProfileCard(me, profileUrl(ctx.env, me.user.handle), ctx.term.width())) ctx.out.line(line);
  ctx.out.line();
}

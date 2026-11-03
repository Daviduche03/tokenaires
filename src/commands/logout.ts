import type { Context } from '@/context';
import { configPath, deleteConfig } from '@/store';
import { theme } from '@/ui/theme';

export async function logout(ctx: Context): Promise<void> {
  const removed = await deleteConfig(configPath(ctx.env, ctx.home));
  ctx.out.line(removed ? `  ${theme.good('Logged out.')} This device's key was removed.` : '  You were not logged in.');
}

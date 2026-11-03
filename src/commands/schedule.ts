import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Context } from '@/context';
import { UsageError } from '@/api/errors';
import { cronLine, plistPath, renderPlist, type ScheduleTarget } from '@/schedule/launchd';
import { theme } from '@/ui/theme';

export type ScheduleMode = 'on' | 'off';

function target(ctx: Context): ScheduleTarget {
  return { nodePath: ctx.nodePath, scriptPath: ctx.scriptPath, home: ctx.home, env: ctx.env };
}

async function macOn(ctx: Context): Promise<void> {
  const path = plistPath(ctx.home);
  await mkdir(dirname(path), { recursive: true });
  await ctx.run('launchctl', ['unload', path]);
  await writeFile(path, renderPlist(target(ctx)), { mode: 0o644 });
  const loaded = await ctx.run('launchctl', ['load', '-w', path]);
  if (loaded.code !== 0) throw new UsageError(`launchctl could not load the schedule: ${loaded.stderr.trim() || 'unknown error'}`);
  ctx.out.line(`  ${theme.good('Scheduled.')} Tokenaires will sync every 6 hours.`);
  ctx.out.line(theme.dim(`  ${path}`));
}

async function macOff(ctx: Context): Promise<void> {
  const path = plistPath(ctx.home);
  await ctx.run('launchctl', ['unload', '-w', path]);
  const existed = await rm(path).then(
    () => true,
    () => false,
  );
  ctx.out.line(existed ? `  ${theme.good('Schedule removed.')}` : '  No schedule was set up.');
}

function linux(ctx: Context, mode: ScheduleMode): void {
  const line = cronLine(target(ctx));
  if (mode === 'on') {
    ctx.out.line('  Add this line to your crontab (run crontab -e) to sync every 6 hours:');
  } else {
    ctx.out.line('  Remove this line from your crontab (run crontab -e):');
  }
  ctx.out.line();
  ctx.out.line(`  ${theme.accent(line)}`);
}

export async function schedule(ctx: Context, mode: ScheduleMode): Promise<void> {
  if (!ctx.scriptPath) throw new UsageError('Could not work out where the tokenaires script lives.');
  ctx.out.line();
  if (ctx.platform === 'darwin') await (mode === 'on' ? macOn(ctx) : macOff(ctx));
  else if (ctx.platform === 'linux') linux(ctx, mode);
  else throw new UsageError('Scheduling is supported on macOS and Linux. Run tokenaires sync from your own scheduler.');
  ctx.out.line();
}

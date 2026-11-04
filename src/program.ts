import { Command, InvalidArgumentError } from 'commander';
import { CLI_NAME, CLI_VERSION } from '@/config';
import type { Context } from '@/context';
import { describeError } from '@/api/errors';
import { login } from '@/commands/login';
import { logout } from '@/commands/logout';
import { scan } from '@/commands/scan';
import { schedule, type ScheduleMode } from '@/commands/schedule';
import { status } from '@/commands/status';
import { sync } from '@/commands/sync';
import { configPath, loadConfig } from '@/store';
import { renderHeader } from '@/ui/header';
import { symbols, theme } from '@/ui/theme';

function parseMode(value: string): ScheduleMode {
  if (value === 'on' || value === 'off') return value;
  throw new InvalidArgumentError('Use on or off.');
}

function header(ctx: Context): void {
  for (const line of renderHeader()) ctx.out.line(line);
}

async function loginThenSync(ctx: Context): Promise<void> {
  const existing = await loadConfig(configPath(ctx.env, ctx.home));
  const config = existing ?? (await login(ctx));
  await sync(ctx, { quiet: false, justLoggedIn: existing === null }, config);
}

export function buildProgram(ctx: Context): Command {
  const program = new Command(CLI_NAME)
    .description('Put your AI coding token usage on the Tokenaires board.')
    .version(CLI_VERSION, '-v, --version')
    .option('--dry-run', 'same as scan: read local logs and upload nothing')
    .configureOutput({
      writeOut: (text) => {
        ctx.out.line(text.trimEnd());
      },
      writeErr: (text) => {
        ctx.out.error(text.trimEnd());
      },
    })
    .action(async (options: { dryRun?: boolean }) => {
      header(ctx);
      await (options.dryRun ? scan(ctx) : loginThenSync(ctx));
    });
  program.command('login').description('connect this device to your Tokenaires account').action(async () => {
    header(ctx);
    await login(ctx);
  });
  program
    .command('scan')
    .alias('dry-run')
    .description('read local logs and print totals without uploading anything')
    .action(async () => {
      header(ctx);
      await scan(ctx);
    });
  program
    .command('sync')
    .description('upload new usage records and show your rank')
    .option('-q, --quiet', 'print nothing unless something goes wrong')
    .action(async (options: { quiet?: boolean }) => {
      const quiet = options.quiet === true;
      if (!quiet) header(ctx);
      await sync(ctx, { quiet });
    });
  program
    .command('status')
    .description('show login state, rank and tier progress')
    .action(async () => {
      header(ctx);
      await status(ctx);
    });
  program.command('logout').description('remove the saved login and device key').action(() => logout(ctx));
  program
    .command('schedule')
    .description('sync automatically every 6 hours')
    .argument('<mode>', 'on or off', parseMode)
    .action((mode: ScheduleMode) => schedule(ctx, mode));
  return program;
}

export async function runCli(ctx: Context, argv: string[]): Promise<number> {
  try {
    await buildProgram(ctx).parseAsync(argv, { from: 'user' });
    return 0;
  } catch (error) {
    ctx.out.error(`  ${theme.bad(`${symbols.cross} Error`)} ${describeError(error)}`);
    return 1;
  }
}

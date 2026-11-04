import type { DevicePollResponse, DeviceStartResponse } from '@tokenaires/contracts';
import { ENV_KEYS, profileUrl, readEnv, resolveApiUrl } from '@/config';
import type { Context } from '@/context';
import { createClient, type ApiClient } from '@/api/client';
import { pollDeviceLogin, startDeviceLogin } from '@/api/endpoints';
import { UsageError } from '@/api/errors';
import { generateDeviceKeys } from '@/api/signing';
import { configPath, saveConfig, type StoredConfig } from '@/store';
import { renderBox } from '@/ui/card';
import { formatClock } from '@/ui/format';
import { withTask } from '@/ui/live';
import { symbols, theme } from '@/ui/theme';

type Completed = Extract<DevicePollResponse, { status: 'complete' }>;

function printInstructions(ctx: Context, start: DeviceStartResponse, opened: boolean): void {
  ctx.out.line(`  ${theme.title('Log in to Tokenaires')}`);
  ctx.out.line();
  ctx.out.line(`  ${theme.dim('1.')} Open ${theme.accent(start.verificationUri)}${opened ? theme.dim('  (opened in your browser)') : ''}`);
  ctx.out.line(`  ${theme.dim('2.')} Enter this code:`);
  ctx.out.line();
  const code = `  ${theme.strong(theme.accent(start.userCode))}  `;
  for (const line of renderBox([code], 0, ctx.term.width())) ctx.out.line(`   ${line}`);
  ctx.out.line();
}

async function waitForApproval(
  ctx: Context,
  client: ApiClient,
  start: DeviceStartResponse,
  publicKey: string,
): Promise<Completed> {
  const deadline = ctx.now() + start.expiresIn * 1000;
  let interval = start.interval;
  const request = { sessionId: start.sessionId, publicKey, deviceName: ctx.hostname, platform: ctx.platform };
  return withTask(
    ctx,
    () => `Waiting for you to approve this device ${theme.dim(`${symbols.dot} code expires in ${formatClock(deadline - ctx.now())}`)}`,
    async (task) => {
      while (ctx.now() < deadline) {
        await ctx.sleep(interval * 1000);
        const result = await pollDeviceLogin(client, request);
        if (result.status === 'complete') {
          task.clear();
          return result;
        }
        if (result.status === 'slow_down') interval = result.interval;
        if (result.status === 'expired') throw new UsageError('The login code expired. Run tokenaires login to get a new one.');
        if (result.status === 'denied') throw new UsageError('Login was denied in the browser. Nothing was saved.');
      }
      throw new UsageError('The login code expired. Run tokenaires login to get a new one.');
    },
  );
}

export async function login(ctx: Context): Promise<StoredConfig> {
  const apiUrl = resolveApiUrl(ctx.env);
  const client = createClient(apiUrl, ctx.fetch);
  const keys = generateDeviceKeys();
  const start = await withTask(ctx, () => 'Starting login', async (task) => {
    const started = await startDeviceLogin(client);
    task.clear();
    return started;
  });
  const openBrowser = !readEnv(ctx.env, ENV_KEYS.noBrowser);
  printInstructions(ctx, start, openBrowser);
  if (openBrowser) ctx.openUrl(start.verificationUri);
  const done = await waitForApproval(ctx, client, start, keys.publicKey);
  const config: StoredConfig = {
    apiUrl,
    token: done.token,
    deviceId: done.deviceId,
    privateKeyPem: keys.privateKeyPem,
    handle: done.user.handle,
  };
  await saveConfig(configPath(ctx.env, ctx.home), config);
  ctx.out.line(`  ${theme.good(symbols.tick)} Logged in as ${theme.strong(`@${done.user.handle}`)}`);
  ctx.out.line(theme.dim(`    ${profileUrl(ctx.env, done.user.handle)}`));
  ctx.out.line();
  return config;
}

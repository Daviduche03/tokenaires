import type { DevicePollResponse, DeviceStartResponse } from '@tokenaires/contracts';
import { ENV_KEYS, profileUrl, readEnv, resolveApiUrl } from '@/config';
import type { Context } from '@/context';
import { createClient, type ApiClient } from '@/api/client';
import { pollDeviceLogin, startDeviceLogin } from '@/api/endpoints';
import { UsageError } from '@/api/errors';
import { generateDeviceKeys } from '@/api/signing';
import { configPath, saveConfig, type StoredConfig } from '@/store';
import { theme } from '@/ui/theme';

type Completed = Extract<DevicePollResponse, { status: 'complete' }>;

function printInstructions(ctx: Context, start: DeviceStartResponse): void {
  ctx.out.line();
  ctx.out.line(`  ${theme.title('Log in to Tokenaires')}`);
  ctx.out.line();
  ctx.out.line(`  Open this page:  ${theme.accent(start.verificationUri)}`);
  ctx.out.line(`  Enter this code: ${theme.strong(start.userCode)}`);
  ctx.out.line();
  ctx.out.line(theme.dim('  Waiting for you to approve this device...'));
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
  while (ctx.now() < deadline) {
    await ctx.sleep(interval * 1000);
    const result = await pollDeviceLogin(client, request);
    if (result.status === 'complete') return result;
    if (result.status === 'slow_down') interval = result.interval;
    if (result.status === 'expired') throw new UsageError('The login code expired. Run tokenaires login to get a new one.');
    if (result.status === 'denied') throw new UsageError('Login was denied in the browser. Nothing was saved.');
  }
  throw new UsageError('The login code expired. Run tokenaires login to get a new one.');
}

export async function login(ctx: Context): Promise<StoredConfig> {
  const apiUrl = resolveApiUrl(ctx.env);
  const client = createClient(apiUrl, ctx.fetch);
  const keys = generateDeviceKeys();
  const start = await startDeviceLogin(client);
  printInstructions(ctx, start);
  if (!readEnv(ctx.env, ENV_KEYS.noBrowser)) ctx.openUrl(start.verificationUri);
  const done = await waitForApproval(ctx, client, start, keys.publicKey);
  const config: StoredConfig = {
    apiUrl,
    token: done.token,
    deviceId: done.deviceId,
    privateKeyPem: keys.privateKeyPem,
    handle: done.user.handle,
  };
  await saveConfig(configPath(ctx.env, ctx.home), config);
  ctx.out.line();
  ctx.out.line(`  ${theme.good('Logged in')} as ${theme.strong(`@${done.user.handle}`)}`);
  ctx.out.line(theme.dim(`  Your profile: ${profileUrl(ctx.env, done.user.handle)}`));
  return config;
}

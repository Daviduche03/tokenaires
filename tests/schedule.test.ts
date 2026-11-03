import { access, readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { schedule } from '@/commands/schedule';
import { plistPath } from '@/schedule/launchd';
import { testContext } from './helpers/context';
import { makeTempDir, removeDir } from './helpers/temp';

describe('schedule', () => {
  let home = '';
  beforeEach(async () => {
    home = await makeTempDir('home');
  });
  afterEach(async () => {
    await removeDir(home);
  });

  it('writes a LaunchAgent under the temp HOME and loads it through the injected runner', async () => {
    const ctx = testContext({ home, env: { XDG_CONFIG_HOME: '/tmp/xdg & co' } });
    await schedule(ctx, 'on');
    const path = plistPath(home);
    expect(path.startsWith(home)).toBe(true);
    const plist = await readFile(path, 'utf8');
    expect(plist).toContain('<string>com.tokenaires.sync</string>');
    expect(plist).toContain('<integer>21600</integer>');
    expect(plist).toContain('<string>/usr/local/bin/node</string>');
    expect(plist).toContain('<string>/opt/tokenaires/dist/cli.js</string>');
    expect(plist).toContain('<string>sync</string>');
    expect(plist).toContain('<string>--quiet</string>');
    expect(plist).toContain('<string>/tmp/xdg &amp; co</string>');
    expect(ctx.commands).toEqual([
      { command: 'launchctl', args: ['unload', path] },
      { command: 'launchctl', args: ['load', '-w', path] },
    ]);
  });

  it('unloads and removes the LaunchAgent when turned off', async () => {
    const ctx = testContext({ home, env: {} });
    await schedule(ctx, 'on');
    await schedule(ctx, 'off');
    await expect(access(plistPath(home))).rejects.toThrow();
    expect(ctx.commands.at(-1)).toEqual({ command: 'launchctl', args: ['unload', '-w', plistPath(home)] });
    expect(ctx.lines.join('\n')).toContain('Schedule removed.');
  });

  it('reports a launchctl failure', async () => {
    const ctx = testContext({
      home,
      env: {},
      run: (_command, args) => Promise.resolve({ code: args[0] === 'load' ? 5 : 0, stdout: '', stderr: 'denied' }),
    });
    await expect(schedule(ctx, 'on')).rejects.toThrow('launchctl could not load the schedule: denied');
  });

  it('prints a crontab line on Linux without touching the system', async () => {
    const ctx = testContext({ home, env: {}, platform: 'linux' });
    await schedule(ctx, 'on');
    expect(ctx.commands).toEqual([]);
    expect(ctx.lines.join('\n')).toContain('0 */6 * * * /usr/local/bin/node /opt/tokenaires/dist/cli.js sync --quiet');
  });
});

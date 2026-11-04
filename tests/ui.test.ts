import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { MeSummary } from '@tokenaires/contracts';
import { scanLocal } from '@/scan';
import type { ScanProgress } from '@/scan-progress';
import { clip, padEnd, stripAnsi, visibleWidth } from '@/ui/ansi';
import { renderProfileCard, tierProgress } from '@/ui/card';
import { formatClock, formatDuration } from '@/ui/format';
import { barLine, startTask, withTask } from '@/ui/live';
import { testContext, type TestContext } from './helpers/context';
import { writeFixtureLogs } from './helpers/logs';
import { makeTempDir, removeDir } from './helpers/temp';

const ESC = String.fromCharCode(27);
const RED = `${ESC}[31m`;
const RESET_FG = `${ESC}[39m`;

function liveContext(width = 80): TestContext & { written: string[]; state: { releases: number } } {
  const written: string[] = [];
  const state = { releases: 0 };
  const ctx = testContext({
    home: '/tmp/none',
    env: {},
    term: {
      interactive: true,
      width: () => width,
      write: (text) => written.push(text),
      onInterrupt: () => () => {
        state.releases += 1;
      },
    },
  });
  return Object.assign(ctx, { written, state });
}

function me(overrides: Partial<MeSummary> = {}): MeSummary {
  return {
    user: { handle: 'ada' },
    tier: 'millionaire',
    totalTokens: 2_500_000,
    ranks: { all: 3, month: 1, week: null },
    status: 'active',
    cursors: [],
    ...overrides,
  } as MeSummary;
}

describe('ansi helpers', () => {
  it('measures and pads by visible characters only', () => {
    const red = `${RED}hello${RESET_FG}`;
    expect(visibleWidth(red)).toBe(5);
    expect(visibleWidth('━━─')).toBe(3);
    expect(stripAnsi(padEnd(red, 8))).toBe('hello   ');
  });

  it('clips styled text without cutting escape codes and resets the style', () => {
    const clipped = clip(`ab${RED}cdef${RESET_FG}gh`, 4);
    expect(stripAnsi(clipped)).toBe('abcd');
    expect(clipped.endsWith(`${ESC}[0m`)).toBe(true);
    expect(clip('short', 10)).toBe('short');
  });
});

describe('durations', () => {
  it('formats elapsed time and countdowns', () => {
    expect(formatDuration(420)).toBe('0.4s');
    expect(formatDuration(42_000)).toBe('42s');
    expect(formatDuration(125_000)).toBe('2m 05s');
    expect(formatDuration(3_780_000)).toBe('1h 03m');
    expect(formatClock(14 * 60_000 + 32_000)).toBe('14:32');
    expect(formatClock(-5)).toBe('0:00');
  });
});

describe('live tasks', () => {
  it('draws a spinner on the terminal, then prints one result line and restores the cursor', () => {
    const ctx = liveContext();
    const task = startTask(ctx, () => 'Reading logs');
    expect(ctx.written.join('')).toContain(`${ESC}[?25l`);
    expect(stripAnsi(ctx.written.join(''))).toContain('Reading logs');
    task.succeed('Read 3 log files');
    task.succeed('ignored second call');
    expect(ctx.written.at(-1)).toContain(`${ESC}[?25h`);
    expect(ctx.state.releases).toBe(1);
    expect(ctx.lines).toEqual(['  ✔ Read 3 log files']);
  });

  it('keeps the last progress as a failure line when the work throws', async () => {
    const ctx = liveContext();
    await expect(
      withTask(ctx, () => 'Uploading 40%', () => Promise.reject(new Error('network down'))),
    ).rejects.toThrow('network down');
    expect(ctx.lines).toEqual(['  ✖ Uploading 40%']);
    expect(ctx.written.at(-1)).toContain(`${ESC}[?25h`);
  });

  it('prints only result lines when the terminal is not interactive, and nothing when silent', async () => {
    const ctx = testContext({ home: '/tmp/none', env: {} });
    await withTask(ctx, () => 'Working', (task) => {
      task.succeed('Done');
      return Promise.resolve();
    });
    await withTask(ctx, () => 'Hidden', () => Promise.resolve(), { silent: true });
    await withTask(ctx, () => 'Cleared', () => Promise.resolve());
    expect(ctx.lines).toEqual(['  ✔ Done']);
  });

  it('fits the progress line to the terminal width, dropping details before the bar', () => {
    const wide = barLine(liveContext(100), 'Uploading', 0.5, ['500/1,000 records', '+2M tokens', '~4s left']);
    expect(stripAnsi(wide)).toMatch(/^Uploading {2}━+─+ {2} 50\.0% {2}500\/1,000 records {2}\+2M tokens {2}~4s left$/);
    expect(visibleWidth(wide)).toBeLessThanOrEqual(94);
    const narrow = barLine(liveContext(40), 'Uploading', 0.5, ['500/1,000 records', '+2M tokens', '~4s left']);
    expect(stripAnsi(narrow)).not.toContain('left');
    expect(stripAnsi(narrow)).toContain('50.0%');
  });
});

describe('profile card', () => {
  it('shows handle, tier, ranks and progress inside a box', () => {
    const lines = renderProfileCard(me(), 'https://tokenaires.cc/u/ada', 80).map(stripAnsi);
    const text = lines.join('\n');
    expect(lines[0]).toMatch(/^ {2}╭─+╮$/);
    expect(text).toMatch(/@ada\s+Millionaire/);
    expect(text).toMatch(/2\.5M tokens\s+2,500,000/);
    expect(text).toMatch(/#3\s+#1\s+unranked/);
    expect(text).toMatch(/more tokens → Billionaire/);
    expect(lines.at(-1)).toBe('  https://tokenaires.cc/u/ada');
    const widths = new Set(lines.slice(0, -1).map((line) => visibleWidth(line)));
    expect(widths.size).toBe(1);
  });

  it('drops the frame on narrow terminals and flags accounts under review', () => {
    const text = renderProfileCard(me({ status: 'review' }), 'https://tokenaires.cc/u/ada', 40).map(stripAnsi).join('\n');
    expect(text).not.toContain('╭');
    expect(text).toContain('Under review.');
  });

  it('measures progress from the current tier floor', () => {
    expect(tierProgress(500)).toMatchObject({ ratio: 0.5, next: 'Thousandaire', remaining: 500 });
  });
});

describe('scan progress', () => {
  let root = '';
  beforeEach(async () => {
    root = await makeTempDir('progress');
  });
  afterEach(async () => {
    await removeDir(root);
  });

  it('reports discovery and every file read, ending complete', async () => {
    const dirs = await writeFixtureLogs(root);
    const env = { CLAUDE_CONFIG_DIR: dirs.claudeConfig, CODEX_HOME: dirs.codexHome, XDG_CONFIG_HOME: join(root, 'xdg') };
    const seen: ScanProgress[] = [];
    const result = await scanLocal({ env, home: root, cachePath: null, onProgress: (progress) => seen.push({ ...progress }) });
    const files = Object.values(result.files).reduce((sum, value) => sum + value, 0);
    const last = seen.at(-1);
    expect(last).toMatchObject({ searching: 0, found: files, read: files, cached: 0, reading: null });
    expect(seen.some((progress) => progress.reading !== null)).toBe(true);
    for (let index = 1; index < seen.length; index += 1) {
      expect(seen[index]?.read).toBeGreaterThanOrEqual(seen[index - 1]?.read ?? 0);
    }
  });
});

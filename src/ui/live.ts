import type { Context } from '@/context';
import { clip, visibleWidth } from '@/ui/ansi';
import { formatDuration, formatPercent } from '@/ui/format';
import { progressBar, symbols, theme } from '@/ui/theme';

const ESC = String.fromCharCode(27);
const CLEAR_LINE = `\r${ESC}[2K`;
const HIDE_CURSOR = `${ESC}[?25l`;
const SHOW_CURSOR = `${ESC}[?25h`;
const FRAME_MS = 80;
const INDENT = '  ';

export type Render = () => string;

export interface Task {
  succeed(text: string): void;
  warn(text: string): void;
  fail(text?: string): void;
  clear(): void;
}

export interface TaskOptions {
  silent?: boolean;
}

const SILENT_TASK: Task = {
  succeed: () => undefined,
  warn: () => undefined,
  fail: () => undefined,
  clear: () => undefined,
};

class LiveTask implements Task {
  private frame = 0;
  private settled = false;
  private timer: NodeJS.Timeout | null = null;
  private release: (() => void) | null = null;

  constructor(
    private readonly ctx: Context,
    private readonly render: Render,
  ) {
    if (!ctx.term.interactive) return;
    ctx.term.write(HIDE_CURSOR);
    this.release = ctx.term.onInterrupt(() => {
      ctx.term.write(CLEAR_LINE + SHOW_CURSOR);
    });
    this.timer = setInterval(() => {
      this.frame += 1;
      this.draw();
    }, FRAME_MS);
    this.timer.unref();
    this.draw();
  }

  private draw(): void {
    const spinner = theme.accent(symbols.spinner[this.frame % symbols.spinner.length] ?? '');
    const line = `${INDENT}${spinner} ${this.safeRender()}`;
    this.ctx.term.write(CLEAR_LINE + clip(line, Math.max(1, this.ctx.term.width() - 1)));
  }

  private safeRender(): string {
    try {
      return this.render();
    } catch {
      return '';
    }
  }

  private stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (!this.ctx.term.interactive) return;
    this.ctx.term.write(CLEAR_LINE + SHOW_CURSOR);
    this.release?.();
    this.release = null;
  }

  private settle(line: string | null): void {
    if (this.settled) return;
    this.settled = true;
    this.stop();
    if (line !== null) this.ctx.out.line(line);
  }

  succeed(text: string): void {
    this.settle(`${INDENT}${theme.good(symbols.tick)} ${text}`);
  }

  warn(text: string): void {
    this.settle(`${INDENT}${theme.warn(symbols.warn)} ${text}`);
  }

  fail(text?: string): void {
    this.settle(`${INDENT}${theme.bad(symbols.cross)} ${text ?? this.safeRender()}`);
  }

  clear(): void {
    this.settle(null);
  }
}

export function startTask(ctx: Context, render: Render, options: TaskOptions = {}): Task {
  return options.silent ? SILENT_TASK : new LiveTask(ctx, render);
}

export async function withTask<T>(
  ctx: Context,
  render: Render,
  run: (task: Task) => Promise<T>,
  options: TaskOptions = {},
): Promise<T> {
  const task = startTask(ctx, render, options);
  try {
    return await run(task);
  } catch (error) {
    task.fail();
    throw error;
  } finally {
    task.clear();
  }
}

const MIN_BAR = 8;
const MAX_BAR = 28;
const SPINNER_ROOM = 6;

export function barLine(ctx: Context, label: string, ratio: number, details: readonly string[]): string {
  const percent = theme.strong(formatPercent(Math.min(1, Math.max(0, ratio))).padStart(6));
  const room = ctx.term.width() - SPINNER_ROOM;
  const kept = [...details];
  const compose = (barWidth: number): string =>
    [label, progressBar(ratio, barWidth), percent, ...kept.map((detail) => theme.dim(detail))].join('  ');
  while (kept.length > 0 && visibleWidth(compose(MIN_BAR)) > room) kept.pop();
  const spare = room - visibleWidth(compose(0));
  return compose(Math.min(MAX_BAR, Math.max(MIN_BAR, spare)));
}

export function elapsed(ctx: Context, since: number): string {
  return theme.dim(`${symbols.dot} ${formatDuration(ctx.now() - since)}`);
}

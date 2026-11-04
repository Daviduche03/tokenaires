"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { RestartIcon } from "@solar-icons/react/linear";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useReducer, useRef, type CSSProperties } from "react";
import { formatCompact, formatFull } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  INITIAL_PLAYER,
  isIdle,
  playerReducer,
  TERMINAL_SCRIPTS,
  TERMINAL_TIMELINES,
  TERMINAL_TIMING,
  TERMINAL_VERSION,
  type ProfileCard,
  type Segment,
  type TableColumn,
  type TableRow,
  type TerminalLine,
  type Tone,
} from "./terminal-lines";

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const BAR_CHARS = 80;
const SHARE_BAR = 10;
const SCROLL_STICK_PX = 80;

const TONES: Record<Tone, string> = {
  default: "",
  dim: "text-t4",
  strong: "font-semibold text-foreground",
  accent: "text-accent-text",
  accentStrong: "font-semibold text-accent-text",
};

function percent(ratio: number): string {
  return `${(Math.min(1, Math.max(0, ratio)) * 100).toFixed(1)}%`;
}

function ease(x: number): number {
  const clamped = Math.min(1, Math.max(0, x));
  return clamped * clamped * (3 - 2 * clamped);
}

function clock(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

function Caret() {
  return <span className="ml-px inline-block h-[1.05em] w-[0.55em] translate-y-[0.18em] bg-foreground/70 motion-safe:animate-pulse" />;
}

function Segments({ segments }: { segments: Segment[] }) {
  return (
    <>
      {segments.map((segment, index) => (
        <span key={index} className={cn(TONES[segment.tone ?? "default"], segment.wide && "max-sm:hidden")}>
          {segment.text}
        </span>
      ))}
    </>
  );
}

function Tick() {
  return <span className="text-accent-text">✔ </span>;
}

function Bar({ ratio, className }: { ratio: number; className?: string }) {
  return (
    <span className={cn("relative block min-w-0 overflow-hidden whitespace-nowrap", className)} aria-hidden="true">
      <span className="text-t4/60">{"─".repeat(BAR_CHARS)}</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-accent-text" style={{ width: percent(ratio) }}>
        {"━".repeat(BAR_CHARS)}
      </span>
    </span>
  );
}

function LiveLine({ line, elapsed, frame }: { line: Extract<TerminalLine, { kind: "live" }>; elapsed: number; frame: number }) {
  if (elapsed >= line.ms) {
    return line.done ? (
      <p>
        <Tick />
        <Segments segments={line.done} />
      </p>
    ) : null;
  }
  const ratio = ease(elapsed / line.ms);
  const details: string[] = [];
  if (line.count) details.push(`${formatFull(Math.round(line.count.total * ratio))}/${formatFull(line.count.total)} ${line.count.unit}`);
  if (line.tokens) details.push(`+${formatCompact(line.tokens * ratio)} tokens`);
  if (line.note) details.push(line.note);
  return (
    <p className="flex items-center gap-[2ch] whitespace-nowrap">
      <span className="flex min-w-0 shrink-0 items-center gap-[1ch]">
        <span className="text-accent-text">{SPINNER[frame % SPINNER.length]}</span>
        <span>{line.label}</span>
        {line.expiresInSec !== undefined && (
          <span className="text-t4 max-sm:hidden">· code expires in {clock(line.expiresInSec - Math.floor(elapsed / 1000))}</span>
        )}
      </span>
      {line.bar && (
        <>
          <Bar ratio={ratio} className="max-w-[26ch] flex-1" />
          <span className="shrink-0 font-semibold tabular">{percent(ratio).padStart(6, " ")}</span>
          {details.length > 0 && <span className="truncate text-t4 max-sm:hidden">{details.join("  ")}</span>}
        </>
      )}
    </p>
  );
}

function shareBar(ratio: number) {
  const filled = Math.round(ratio * SHARE_BAR);
  return (
    <>
      <span className="text-accent-text">{"━".repeat(filled)}</span>
      <span className="text-t4/60">{"─".repeat(SHARE_BAR - filled)}</span>
    </>
  );
}

function Table({ columns, rows }: { columns: TableColumn[]; rows: TableRow[] }) {
  const narrow = columns.filter((column) => !column.wide).length;
  const style = { "--cols": narrow, "--cols-sm": columns.length } as CSSProperties;
  const cell = (column: TableColumn | undefined, extra?: string) =>
    cn(column?.align === "right" ? "text-right" : "text-left", column?.wide && "max-sm:hidden", extra);
  return (
    <div
      style={style}
      className="grid justify-start gap-x-[3ch] whitespace-nowrap [grid-template-columns:repeat(var(--cols),auto)] sm:[grid-template-columns:repeat(var(--cols-sm),auto)]"
    >
      {columns.map((column) => (
        <span key={column.label} className={cell(column, "text-t4")}>
          {column.label}
        </span>
      ))}
      {rows.map((row) =>
        row.cells.map((value, index) => {
          const column = columns[index];
          const isShare = row.bars !== undefined && index === row.cells.length - 1;
          return (
            <span key={`${row.cells[0]}-${index}`} className={cell(column, cn("tabular", TONES[row.tone ?? "default"]))}>
              {isShare ? (
                <>
                  {shareBar(row.bars ?? 0)} {value.padStart(6, " ")}
                </>
              ) : (
                value
              )}
            </span>
          );
        }),
      )}
    </div>
  );
}

function Card({ card }: { card: ProfileCard }) {
  const labels = ["all time", "this month", "this week"];
  return (
    <div className="max-w-[62ch]">
      <div className="rounded-xl border border-line-strong px-[2ch] py-3">
        <p className="flex justify-between gap-4">
          <span className="font-semibold text-foreground">{card.handle}</span>
          <span className="text-accent-text">{card.tier}</span>
        </p>
        <p className="flex justify-between gap-4">
          <span>
            <span className="font-semibold text-accent-text">{formatCompact(card.tokens)}</span> tokens
          </span>
          <span className="text-t4 tabular max-sm:hidden">{formatFull(card.tokens)}</span>
        </p>
        <div className="mt-[1lh] grid grid-cols-3 gap-x-[2ch]">
          {card.ranks.map((rank, index) => (
            <span key={labels[index]} className="font-semibold text-accent-text tabular">
              {rank}
            </span>
          ))}
          {labels.map((label) => (
            <span key={label} className="text-t4">
              {label}
            </span>
          ))}
        </div>
        <p className="mt-[1lh] flex items-center gap-[2ch]">
          <Bar ratio={card.ratio} className="flex-1" />
          <span className="shrink-0 font-semibold tabular">{percent(card.ratio)}</span>
        </p>
        <p className="text-t4">
          {card.remaining} more tokens → {card.next}
        </p>
      </div>
      <p className="mt-1 text-t4">{card.url}</p>
    </div>
  );
}

function Line({ line, elapsed, typed, frame }: { line: TerminalLine; elapsed: number; typed: number; frame: number }) {
  switch (line.kind) {
    case "command":
      return (
        <p>
          <span className="select-none text-accent-text">$ </span>
          {line.text.slice(0, typed)}
          {typed < line.text.length && <Caret />}
        </p>
      );
    case "blank":
      return <p className="h-[1lh]" />;
    case "header":
      return (
        <p>
          <span className="text-accent-text">▀█▀</span>
          <span className="font-semibold text-foreground">{"  tokenaires "}</span>
          <span className="text-t4">{TERMINAL_VERSION}</span>
        </p>
      );
    case "text":
      return (
        <p>
          <Segments segments={line.segments} />
        </p>
      );
    case "ok":
      return (
        <p>
          <Tick />
          <Segments segments={line.segments} />
        </p>
      );
    case "code":
      return (
        <p className="py-1 pl-[3ch]">
          <span className="inline-block rounded-lg border border-line-strong px-[2ch] py-1 font-semibold tracking-[0.08em] text-accent-text">{line.code}</span>
        </p>
      );
    case "live":
      return <LiveLine line={line} elapsed={elapsed} frame={frame} />;
    case "table":
      return <Table columns={line.columns} rows={line.rows} />;
    case "card":
      return <Card card={line.card} />;
  }
}

export function TerminalDemo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion() === true;
  const [state, dispatch] = useReducer(playerReducer, INITIAL_PLAYER);
  const script = TERMINAL_SCRIPTS[state.active] ?? TERMINAL_SCRIPTS[0];
  const timeline = TERMINAL_TIMELINES[state.active] ?? TERMINAL_TIMELINES[0];
  const t = reduce ? Number.POSITIVE_INFINITY : state.t;
  const idle = reduce || isIdle(state);

  useEffect(() => {
    if (reduce || !inView || idle) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      dispatch({ type: "tick", delta: now - last });
      last = now;
    }, TERMINAL_TIMING.spinnerMs);
    return () => clearInterval(id);
  }, [reduce, inView, idle]);

  const visible = timeline.lines.filter((entry) => entry.at <= t);
  const typing = timeline.typing.find((entry) => t >= entry.start && t < entry.start + entry.length * TERMINAL_TIMING.typeMs);
  const finished = t >= timeline.endsAt;
  const frame = Math.floor((Number.isFinite(t) ? t : 0) / TERMINAL_TIMING.spinnerMs);
  const scrollKey = `${state.run}:${visible.length}:${typing ? Math.floor((t - typing.start) / TERMINAL_TIMING.typeMs) : -1}:${finished}`;

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    if (body.scrollHeight - body.scrollTop - body.clientHeight < SCROLL_STICK_PX) body.scrollTop = body.scrollHeight;
  }, [scrollKey]);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = 0;
  }, [state.run]);

  return (
    <div ref={ref} className={cn("panel overflow-hidden text-left shadow-[0_24px_60px_hsl(240_10%_4%/0.1)] dark:shadow-[0_30px_80px_hsl(0_0%_0%/0.35)]", className)}>
      <TabsPrimitive.Root
        value={script.id}
        onValueChange={(value) => {
          const index = TERMINAL_SCRIPTS.findIndex((item) => item.id === value);
          if (index >= 0) dispatch({ type: "select", index });
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </span>
          <span className="text-[11px] text-t4">Example run</span>
          <button
            type="button"
            onClick={() => dispatch({ type: "replay" })}
            disabled={!idle || reduce}
            aria-label={`Replay ${script.tab}`}
            className="touch-target inline-flex size-6 items-center justify-center rounded-full text-t4 transition-colors hover:text-foreground disabled:opacity-0"
          >
            <RestartIcon className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <TabsPrimitive.List
          aria-label="CLI commands"
          className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TERMINAL_SCRIPTS.map((item) => (
            <TabsPrimitive.Trigger
              key={item.id}
              value={item.id}
              className="touch-target shrink-0 rounded-full px-2.5 py-1 font-mono text-[11.5px] text-t3 transition-colors duration-150 hover:text-t2 data-[state=active]:bg-foreground/[0.08] data-[state=active]:text-foreground sm:text-xs"
            >
              {item.tab}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
        {TERMINAL_SCRIPTS.map((item) => (
          <TabsPrimitive.Content key={item.id} value={item.id} className="outline-none">
            <p className="sr-only">Example output. {item.summary}</p>
            {item.id === script.id && (
              <div
                ref={bodyRef}
                aria-hidden="true"
                className="h-[25rem] overflow-y-auto overscroll-contain px-4 py-4 font-mono text-[12px] leading-[1.65] whitespace-pre-wrap [overflow-wrap:anywhere] sm:h-[27rem] sm:px-5 sm:text-[13px]"
              >
                {visible.map((entry) => {
                  const line = script.lines[entry.index];
                  if (!line) return null;
                  const typed =
                    line.kind === "command" ? Math.min(line.text.length, Math.floor((t - entry.at) / TERMINAL_TIMING.typeMs)) : 0;
                  return <Line key={`${state.run}-${entry.index}`} line={line} elapsed={t - entry.at} typed={typed} frame={frame} />;
                })}
                {finished && (
                  <p>
                    <span className="select-none text-accent-text">$ </span>
                    <Caret />
                  </p>
                )}
              </div>
            )}
          </TabsPrimitive.Content>
        ))}
      </TabsPrimitive.Root>
      <p className="sr-only">
        Example: running npx tokenaires signs you in with GitHub, scans your coding agent logs, uploads token counts and shows your rank.
      </p>
    </div>
  );
}

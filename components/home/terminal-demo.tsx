"use client";

import { RestartIcon } from "@solar-icons/react/linear";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TERMINAL_LINES, TERMINAL_TIMING, type TerminalLine } from "./terminal-lines";

const COMMAND = TERMINAL_LINES[0].kind === "command" ? TERMINAL_LINES[0].text : "";

function Line({ line, typed }: { line: TerminalLine; typed: string }) {
  if (line.kind === "command") {
    return (
      <p>
        <span className="select-none text-accent-text">$ </span>
        {typed}
        {typed.length < line.text.length && <span className="ml-px inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-foreground/70" />}
      </p>
    );
  }
  if (line.kind === "muted") return <p className="text-t3">{line.text}</p>;
  if (line.kind === "ok") return <p><span className="text-accent-text">✓ </span>{line.text}</p>;
  if (line.kind === "row") {
    return (
      <p className="grid grid-cols-[7.5rem_1fr_auto] gap-3">
        <span className="text-t2">{line.label}</span>
        <span className="text-t4">{line.detail}</span>
        <span className="text-right">{line.value}</span>
      </p>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-t3">{line.text}</span>
      <span className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]">
        <motion.span
          className="block h-full rounded-full bg-accent"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: TERMINAL_TIMING.progressMs / 1000, ease: "easeInOut" }}
        />
      </span>
    </div>
  );
}

export function TerminalDemo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [run, setRun] = useState(0);
  const [typed, setTyped] = useState("");
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    if (!inView || reduce) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    COMMAND.split("").forEach((_, index) => {
      timers.push(setTimeout(() => setTyped(COMMAND.slice(0, index + 1)), (index + 1) * TERMINAL_TIMING.typeMs));
    });
    let at = COMMAND.length * TERMINAL_TIMING.typeMs + TERMINAL_TIMING.lineGapMs;
    TERMINAL_LINES.slice(1).forEach((line, index) => {
      timers.push(setTimeout(() => setVisible(index + 2), at));
      at += line.kind === "progress" ? TERMINAL_TIMING.progressMs + TERMINAL_TIMING.lineGapMs : TERMINAL_TIMING.lineGapMs;
    });
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, run]);

  const shownTyped = reduce ? COMMAND : typed;
  const shownVisible = reduce ? TERMINAL_LINES.length : visible;
  const done = shownVisible >= TERMINAL_LINES.length;

  const replay = () => {
    setTyped("");
    setVisible(1);
    setRun((count) => count + 1);
  };

  return (
    <div ref={ref} className={cn("panel overflow-hidden text-left shadow-[0_24px_60px_hsl(240_10%_4%/0.1)] dark:shadow-[0_30px_80px_hsl(0_0%_0%/0.35)]", className)}>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
        </span>
        <span className="text-[11px] text-t4">Example run</span>
        <button
          type="button"
          onClick={replay}
          disabled={!done}
          aria-label="Replay the example"
          className="touch-target inline-flex size-6 items-center justify-center rounded-full text-t4 transition-colors hover:text-foreground disabled:opacity-0"
        >
          <RestartIcon className="size-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-h-[236px] flex-col gap-2 px-5 py-4 font-mono text-[12.5px] leading-relaxed sm:text-[13px]" aria-live="off">
        {TERMINAL_LINES.slice(0, shownVisible).map((line, index) => (
          <motion.div
            key={`${run}-${index}`}
            initial={index === 0 ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Line line={line} typed={shownTyped} />
          </motion.div>
        ))}
      </div>
      <p className="sr-only">
        Example: running npx tokenaires signs you in with GitHub, scans Claude Code and Codex logs, uploads token counts and shows your rank.
      </p>
    </div>
  );
}

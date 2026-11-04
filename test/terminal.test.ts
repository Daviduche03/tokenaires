import { describe, expect, it } from "vitest";
import {
  INITIAL_PLAYER,
  isIdle,
  playerReducer,
  TERMINAL_SCRIPTS,
  TERMINAL_TIMELINES,
  TERMINAL_TIMING,
  type TerminalLine,
} from "@/components/home/terminal-lines";

const commands = TERMINAL_SCRIPTS.flatMap((script) =>
  script.lines.filter((line): line is Extract<TerminalLine, { kind: "command" }> => line.kind === "command").map((line) => line.text),
);

describe("terminal demo scripts", () => {
  it("simulates every CLI command and flag", () => {
    expect(commands).toEqual(
      expect.arrayContaining([
        "npx tokenaires",
        "tokenaires login",
        "tokenaires scan",
        "tokenaires sync",
        "tokenaires sync --quiet",
        "tokenaires status",
        "tokenaires schedule on",
        "tokenaires schedule off",
        "tokenaires logout",
        "tokenaires --help",
      ]),
    );
    const help = TERMINAL_SCRIPTS.find((script) => script.id === "help");
    const helpText = help?.lines.flatMap((line) => (line.kind === "text" ? line.segments.map((segment) => segment.text) : [])).join("\n");
    for (const entry of ["--dry-run", "login", "scan|dry-run", "sync [options]", "status", "logout", "schedule <mode>"]) {
      expect(helpText).toContain(entry);
    }
  });

  it("gives every script a unique tab and a summary for screen readers", () => {
    expect(new Set(TERMINAL_SCRIPTS.map((script) => script.id)).size).toBe(TERMINAL_SCRIPTS.length);
    for (const script of TERMINAL_SCRIPTS) {
      expect(script.summary.length).toBeGreaterThan(20);
      expect(script.lines[0]?.kind).toBe("command");
    }
  });

  it("schedules lines in order and waits for typing and live progress", () => {
    for (const timeline of TERMINAL_TIMELINES) {
      for (let index = 1; index < timeline.lines.length; index += 1) {
        expect(timeline.lines[index]!.at).toBeGreaterThan(timeline.lines[index - 1]!.at);
      }
      for (const typing of timeline.typing) {
        const next = timeline.lines.find((entry) => entry.index === typing.index + 1);
        if (next) expect(next.at).toBeGreaterThanOrEqual(typing.start + typing.length * TERMINAL_TIMING.typeMs);
      }
    }
    const first = TERMINAL_SCRIPTS[0]!;
    const uploadIndex = first.lines.findIndex((line) => line.kind === "live" && line.label === "Uploading");
    const upload = first.lines[uploadIndex];
    if (upload?.kind !== "live") throw new Error("first run has no upload progress line");
    const at = (index: number) => TERMINAL_TIMELINES[0]!.lines.find((entry) => entry.index === index)!.at;
    expect(upload.bar).toBe(true);
    expect(at(uploadIndex + 1) - at(uploadIndex)).toBeGreaterThanOrEqual(upload.ms);
  });
});

describe("terminal player", () => {
  const endOf = (index: number) => TERMINAL_TIMELINES[index]!.endsAt + TERMINAL_TIMING.nextScriptMs;

  it("plays each command once, then advances to the next until the last", () => {
    let state = playerReducer(INITIAL_PLAYER, { type: "tick", delta: endOf(0) - 1 });
    expect(state.active).toBe(0);
    state = playerReducer(state, { type: "tick", delta: 1 });
    expect(state).toMatchObject({ active: 1, t: 0, autoplay: true });
    for (let index = 1; index < TERMINAL_SCRIPTS.length; index += 1) state = playerReducer(state, { type: "tick", delta: endOf(index) });
    expect(state.active).toBe(TERMINAL_SCRIPTS.length - 1);
    expect(state.autoplay).toBe(false);
    expect(isIdle(state)).toBe(true);
  });

  it("stops autoplay when someone picks a tab or replays", () => {
    const picked = playerReducer({ ...INITIAL_PLAYER, t: 900 }, { type: "select", index: 3 });
    expect(picked).toMatchObject({ active: 3, t: 0, autoplay: false });
    expect(playerReducer(picked, { type: "tick", delta: endOf(3) * 2 }).active).toBe(3);
    const replayed = playerReducer({ ...picked, t: 5000 }, { type: "replay" });
    expect(replayed).toMatchObject({ active: 3, t: 0, autoplay: false, run: picked.run + 1 });
  });
});

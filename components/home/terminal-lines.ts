export type Tone = "default" | "dim" | "strong" | "accent" | "accentStrong";

export interface Segment {
  text: string;
  tone?: Tone;
  wide?: boolean;
}

export interface TableColumn {
  label: string;
  align: "left" | "right";
  wide?: boolean;
}

export interface TableRow {
  cells: string[];
  tone?: Tone;
  bars?: number;
}

export interface ProfileCard {
  handle: string;
  tier: string;
  tokens: number;
  ranks: readonly [string, string, string];
  ratio: number;
  remaining: string;
  next: string;
  url: string;
}

export type TerminalLine =
  | { kind: "command"; text: string }
  | { kind: "blank" }
  | { kind: "header" }
  | { kind: "text"; segments: Segment[] }
  | { kind: "ok"; segments: Segment[] }
  | { kind: "code"; code: string }
  | {
      kind: "live";
      label: string;
      ms: number;
      bar: boolean;
      count?: { total: number; unit: string };
      tokens?: number;
      note?: string;
      expiresInSec?: number;
      done: Segment[] | null;
    }
  | { kind: "table"; columns: TableColumn[]; rows: TableRow[] }
  | { kind: "card"; card: ProfileCard };

export interface TerminalScript {
  id: string;
  tab: string;
  summary: string;
  lines: TerminalLine[];
}

const VERSION = "v0.1.0";
const PROFILE = "https://tokenaires.cc/u/you";

const header: TerminalLine[] = [{ kind: "blank" }, { kind: "header" }, { kind: "blank" }];

const dim = (text: string, wide?: boolean): Segment => ({ text, tone: "dim", ...(wide ? { wide } : {}) });
const strong = (text: string): Segment => ({ text, tone: "strong" });
const plain = (text: string): Segment => ({ text });

const loginBlock: TerminalLine[] = [
  { kind: "text", segments: [strong("Log in to Tokenaires")] },
  { kind: "blank" },
  {
    kind: "text",
    segments: [dim("1. "), plain("Open "), { text: "https://github.com/login/device", tone: "accent" }, dim("  (opened in your browser)", true)],
  },
  { kind: "text", segments: [dim("2. "), plain("Enter this code:")] },
  { kind: "code", code: "K7Q2-9DXF" },
  {
    kind: "live",
    label: "Waiting for you to approve this device",
    ms: 2200,
    bar: false,
    expiresInSec: 899,
    done: null,
  },
  { kind: "ok", segments: [plain("Logged in as "), strong("@you")] },
  { kind: "text", segments: [dim(`    ${PROFILE}`)] },
  { kind: "blank" },
];

const resultColumns: TableColumn[] = [
  { label: "Result", align: "left" },
  { label: "Records", align: "right" },
];

const firstCard: ProfileCard = {
  handle: "@you",
  tier: "Billionaire",
  tokens: 11_532_104_210,
  ranks: ["#14", "#6", "#3"],
  ratio: 0.0105,
  remaining: "988B",
  next: "Trillionaire",
  url: PROFILE,
};

const syncedCard: ProfileCard = {
  ...firstCard,
  tokens: 11_628_104_210,
  ranks: ["#13", "#5", "#2"],
  ratio: 0.0106,
};

const readingLogs = (ms: number, files: number, done: Segment[]): TerminalLine => ({
  kind: "live",
  label: "Reading logs",
  ms,
  bar: true,
  count: { total: files, unit: "files" },
  note: "Codex",
  done,
});

export const TERMINAL_SCRIPTS: TerminalScript[] = [
  {
    id: "first-run",
    tab: "npx tokenaires",
    summary:
      "First run: logs you in with a GitHub device code, reads 1,284 log files, uploads 54,640 records with a progress bar, then shows your tier, ranks and progress to the next tier.",
    lines: [
      { kind: "command", text: "npx tokenaires" },
      ...header,
      ...loginBlock,
      readingLogs(2400, 1284, [plain("Read 1,284 log files "), dim("· "), strong("11.5B"), plain(" tokens in 54,640 records "), dim("· 4.2s")]),
      {
        kind: "live",
        label: "Uploading",
        ms: 2600,
        bar: true,
        count: { total: 54_640, unit: "records" },
        tokens: 11_532_104_210,
        done: [plain("Uploaded 54,640 records "), dim("· 6.1s")],
      },
      { kind: "blank" },
      {
        kind: "table",
        columns: resultColumns,
        rows: [
          { cells: ["Accepted", "54,640"], tone: "accent" },
          { cells: ["Already synced", "0"], tone: "dim" },
        ],
      },
      { kind: "blank" },
      { kind: "text", segments: [{ text: "+11.5B", tone: "accent" }, plain(" new tokens counted")] },
      { kind: "blank" },
      { kind: "card", card: firstCard },
    ],
  },
  {
    id: "scan",
    tab: "scan",
    summary: "tokenaires scan reads local logs and prints totals per source and top models. Nothing is uploaded.",
    lines: [
      { kind: "command", text: "tokenaires scan" },
      ...header,
      readingLogs(1600, 1284, [plain("Read 1,284 log files "), dim("· 1,280 unchanged · 0.6s")]),
      { kind: "blank" },
      { kind: "text", segments: [strong("Local scan "), dim("(dry run, nothing was uploaded)")] },
      { kind: "blank" },
      {
        kind: "table",
        columns: [
          { label: "Source", align: "left" },
          { label: "Records", align: "right" },
          { label: "Input", align: "right", wide: true },
          { label: "Output", align: "right", wide: true },
          { label: "Cache read", align: "right", wide: true },
          { label: "Cache write", align: "right", wide: true },
          { label: "Total", align: "right" },
        ],
        rows: [
          { cells: ["Claude Code", "41,208", "1.1M", "22.4M", "8.9B", "470M", "9.4B"] },
          { cells: ["Codex", "12,390", "61M", "9.8M", "2.0B", "0", "2.1B"] },
          { cells: ["Gemini CLI", "1,042", "12M", "1.9M", "18M", "0", "32M"] },
          { cells: ["OpenCode", "0", "0", "0", "0", "0", "0"], tone: "dim" },
          { cells: ["All sources", "54,640", "74M", "34M", "10.9B", "470M", "11.5B"], tone: "strong" },
        ],
      },
      { kind: "blank" },
      {
        kind: "table",
        columns: [
          { label: "Top models", align: "left" },
          { label: "Tokens", align: "right" },
          { label: "Share", align: "right" },
        ],
        rows: [
          { cells: ["claude-opus-5-5", "6.1B", "53.0%"], bars: 0.53 },
          { cells: ["claude-sonnet-5-5", "3.3B", "28.6%"], bars: 0.286 },
          { cells: ["gpt-6.1-sol", "2.1B", "18.1%"], bars: 0.181 },
          { cells: ["gemini-3-pro", "32M", "0.3%"], bars: 0.003 },
        ],
      },
      { kind: "blank" },
      { kind: "text", segments: [{ text: "11,532,104,210", tone: "accentStrong" }, plain(" tokens across 54,640 records")] },
      { kind: "text", segments: [dim("From 2026-03-02 to 2026-11-04")] },
      { kind: "text", segments: [dim("Reasoning tokens (already inside output): 6.2M")] },
    ],
  },
  {
    id: "sync",
    tab: "sync",
    summary:
      "tokenaires sync uploads only new records, shows accepted and already synced counts, and your updated rank. With --quiet it prints nothing unless something goes wrong.",
    lines: [
      { kind: "command", text: "tokenaires sync" },
      ...header,
      {
        kind: "live",
        label: "Checking your account",
        ms: 700,
        bar: false,
        done: [plain("Signed in as "), strong("@you"), dim(" · Billionaire · 11.5B tokens on the board")],
      },
      readingLogs(1400, 1291, [plain("Read 1,291 log files "), dim("· 1,284 unchanged · "), strong("11.6B"), plain(" tokens in 55,062 records "), dim("· 0.7s")]),
      {
        kind: "live",
        label: "Uploading",
        ms: 1300,
        bar: true,
        count: { total: 422, unit: "records" },
        tokens: 96_000_000,
        done: [plain("Uploaded 422 records "), dim("· 0.4s")],
      },
      { kind: "blank" },
      {
        kind: "table",
        columns: resultColumns,
        rows: [
          { cells: ["Accepted", "410"], tone: "accent" },
          { cells: ["Already synced", "12"], tone: "dim" },
        ],
      },
      { kind: "blank" },
      { kind: "text", segments: [{ text: "+96M", tone: "accent" }, plain(" new tokens counted")] },
      { kind: "blank" },
      { kind: "card", card: syncedCard },
      { kind: "blank" },
      { kind: "command", text: "tokenaires sync --quiet" },
    ],
  },
  {
    id: "status",
    tab: "status",
    summary: "tokenaires status shows who you are logged in as, your tier, ranks and progress to the next tier.",
    lines: [
      { kind: "command", text: "tokenaires status" },
      ...header,
      { kind: "live", label: "Fetching your rank", ms: 700, bar: false, done: null },
      { kind: "text", segments: [plain("Logged in as "), strong("@you"), dim(" on https://tokenaires.cc/api/v1", true)] },
      { kind: "blank" },
      { kind: "card", card: syncedCard },
    ],
  },
  {
    id: "schedule",
    tab: "schedule",
    summary: "tokenaires schedule on syncs every 6 hours on macOS with a LaunchAgent. schedule off removes it.",
    lines: [
      { kind: "command", text: "tokenaires schedule on" },
      { kind: "blank" },
      { kind: "text", segments: [{ text: "Scheduled.", tone: "accent" }, plain(" Tokenaires will sync every 6 hours.")] },
      { kind: "text", segments: [dim("/Users/you/Library/LaunchAgents/com.tokenaires.sync.plist")] },
      { kind: "blank" },
      { kind: "command", text: "tokenaires schedule off" },
      { kind: "blank" },
      { kind: "text", segments: [{ text: "Schedule removed.", tone: "accent" }] },
    ],
  },
  {
    id: "login",
    tab: "login",
    summary: "tokenaires login connects this device with a code you approve on GitHub.",
    lines: [{ kind: "command", text: "tokenaires login" }, ...header, ...loginBlock.slice(0, -1)],
  },
  {
    id: "logout",
    tab: "logout",
    summary: "tokenaires logout deletes the saved login and device key.",
    lines: [
      { kind: "command", text: "tokenaires logout" },
      { kind: "text", segments: [{ text: "Logged out.", tone: "accent" }, plain(" This device's key was removed.")] },
    ],
  },
  {
    id: "help",
    tab: "--help",
    summary: "tokenaires --help lists every command and option, including --dry-run and sync --quiet.",
    lines: [
      { kind: "command", text: "tokenaires --help" },
      { kind: "text", segments: [plain("Usage: tokenaires [options] [command]")] },
      { kind: "blank" },
      { kind: "text", segments: [plain("Put your AI coding token usage on the Tokenaires board.")] },
      { kind: "blank" },
      { kind: "text", segments: [plain("Options:")] },
      { kind: "text", segments: [plain("  -v, --version    "), dim("output the version number")] },
      { kind: "text", segments: [plain("  --dry-run        "), dim("same as scan: read local logs and upload nothing")] },
      { kind: "text", segments: [plain("  -h, --help       "), dim("display help for command")] },
      { kind: "blank" },
      { kind: "text", segments: [plain("Commands:")] },
      { kind: "text", segments: [plain("  login            "), dim("connect this device to your Tokenaires account")] },
      { kind: "text", segments: [plain("  scan|dry-run     "), dim("read local logs and print totals without uploading anything")] },
      { kind: "text", segments: [plain("  sync [options]   "), dim("upload new usage records and show your rank")] },
      { kind: "text", segments: [plain("  status           "), dim("show login state, rank and tier progress")] },
      { kind: "text", segments: [plain("  logout           "), dim("remove the saved login and device key")] },
      { kind: "text", segments: [plain("  schedule <mode>  "), dim("sync automatically every 6 hours")] },
    ],
  },
];

export const TERMINAL_VERSION = VERSION;

export const TERMINAL_TIMING = {
  typeMs: 45,
  afterCommandMs: 320,
  lineGapMs: 70,
  afterLiveMs: 120,
  nextScriptMs: 2600,
  spinnerMs: 80,
} as const;

export interface TimedLine {
  index: number;
  at: number;
}

export interface ScriptTimeline {
  lines: TimedLine[];
  typing: { index: number; start: number; length: number }[];
  endsAt: number;
}

export function timeline(script: TerminalScript): ScriptTimeline {
  const lines: TimedLine[] = [];
  const typing: ScriptTimeline["typing"] = [];
  let at = 0;
  script.lines.forEach((line, index) => {
    lines.push({ index, at });
    if (line.kind === "command") {
      typing.push({ index, start: at, length: line.text.length });
      at += line.text.length * TERMINAL_TIMING.typeMs + TERMINAL_TIMING.afterCommandMs;
    } else if (line.kind === "live") {
      at += line.ms + TERMINAL_TIMING.afterLiveMs;
    } else {
      at += TERMINAL_TIMING.lineGapMs;
    }
  });
  return { lines, typing, endsAt: at };
}

export const TERMINAL_TIMELINES: ScriptTimeline[] = TERMINAL_SCRIPTS.map(timeline);

export interface PlayerState {
  active: number;
  t: number;
  autoplay: boolean;
  run: number;
}

export type PlayerAction = { type: "tick"; delta: number } | { type: "select"; index: number } | { type: "replay" };

export const INITIAL_PLAYER: PlayerState = { active: 0, t: 0, autoplay: true, run: 0 };

export function isIdle(state: PlayerState): boolean {
  const end = TERMINAL_TIMELINES[state.active]?.endsAt ?? 0;
  return !state.autoplay && state.t >= end;
}

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  if (action.type === "select") return { active: action.index, t: 0, autoplay: false, run: state.run + 1 };
  if (action.type === "replay") return { ...state, t: 0, autoplay: false, run: state.run + 1 };
  const t = state.t + action.delta;
  const end = (TERMINAL_TIMELINES[state.active]?.endsAt ?? 0) + TERMINAL_TIMING.nextScriptMs;
  if (!state.autoplay || t < end) return { ...state, t };
  if (state.active < TERMINAL_SCRIPTS.length - 1) return { active: state.active + 1, t: 0, autoplay: true, run: state.run + 1 };
  return { ...state, t, autoplay: false };
}

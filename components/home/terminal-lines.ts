export type TerminalLine =
  | { kind: "command"; text: string }
  | { kind: "muted"; text: string }
  | { kind: "ok"; text: string }
  | { kind: "row"; label: string; detail: string; value: string }
  | { kind: "progress"; text: string };

export const TERMINAL_LINES: TerminalLine[] = [
  { kind: "command", text: "npx tokenaires" },
  { kind: "muted", text: "Open github.com/login/device and enter K7Q2-9DXF" },
  { kind: "ok", text: "Signed in as @you" },
  { kind: "row", label: "Claude Code", detail: "41,208 records", value: "9.4B" },
  { kind: "row", label: "Codex", detail: "12,390 records", value: "2.1B" },
  { kind: "progress", text: "Uploading 53,598 records" },
  { kind: "ok", text: "Rank #14 all time · Billionaire" },
];

export const TERMINAL_TIMING = {
  typeMs: 55,
  lineGapMs: 420,
  progressMs: 1100,
} as const;

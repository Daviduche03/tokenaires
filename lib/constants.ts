export const SITE = {
  name: "Tokenaires",
  description: "The rich list for developers, ranked by the AI tokens they burn.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:7021",
  repoUrl: "https://github.com/appdever01/tokenaires",
  installCommand: "npx tokenaires",
} as const;

export const BRAND = {
  markSrc: "/brand/tokenaires-icon.svg",
} as const;

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7020/api/v1";

export const PERIOD_LABELS = {
  all: "All time",
  month: "30 days",
  week: "7 days",
} as const;

export const SOURCE_FILTER_LABELS = {
  all: "All tools",
  "claude-code": "Claude Code",
  codex: "Codex",
} as const;

export const QUERY_STALE_MS = 30_000;
export const COPY_RESET_MS = 1600;
export const HEATMAP_WEEKS = 53;

import { AGENT_SOURCE_LABELS } from "@tokenaires/contracts";

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

export const PERIOD_SHORT_LABELS = {
  all: "All",
  month: "30d",
  week: "7d",
} as const;

export const SOURCE_FILTER_LABELS = {
  all: "All tools",
  ...AGENT_SOURCE_LABELS,
} as const;

export const JOIN_TOAST = {
  id: "join",
  copiedTitle: "Install command copied",
  copiedDescription: "Paste it in your terminal and sign in with GitHub to take your seat on the list.",
  manualTitle: `Run ${SITE.installCommand} in your terminal`,
  manualDescription: "Your browser blocked the clipboard. Type the command, then sign in with GitHub.",
} as const;

export const QUERY_STALE_MS = 30_000;
export const COPY_RESET_MS = 1600;
export const HEATMAP_WEEKS = 53;

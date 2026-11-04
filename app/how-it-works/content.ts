export const SIGN_IN = {
  title: "Sign in with GitHub",
  points: [
    "The CLI shows a short code and opens github.com/login/device. Enter the code and approve.",
    "Your public GitHub profile becomes your name, handle and avatar on the list.",
    "The GitHub token is used once to read your profile and is never stored.",
  ],
} as const;

export const READ = {
  title: "What gets read",
  lead: "The usage logs your coding agents already keep on your machine.",
  note: "Only token counts, model, time and the tool's own record ID. Prompts and code are skipped.",
} as const;

export const SENT = {
  title: "What gets sent",
  points: [
    "Per call: tool, record ID, model, time, and input, output and cache token counts.",
    "Never prompts, replies, code, file paths, project names or branch names.",
  ],
  scan: "npx tokenaires scan",
  scanNote: "shows your totals locally before you send anything.",
} as const;

export const RANKING = {
  title: "Ranking",
  points: [
    "Net worth is input, output, cache reads and cache writes added together.",
    "All time, 30 days and 7 days boards, filtered by tool.",
    "Movement shows how far you climbed on the all time board this week.",
  ],
} as const;

export const HONEST = {
  title: "How the list stays honest",
  lead: "The server adds up every total. The CLI only sends raw records.",
  checks: [
    {
      key: "owner",
      title: "One owner per record",
      text: "Every record ID can belong to one account. Copy someone else's logs and both accounts get flagged.",
    },
    {
      key: "signed",
      title: "Signed uploads",
      text: "Uploads are signed by a key that lives on your machine, and each signature works once.",
    },
    {
      key: "refused",
      title: "Impossible records refused",
      text: "Records from the future, from before a tool or model existed, or with impossible token counts are refused.",
    },
    {
      key: "review",
      title: "Spikes get reviewed",
      text: "Unusual spikes put a profile under review. It stays on the list with a marker until it is checked.",
    },
  ],
} as const;

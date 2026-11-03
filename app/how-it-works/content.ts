export const HOW_IT_WORKS = [
  {
    title: "Sign in with GitHub",
    points: [
      "The CLI shows a short code and opens github.com/login/device. Enter the code and approve.",
      "Your public GitHub profile becomes your name, handle and avatar on the list.",
      "The GitHub token is used once to read your profile and is never stored.",
    ],
  },
  {
    title: "What gets read",
    points: [
      "Claude Code session logs in ~/.claude/projects.",
      "Codex session logs in ~/.codex/sessions.",
      "Only the token counts, model name, time and message ID from each response.",
    ],
  },
  {
    title: "What gets sent",
    points: [
      "Per message: tool, message ID, model, time, and input, output and cache token counts.",
      "Never prompts, replies, code, file paths, project names or branch names.",
      "Run npx tokenaires scan to see your totals locally before you send anything.",
    ],
  },
  {
    title: "How the list stays honest",
    points: [
      "The server adds up every total. The CLI only sends raw records.",
      "Every message ID can belong to one account. Copy someone else's logs and both accounts get flagged.",
      "Uploads are signed by a key that lives on your machine, and each signature works once.",
      "Records from the future, from before a tool or model existed, or with impossible token counts are refused.",
      "Unusual spikes put a profile under review. It stays on the list with a marker until it is checked.",
    ],
  },
  {
    title: "Ranking",
    points: [
      "Net worth is input, output, cache reads and cache writes added together.",
      "All time, 30 days and 7 days boards, filtered by tool.",
      "Movement shows how far you climbed on the all time board this week.",
      "Tiers: Thousandaire at 1K, Millionaire at 1M, Billionaire at 1B, Trillionaire at 1T.",
    ],
  },
] as const;

# tokenaires

The command line client for Tokenaires, the public rich list for developers ranked by AI tokens used.

It reads the usage logs your coding agents already keep on your machine, and uploads one small numeric record per model call. Your prompts, code and file paths never leave your computer.

## Install and run

```sh
npx tokenaires
```

The first run logs you in, then syncs. Requires Node.js 20 or newer.

To install it globally instead:

```sh
npm install -g tokenaires
tokenaires
```

## Commands

| Command | What it does |
| --- | --- |
| `tokenaires` | Logs in if needed, then syncs. |
| `tokenaires login` | Connects this device with a code you approve in the browser. |
| `tokenaires scan` | Reads local logs and prints totals per source, top models, record count and date range. Sends nothing and needs no login or network. Also available as `tokenaires --dry-run`. |
| `tokenaires sync [--quiet]` | Uploads new records, then prints accepted, already synced and rejected counts, your rank and your profile link. |
| `tokenaires status` | Shows login state, handle, rank, tier and progress to the next tier. |
| `tokenaires logout` | Deletes the saved login and device key. |
| `tokenaires schedule on` | macOS: installs a LaunchAgent that runs `sync --quiet` every 6 hours. Linux: prints a crontab line to add. |
| `tokenaires schedule off` | macOS: unloads and removes the LaunchAgent. Linux: prints the line to remove. |

The LaunchAgent lives at `~/Library/LaunchAgents/com.tokenaires.sync.plist` and points at the Node binary and script you ran it with. If you used `npx`, install globally first so the path stays valid.

## What is read

Everything is read locally and only line by line.

- **Claude Code:** every `*.jsonl` file under `$CLAUDE_CONFIG_DIR/projects` when that variable is set, otherwise under `~/.claude/projects` and `~/.config/claude/projects`, including nested subagent folders. Only assistant lines with a message id and usage block are used. Streamed duplicates are merged, keeping the final line.
- **Codex:** every `*.jsonl` file under `$CODEX_HOME/sessions` and `$CODEX_HOME/archived_sessions` (`CODEX_HOME` defaults to `~/.codex`). Per call usage comes from `token_usage_record` lines. A `token_count` event is used only when no usage record covers that call, so nothing is counted twice.

## What is uploaded

Exactly these fields per record, and nothing else:

| Field | Example |
| --- | --- |
| `source` | `claude-code` or `codex` |
| `recordId` | the message and request id, or the Codex session id and line number |
| `model` | `claude-opus-5-5` |
| `occurredAt` | `2026-11-03T10:15:00.000Z` |
| `inputTokens` | uncached input tokens |
| `outputTokens` | output tokens |
| `cacheReadTokens` | cached input tokens read |
| `cacheWriteTokens` | input tokens written to cache |
| `reasoningTokens` | reasoning tokens, already included in output |

Never uploaded: prompts, responses, code, tool output, working directories, file paths, project names, git branches or session titles. A test in this repository checks that the upload payload contains only the fields above.

Each sync asks the server for your latest record per source and sends records from 48 hours before that point onward. The server ignores records it already has.

## Privacy

- Run `tokenaires scan` any time to see exactly what would be counted, with no network access.
- Your login lives in `$XDG_CONFIG_HOME/tokenaires/config.json` (default `~/.config/tokenaires/config.json`), readable only by you (file mode 0600, folder 0700). It holds the API address, your access token, the device id, the device private key and your handle.
- `tokenaires logout` deletes that file.

## Anti tamper

- At login the CLI creates an Ed25519 key pair for this device. Only the public key is sent to the server. The private key stays in your config file.
- Every upload is signed. The signed message is the timestamp, a dot, and the SHA-256 of the exact request body. The server checks the signature, the device and the timestamp, so a batch cannot be altered or replayed later.
- Record ids come from the agents' own logs, so the same call cannot be counted twice or claimed by two accounts.
- The server also rejects records dated in the future, records older than the agent or model, and implausible token ratios. The sync summary lists each rejection reason.

## Configuration

| Variable | Default |
| --- | --- |
| `TOKENAIRES_API_URL` | `https://api.tokenaires.com/api/v1` |
| `TOKENAIRES_WEB_URL` | `https://tokenaires.com` |
| `TOKENAIRES_NO_BROWSER` | unset. Set it to skip opening the browser at login. |
| `XDG_CONFIG_HOME` | `~/.config` |
| `CLAUDE_CONFIG_DIR` | unset. Comma separated list of Claude config folders. |
| `CODEX_HOME` | `~/.codex` |

For local development against the backend:

```sh
TOKENAIRES_API_URL=http://localhost:7020/api/v1 TOKENAIRES_WEB_URL=http://localhost:7021 node dist/cli.js
```

## Development

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
node dist/cli.js scan
```

The build is a single self contained file at `dist/cli.js`.

# Tokenaires

The rich list for developers, ranked by the AI tokens they burn in Claude Code and Codex.

```sh
npx tokenaires
```

The CLI signs you in with GitHub, reads the usage logs your agents already keep, and uploads token counts only. Prompts, code and file paths never leave your machine.

## Repository structure

`main` holds this overview. Each surface lives on its own branch and is cloned into a folder of the same name.

| Branch | Contents | Local address |
| --- | --- | --- |
| `main` | Project overview | none |
| [`frontend`](https://github.com/appdever01/tokenaires/tree/frontend) | Next.js 16 site: board, top three, profiles | http://localhost:7021 |
| [`backend`](https://github.com/appdever01/tokenaires/tree/backend) | NestJS 11 API, PostgreSQL, Drizzle, shared contracts | http://localhost:7020/api/v1 |
| [`cli`](https://github.com/appdever01/tokenaires/tree/cli) | The `tokenaires` npm package | none |

## Clone

```sh
git clone --branch main --single-branch https://github.com/appdever01/tokenaires.git tokenaires
cd tokenaires
git clone --branch backend --single-branch https://github.com/appdever01/tokenaires.git backend
git clone --branch frontend --single-branch https://github.com/appdever01/tokenaires.git frontend
git clone --branch cli --single-branch https://github.com/appdever01/tokenaires.git cli
```

Each folder is its own Git repository with its own README, dependencies and checks.

## Run locally

Requires Node.js 22 or newer, pnpm and PostgreSQL 16 or newer.

```sh
cd backend && pnpm install && cp .env.example .env && createdb tokenaires && pnpm db:migrate && pnpm start:dev
cd frontend && pnpm install && cp .env.example .env.local && pnpm dev
cd cli && pnpm install && pnpm build && TOKENAIRES_API_URL=http://localhost:7020/api/v1 node dist/cli.js
```

## License

MIT

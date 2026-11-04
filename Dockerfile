FROM node:22-slim AS build
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm -C packages/contracts build && pnpm build

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=7020
COPY --from=build /app /app
EXPOSE 7020
CMD ["sh", "-c", "pnpm db:migrate && node dist/main.js"]

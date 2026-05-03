# Deployment

This project deploys to [Railway](https://railway.com) using [Railpack](https://railpack.com) as the builder.

## Prerequisites

- [Railway CLI](https://docs.railway.com/guides/cli) installed and authenticated (`railway login`)
- A PostgreSQL database. The simplest option is to add Railway's managed Postgres
  plugin to your project; it provisions `DATABASE_URL` automatically as a service variable.

## Provisioning Postgres on Railway

```bash
# From the repo root, with the project linked
railway add --database postgres
```

Then reference its `DATABASE_URL` from the web service:

```bash
railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
```

(The `${{Postgres.DATABASE_URL}}` reference is resolved at runtime by Railway.)

## Environment Variables

Set these on the Railway web service before deploying:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `${{Postgres.DATABASE_URL}}` |
| `BETTER_AUTH_SECRET` | Random secret, minimum 32 characters | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public URL of the deployed service | `https://kaheteyn.up.railway.app` |
| `CORS_ORIGIN` | Allowed origin for CORS (usually same as `BETTER_AUTH_URL`) | `https://kaheteyn.up.railway.app` |
| `NODE_ENV` | Runtime environment | `production` |
| `RAILPACK_NO_SPA` | Prevents Railpack from serving as a static site | `1` |

```bash
railway variables \
  --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}' \
  --set "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" \
  --set "BETTER_AUTH_URL=https://your-domain.up.railway.app" \
  --set "CORS_ORIGIN=https://your-domain.up.railway.app" \
  --set "NODE_ENV=production" \
  --set "RAILPACK_NO_SPA=1"
```

## Build & Start

| Step | Command |
|---|---|
| Install | `bun install --frozen-lockfile` (auto-detected from `bun.lock`) |
| Build | `bun run --cwd apps/web build` |
| Start | `bun run --cwd packages/db db:migrate && bun run apps/web/server.ts` |

The start command runs Drizzle migrations against `DATABASE_URL` before booting the
server, so a fresh Postgres instance is brought up to schema on first deploy.

The build produces `apps/web/dist/server/server.js` (a Web Fetch API handler).
`apps/web/server.ts` wraps it with `Bun.serve()` and reads `PORT` from the
environment (set automatically by Railway).

## Deploy

```bash
# Link to your Railway project (first time only)
railway link --project <project-id>

# Deploy
railway up --detach -m "your message"
```

## Manual Migrations

Migrations run automatically on every deploy via the start command. To run them
manually against any environment:

```bash
DATABASE_URL=postgres://... bun run db:migrate
```

## Local Development

Spin up a local Postgres with Docker:

```bash
docker compose up -d postgres
bun run db:migrate
bun run dev
```

The default `apps/web/.env` points `DATABASE_URL` at
`postgres://kaheteyn:kaheteyn@localhost:5432/kaheteyn`, which matches the
`docker-compose.yml` defaults.

## Relevant Files

| File | Purpose |
|---|---|
| `railway.json` | Railway service config (builder, healthcheck, restart policy) |
| `railpack.json` | Railpack build config (custom build command, start command) |
| `docker-compose.yml` | Local Postgres for development |
| `apps/web/server.ts` | Production server entrypoint (`Bun.serve` wrapper) |

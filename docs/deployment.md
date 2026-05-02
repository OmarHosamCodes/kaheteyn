# Deployment

This project deploys to [Railway](https://railway.com) using [Railpack](https://railpack.com) as the builder.

## Prerequisites

- [Railway CLI](https://docs.railway.com/guides/cli) installed and authenticated (`railway login`)
- A [Turso](https://turso.tech) database provisioned

## Environment Variables

Set these on the Railway service before deploying:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Turso database URL | `libsql://your-db.turso.io` |
| `BETTER_AUTH_SECRET` | Random secret, minimum 32 characters | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public URL of the deployed service | `https://kaheteyn.up.railway.app` |
| `CORS_ORIGIN` | Allowed origin for CORS (usually same as `BETTER_AUTH_URL`) | `https://kaheteyn.up.railway.app` |
| `NODE_ENV` | Runtime environment | `production` |
| `RAILPACK_NO_SPA` | Prevents Railpack from serving as a static site | `1` |

```bash
railway variable set \
  DATABASE_URL=libsql://... \
  BETTER_AUTH_SECRET=$(openssl rand -base64 32) \
  BETTER_AUTH_URL=https://your-domain.up.railway.app \
  CORS_ORIGIN=https://your-domain.up.railway.app \
  NODE_ENV=production \
  RAILPACK_NO_SPA=1
```

## Build & Start

| Step | Command |
|---|---|
| Install | `bun install --frozen-lockfile` (auto-detected from `bun.lock`) |
| Build | `bun run --cwd apps/web build` |
| Start | `bun run apps/web/server.ts` |

The build produces `apps/web/dist/server/server.js` (a Web Fetch API handler). `apps/web/server.ts` wraps it with `Bun.serve()` and reads `PORT` from the environment (set automatically by Railway).

## Deploy

```bash
# Link to your Railway project (first time only)
railway link --project <project-id>

# Deploy
railway up --detach -m "your message"
```

## Database Migrations

Run migrations against the production database before or after deploying:

```bash
# From the repo root, targeting production env vars
DATABASE_URL=libsql://... bun run db:migrate
```

## Relevant Files

| File | Purpose |
|---|---|
| `railway.json` | Railway service config (builder, healthcheck, restart policy) |
| `railpack.json` | Railpack build config (custom build command, start command) |
| `apps/web/server.ts` | Production server entrypoint (`Bun.serve` wrapper) |

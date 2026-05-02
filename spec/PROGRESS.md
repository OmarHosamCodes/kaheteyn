# Kaheteyn — Implementation Progress

_Last updated: 2026-05-03_

This file tracks progress against [`SPEC.md`](./SPEC.md). Mark items as you go.

## Legend
- [x] Done
- [~] Partial / in progress
- [ ] Not started

---

## 1. Foundation & Infrastructure

- [x] Monorepo setup (bun + nx + TanStack Start + tRPC + Drizzle + Better Auth + Base UI)
- [x] Tajawal font + RTL root layout (`<html lang="ar" dir="rtl">`) — `apps/web/src/routes/__root.tsx`
- [x] Brand color tokens (Palestinian green primary, red destructive accents) in `packages/ui/src/styles/globals.css`
- [x] Print CSS (A4 landscape, hide `.no-print`) in `globals.css`
- [x] Toaster configured RTL via `sonner`
- [x] `ConfirmProvider` + `useConfirm` hook (`apps/web/src/components/confirm.tsx`)
- [x] `FileUpload` component (data-URL, 4MB limit, image/PDF preview)
- [x] `Logo`, `Sidebar` components
- [x] CSV export helper with UTF-8 BOM (`apps/web/src/lib/csv.ts`)
- [x] Arabic formatters: months, USD (cents), date, status labels (`apps/web/src/lib/format.ts`)

## 2. Database Schema (Drizzle)

- [x] `user` extended with `username` + `displayUsername`
- [x] `child`, `sponsor`, `payment`, `receipt`, `auditLog` tables
- [x] Schema barrel re-exports
- [x] `bun db:push` executed against local DB

## 3. Authentication

- [x] Better Auth `username` plugin enabled (minPasswordLength 6, autoSignIn)
- [x] `usernameClient()` plugin on web
- [x] `authMiddleware` server middleware + `getUser` server fn
- [x] Login page with Arabic form + demo creds hint
- [x] `_app` pathless layout enforces auth → redirects to `/login`
- [x] Sign-out from sidebar
- [x] Index route `/` → `/dashboard`
- [x] Idempotent seed script (`bun seed`) for admin + demo data (replaces auto-bootstrap)

## 4. tRPC API Surface

- [x] `children` router (list/byId/create/update/remove/restore)
- [x] `sponsors` router (with KPIs, force delete)
- [x] `payments` router (auto-syncs child sponsorship, setFinancial, monthlyTrend)
- [x] `receipts` router
- [x] `audit` router (filters)
- [x] `dashboard` router — summary, latestPayments, latestReceipts, readyToDisburse, alerts, followUp, monthlyReport
- [x] Helpers: `makeId(prefix)`, `logAudit(...)`

## 5. UI Primitives (`@kaheteyn/ui`)

- [x] `dialog`, `table`, `badge`, `textarea`, `select` (native), button/card/input/label/dropdown-menu/mode-toggle

## 6. Web Routes

- [x] `__root.tsx` — RTL Arabic shell + providers
- [x] `index.tsx` → `/dashboard`
- [x] `login.tsx` — username login
- [x] `_app.tsx` — auth gate + sidebar layout
- [x] `_app/dashboard.tsx` — KPIs, alerts, ready-to-disburse, latest payments/receipts, monthly trend
- [x] `_app/children/index.tsx` — list/search/filter, add/edit dialog, delete confirm, CSV
- [x] `_app/children/$id.tsx` — full profile, payments history, files, edit, delete, print
- [x] `_app/sponsors.tsx` — list with KPIs, add/edit dialog, force delete, CSV
- [x] `_app/payments.tsx` — list/filter by month/sponsor/child/status, add/edit, setFinancial, delete, CSV
- [x] `_app/receipts.tsx` — list, attach receipt to payment dialog, edit, delete, CSV
- [x] `_app/reports.tsx` — monthly report view + CSV + print
- [x] `_app/follow-up.tsx` — unsponsored, no-payment-this-month, missing receipts, incomplete profiles
- [x] `_app/audit.tsx` — read-only audit log with filters + CSV

## 7. Cross-Cutting Features

- [x] Audit logging on all create/update/delete via `logAudit(...)`
- [x] Cascade rules: delete child → delete payments; force-delete sponsor → null child sponsorship + delete payments
- [x] Auto-set child to sponsored when payment created
- [x] One-sponsor-per-child enforced (single `sponsorId` FK)
- [x] Alerts severity rules
- [x] CSV export buttons on all list pages (UTF-8 BOM)
- [x] Print buttons on child profile + reports (`window.print()` + `.no-print`)
- [x] PDF child profile via `window.print()`
- [x] File upload size enforcement inside `FileUpload`

## 8. Verification

- [x] `bunx tsc --noEmit -p apps/web/tsconfig.json` — clean
- [x] `bunx tsc --noEmit -p packages/api/tsconfig.json` — clean
- [x] `bun db:push` — synced
- [x] `bun seed` — admin (`admin` / `123456`) + demo data idempotent

## 9. Key Files Reference

| Concern | Path |
|---|---|
| Spec | `spec/SPEC.md` |
| Schema | `packages/db/src/schema/{auth,app,index}.ts` |
| Auth server | `packages/auth/src/index.ts` |
| API root | `packages/api/src/routers/index.ts` |
| API helpers | `packages/api/src/lib.ts` |
| Auth client | `apps/web/src/lib/auth-client.ts` |
| Server fns | `apps/web/src/functions/get-user.ts` |
| Middleware | `apps/web/src/middleware/auth.ts` |
| Shared UI | `packages/ui/src/components/*` |
| Globals CSS | `packages/ui/src/styles/globals.css` |
| Web helpers | `apps/web/src/lib/{format,csv}.ts` |
| Shared components | `apps/web/src/components/{confirm,file-upload,logo,sidebar,page}.tsx` |
| Routes | `apps/web/src/routes/{__root,index,login,_app}.tsx`, `routes/_app/*` |
| Seed | `scripts/seed.ts` (run via `bun seed`) |

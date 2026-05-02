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

- [x] `user` extended with `username` + `displayUsername` (`packages/db/src/schema/auth.ts`)
- [x] `child` table — full demographics, guardian, sponsorship, files, notes (`packages/db/src/schema/app.ts`)
- [x] `sponsor` table — name, phone, paymentMethod, notes
- [x] `payment` table — child, sponsor, monthLabel/monthKey, amountUsd (cents), dateSent, paymentStatus, financialStatus, receiptFile
- [x] `receipt` table — paymentId, document (data URL), dateReceived, notes
- [x] `auditLog` table — actor, entityType, entityId, action, oldValue/newValue JSON, timestamp
- [x] Schema barrel re-exports (`packages/db/src/schema/index.ts`)
- [ ] `bun db:push` executed against local DB (run before first launch)

## 3. Authentication

- [x] Better Auth `username` plugin enabled, `minPasswordLength: 6`, `autoSignIn: true` (`packages/auth/src/index.ts`)
- [x] `usernameClient()` plugin on web (`apps/web/src/lib/auth-client.ts`)
- [x] `authMiddleware` server middleware (`apps/web/src/middleware/auth.ts`)
- [x] `getUser` server function (`apps/web/src/functions/get-user.ts`)
- [x] Login page with Arabic form, demo creds hint (`apps/web/src/routes/login.tsx`)
- [x] Bootstrap server fn auto-creates `admin` / `123456` + demo data on first load (`apps/web/src/functions/bootstrap.ts`)
- [x] `_app` pathless layout enforces auth, redirects unauthenticated users to `/login`
- [x] Sign-out from sidebar
- [x] Index route `/` redirects to `/dashboard`

## 4. tRPC API Surface

- [x] `children` router — list (filters: search/status/residence/schoolStage/sponsorId), byId, create, update, remove (cascade payments), restore
- [x] `sponsors` router — list (with childrenCount + totalDisbursedCents), byId, create, update, remove (force flag)
- [x] `payments` router — list (filters), byId, create (auto-syncs child to sponsored), update, setFinancial, remove, monthlyTrend
- [x] `receipts` router — list, byPayment, create, update, remove
- [x] `audit` router — list (filters: entityType/actorId/action/date range)
- [x] `dashboard` router — summary, latestPayments, latestReceipts, readyToDisburse, alerts, followUp, monthlyReport (stub)
- [x] `seed` router — bootstrap mutation (idempotent admin + demo data)
- [x] Helpers: `makeId(prefix)` (CH-/SP-/PAY-/REC-/AUD-) and `logAudit(...)` in `packages/api/src/lib.ts`

## 5. UI Primitives (`@kaheteyn/ui`)

- [x] `dialog` (Base UI)
- [x] `table`
- [x] `badge` (default/success/warning/destructive/info/outline)
- [x] `textarea`
- [x] `select` (native, styled)
- [x] Existing: `button`, `card`, `input`, `label`, `dropdown-menu`, `mode-toggle`

## 6. Web Routes

- [x] `__root.tsx` — RTL Arabic shell, providers, Toaster
- [x] `index.tsx` — redirect → `/dashboard`
- [x] `login.tsx` — username login, auto-bootstrap on mount
- [x] `_app.tsx` — auth gate + sidebar layout
- [x] `_app/dashboard.tsx` — KPIs, alerts, ready-to-disburse, latest payments/receipts, monthly trend chart
- [ ] `_app/children.tsx` — list/search/filter, add/edit dialog, delete confirm
- [ ] `_app/children/$id.tsx` — full profile, payments history, files, edit, delete, print
- [ ] `_app/sponsors.tsx` — list with KPIs (childrenCount, totalDisbursed), add/edit dialog, delete with force
- [ ] `_app/payments.tsx` — list/filter by month/sponsor/child/status, add/edit dialog, set financial status, delete
- [ ] `_app/receipts.tsx` — list, attach receipt to payment dialog, edit, delete
- [ ] `_app/reports.tsx` — monthly report view + CSV export, print
- [ ] `_app/follow-up.tsx` — unsponsored, no-payment-this-month, payments without receipts, incomplete profiles
- [ ] `_app/audit.tsx` — read-only audit log table with filters

## 7. Cross-Cutting Features

- [x] Audit logging on all create/update/delete via `logAudit(...)`
- [x] Cascade rules: delete child → delete payments; delete sponsor (force) → null child sponsorship + delete payments
- [x] Auto-set child to sponsored when payment created
- [x] One-sponsor-per-child enforced at schema (`sponsorId` single FK)
- [x] Alerts severity rules: critical (>3d missing receipt OR 2+ months no payment), warning, info
- [ ] CSV export buttons wired on each list page
- [ ] Print buttons on child profile + reports
- [ ] PDF child profile via `window.print()`
- [ ] File upload size enforcement surfaced consistently (currently only inside `FileUpload`)

## 8. Outstanding / To-Do

1. Implement remaining 8 web pages (children list/detail, sponsors, payments, receipts, reports, follow-up, audit).
2. Run `bun db:push` and verify Drizzle migrations.
3. `nx run-many -t build check-types` — fix any type errors (notably `seedRouter` is currently unused since bootstrap was moved to a server fn; consider removing or wiring the publicProcedure variant).
4. Smoke test: visit `/` → redirects to `/dashboard` → `/login` → bootstrap fires → log in `admin/123456` → land on dashboard with seeded data.
5. Verify Arabic RTL alignment and Tajawal font load on all pages.
6. Wire CSV export buttons + print stylesheet usage on Reports + child profile.

## 9. Key Files Reference

| Concern | Path |
|---|---|
| Spec | `spec/SPEC.md` |
| Schema | `packages/db/src/schema/{auth,app,index}.ts` |
| Auth server | `packages/auth/src/index.ts` |
| API root | `packages/api/src/routers/index.ts` |
| API helpers | `packages/api/src/lib.ts` |
| Auth client | `apps/web/src/lib/auth-client.ts` |
| Server fns | `apps/web/src/functions/{bootstrap,get-user}.ts` |
| Middleware | `apps/web/src/middleware/auth.ts` |
| Shared UI | `packages/ui/src/components/*` |
| Globals CSS | `packages/ui/src/styles/globals.css` |
| Web helpers | `apps/web/src/lib/{format,csv}.ts` |
| Shared components | `apps/web/src/components/{confirm,file-upload,logo,sidebar}.tsx` |
| Routes | `apps/web/src/routes/{__root,index,login,_app}.tsx`, `routes/_app/*` |

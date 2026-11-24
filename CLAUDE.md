# CLAUDE.md — Preppal

Preppal (@preppal.swl) sells fresh, ready-to-cook prep (ginger-garlic paste, peeled garlic, masala bases,
marinated fish…) in Sahiwal, Pakistan. Orders are taken a night ahead (cutoff 11 PM PKT) and delivered by
5 PM the next day. Cash on delivery only. Multi-city later.

## Start every session like this
1. Read `docs/PROGRESS.md` (latest entry first) and the **current phase** in `docs/ROADMAP.md`.
2. Open only the files the task needs. `docs/ARCHITECTURE.md` maps where things live — don't re-read the codebase.
3. Before changing the data model read `docs/DATA_MODEL.md`; before adding endpoints read `docs/API.md`.

## End every session like this
1. `pnpm typecheck && pnpm test && pnpm lint` must pass.
2. Append a dated entry to `docs/PROGRESS.md`: **Done / In progress / Next / Blockers**.
3. Tick finished items in `docs/ROADMAP.md`.
4. Any design choice that a future session might question → new ADR in `docs/DECISIONS.md`.
5. Schema changed? `pnpm db:generate`, commit the migration, update `docs/DATA_MODEL.md`.

## Stack (don't swap without an ADR)
- pnpm workspaces + Turborepo · TypeScript 5.9 strict · Biome (lint + format)
- `apps/api` — Hono on Cloudflare Workers, Drizzle ORM, D1 (SQLite), R2 (images), Zod
- `apps/web` — storefront: React 19, Vite 8, TanStack Router (code-based) + Query, Tailwind v4, Zustand (cart)
- `apps/admin` — same frontend stack, behind Cloudflare Access
- `packages/shared` — Zod schemas, DTO types, order status machine, time/money helpers (used by all apps)
- `packages/db` — Drizzle schema, migrations, seed SQL

## Commands
```bash
pnpm install
pnpm db:migrate:local && pnpm db:seed:local     # local D1 in .wrangler/state
pnpm --filter @preppal/api dev                  # API on :8787 (needs apps/api/.dev.vars, copy .dev.vars.example)
pnpm --filter @preppal/web dev                  # storefront on :5173 (proxies /api → :8787)
pnpm --filter @preppal/admin dev                # admin on :5174 (DEV_ADMIN_EMAIL bypasses Access locally)
pnpm typecheck | pnpm test | pnpm lint | pnpm build
pnpm db:generate                                # after editing packages/db/src/schema.ts
```

## Rules
- **Money** = integer PKR. **Times** = ISO UTC strings; **delivery dates** = `YYYY-MM-DD` in Asia/Karachi. Use helpers in `packages/shared/src/time.ts`.
- **Validate at every boundary** with Zod schemas from `@preppal/shared`. Request/response shapes live there, not in apps.
- **Never trust client prices.** The API recomputes every price at order time.
- **Errors**: throw `HttpError` (apps/api/src/lib/errors.ts) → `{ error: { code, message, details? } }`. Never leak stack traces.
- **Order status** changes only via `ORDER_TRANSITIONS` (packages/shared/src/order-status.ts) and always write `order_status_history`.
- **Stock**: conditional decrement in a D1 batch (see services/orders.ts). Cancel → restock.
- **Free-plan CPU budget is 10 ms/request**: no password hashing, no image processing, no SSR in Workers. Resize images in the browser (admin `lib/image.ts`).
- **Portability**: business logic in `services/`, not route handlers; DB access through Drizzle. Moving to Node + Postgres (Railway) should only touch `drizzle()` setup, R2 calls and wrangler config. See ADR-002.
- **Admin routes** live under `/api/admin/*` and are protected by `requireAdmin()`; owner-only actions check `role`.
- **Design**: use Tailwind tokens from `src/styles.css` (`forest`, `sage`, `terra`, `cream`, `font-display`). Don't hardcode new colours. See `docs/DESIGN.md`.
- No `any`. No default exports except Worker entries and configs. Keep files < ~300 lines; split by feature.
- Never commit `.dev.vars` or secrets. Secrets go in `wrangler secret put`.

## Where things are
| Need | Go to |
|---|---|
| Endpoint list | docs/API.md, apps/api/src/routes/** |
| Order placement logic | apps/api/src/services/orders.ts |
| Catalog queries | apps/api/src/services/catalog.ts |
| Admin auth (Cloudflare Access JWT) | apps/api/src/middleware/admin-auth.ts |
| Alerts (Telegram / Resend email) | apps/api/src/lib/notify.ts |
| Tables | packages/db/src/schema.ts |
| Seed (real Preppal catalog) | packages/db/seed/seed.sql |
| Storefront pages | apps/web/src/routes/*, router in apps/web/src/router.tsx |
| Admin pages | apps/admin/src/routes/*, router in apps/admin/src/router.tsx |
| Edge proxy / OG tags | apps/web/worker/index.ts |
| Deploy steps | docs/DEPLOY.md |

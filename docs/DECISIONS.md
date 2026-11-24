# Architecture decision records

Short and dated. Add a new ADR instead of editing an accepted one.

## ADR-001 — Cloudflare Workers (not Pages, not Railway) for launch · 2026-11-23 · Accepted
Free plan covers expected traffic (100k req/day, static assets free/unlimited). Cloudflare recommends Workers
Static Assets over Pages for new projects. Railway has no meaningful free tier for an always-on service.
**Consequence:** 10 ms CPU/request on Free → see ADR-004/005.

## ADR-002 — Keep the code portable to Node + Postgres (Railway) · 2026-11-23 · Accepted
Hono runs on Node; Drizzle supports Postgres. Business logic lives in `services/`, not routes. Platform-specific
parts are limited to: `drizzle(c.env.DB)` setup, raw `env.DB.batch/prepare` in `services/orders.ts`
(stock reservation, counters), R2 calls (`routes/public/images.ts`, `routes/admin/setup.ts` uploads), wrangler
configs and the two edge `worker/index.ts` files. A move means swapping those plus regenerating migrations for
`pg-core`.

## ADR-003 — Service bindings, one origin per app · 2026-11-23 · Accepted
Frontends call same-origin `/api/*`; their Workers forward to the API Worker via service binding. No CORS,
no public API hostname, Access headers pass straight through to the API for admin.

## ADR-004 — Admin auth via Cloudflare Access · 2026-11-23 · Accepted
Free for ≤50 users, email one-time PIN login, no passwords in our DB, no hashing CPU cost. API verifies the
Access JWT (jose + team JWKS) and authorises against `admin_users`. Local dev bypass via `DEV_ADMIN_EMAIL`
only when `ENVIRONMENT=development`.

## ADR-005 — SPAs, no SSR · 2026-11-23 · Accepted
SSR on Free risks the 10 ms CPU limit. Link previews for products are handled by an HTMLRewriter on `/p/:slug`.
Revisit (React Router framework mode / TanStack Start) when on Workers Paid if SEO needs it.

## ADR-006 — Guest checkout, phone as customer identity · 2026-11-23 · Accepted
No accounts at launch; customers are upserted by normalised phone. Tracking needs order number + phone.
OTP login is P5.

## ADR-007 — Stock and daily limits · 2026-11-23 · Accepted
Tracked stock uses conditional `UPDATE … WHERE stock_qty >= ?` in one D1 batch with compensation, so it never
goes negative. Daily limits are checked read-then-write; concurrent orders could exceed a cap by a few units.
Acceptable at current volume. If it matters, move limit counting into a Durable Object or a counter row per
(variant, date) updated conditionally like stock.

## ADR-008 — TypeScript 5.9, not 7 · 2026-11-23 · Accepted
TypeScript 7 (native) was current but tooling (drizzle-kit, Vite plugins, editors) still targets the 5.x API.
Re-evaluate later.

## ADR-009 — Code-based TanStack Router · 2026-11-23 · Accepted
Avoids a generated route tree in a small app. Routes are listed in `src/router.tsx`.

## ADR-010 — Alerts: Telegram + Resend · 2026-11-23 · Accepted
Telegram bot is free and instant; Resend free tier (100/day, 3,000/month) for email once a domain is verified.
Both optional via secrets; failures never block an order (`waitUntil`). WhatsApp Cloud API costs per
conversation — revisit later.

## ADR-011 — Admin shares storefront images via symlink · 2026-11-24 · Accepted
Seed product photos are static files in `apps/web/public/images` with keys like `/images/products/x.jpg`, so the
admin (a separate origin) showed broken images. `apps/admin/public/images` is a symlink to the web folder: Vite serves
it in dev and copies the real files into `dist` on build (verified). No duplicate files in git, no extra Worker code.
Once all photos are R2 uploads (`/api/img/…`) the symlink can go. Windows checkouts need `git config core.symlinks true`.

## ADR-012 — Admin UI patterns · 2026-11-24 · Accepted (revised same day for v2 design)
One way to do each thing: success/error feedback is a **toast**; destructive steps use the **confirm dialog**
(never `window.confirm`); row actions live in a **"⋯" RowMenu** (Edit, Duplicate, Hide, Delete); multi-field edit
pages show the sticky **SaveBar** when dirty; create/edit forms open in a **Modal** with a summary footer; order
details open in a **Drawer**. Lists show one primary "next step" button per row. Visual language in DESIGN.md.

## ADR-013 — What can be deleted · 2026-11-24 · Accepted
Hard deletes, with guards where history depends on the row (logic in `apps/api/src/services/admin.ts`):
- **Products / sizes**: always deletable (inventory rows go too). `order_items` keeps name/size/price snapshots and has
  no FK to products, so past orders and prep lists are unaffected. Prefer Draft/Archived to hide temporarily.
- **Categories**: deletable when empty; otherwise `?moveTo=<categoryId>` moves the products in the same batch.
- **Delivery areas / riders**: blocked (409 `*_in_use`) once they appear on an order (orders FK them) — switch them off.
- **Cities** (owner): only with no areas and no orders. **Admins** (owner): never yourself, never the last active owner.
- Orders are never deleted — cancel them (restocks).
Uploaded R2 images are not removed on delete (cheap, and an image may be reused); a cleanup job can come later.

## ADR-014 — Storefront controls live in settings · 2026-11-24 · Accepted
`announcement`, `ordersPaused` and `pauseMessage` are extra keys in the key/value `settings` table (no migration;
`loadSettings` merges defaults so old rows still parse — see `schemas.test.ts`). `GET /settings` exposes them plus
`cityNames`; the storefront top bar, hero, trust strip and checkout read them. `createOrder` refuses with
409 `orders_paused` while paused, so the pause also holds against stale tabs.

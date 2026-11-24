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

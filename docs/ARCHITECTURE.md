# Architecture

## Overview
Three Cloudflare Workers, one D1 database, one R2 bucket. Free plan to start.

```
Browser ──► preppal.pk ───────► preppal-web Worker ──┐   static React build (Workers Static Assets)
                                  /api/* , /p/*       │   + OG tags for /p/:slug
                                                      ├──service binding──► preppal-api Worker (Hono)
Browser ──► admin.preppal.pk ─► [Cloudflare Access] ─► preppal-admin Worker ─┘        │
            (email OTP login)     /api/*                                              ├── D1  preppal-db
                                                                                      └── R2  preppal-images
API ──► Telegram Bot API / Resend (new-order alerts, via ctx.waitUntil)
```

- **One origin per app.** The browser only ever calls `/api/*` on the site it is on; the edge Worker forwards to
  the API through a service binding. No CORS, no public API hostname (`workers_dev: false`).
- **Static first.** Both frontends are SPAs served from Workers Static Assets (free, unlimited requests).
  Only `/api/*` and `/p/*` run Worker code.
- **Admin security.** Cloudflare Access protects the whole admin hostname. Access adds a signed JWT
  (`Cf-Access-Jwt-Assertion`); the API verifies it against the team's JWKS and checks `admin_users`.

## Monorepo layout
```
apps/
  api/        Hono API Worker
    src/index.ts            app + route mounting, db middleware, error handler
    src/env.ts              Bindings / Variables types
    src/lib/                errors, validate, settings, notify, images, ids, audit
    src/middleware/         admin-auth (Cloudflare Access)
    src/services/           business logic: catalog.ts, orders.ts  ← keep logic here
    src/routes/public/      catalog (settings, cities, categories, products), orders (create, track, notify), images
    src/routes/admin/       catalog (categories/products/variants), inventory, orders (+prep list), setup (cities, areas, riders, admins, settings, uploads)
  web/        Storefront
    worker/index.ts         edge proxy + OG rewriter
    src/router.tsx          routes: / , /p/$slug, /cart, /checkout, /order/$number, /track
    src/components/         Layout, HeroSlideshow, ProductCard, CutoffCountdown, icons
    src/lib/                api client (+ query options), cart store (zustand, localStorage), site content
    public/images/          logo, product photos (from Preppal Instagram), stock photos (Unsplash)
  admin/      Admin panel
    worker/index.ts         edge proxy
    src/components/         Shell (grouped sidebar / mobile menu), ui (buttons, fields, toggle, segmented, badge…),
                            overlays (toasts, confirm dialog, modal, drawer, sticky SaveBar), icons
    src/lib/                api client + row types, me (signed-in admin), site (storefront URL, phone/money/hour helpers), image
    src/routes/orders/      OrdersPage (day picker, KPIs, filters, search), OrderList, OrderDrawer (detail, rider, COD,
                            timeline), PrepList (+print), status.ts (tones, action labels, useOrderActions)
    src/routes/products/    ProductsPage (grid + filters), ProductEditPage, ProductSidebar, PhotosCard, VariantsCard
    src/routes/Inventory.tsx  grouped by product, edits batched behind one "Save all" bar
    src/routes/setup/       Areas, Team (admins + riders, modals), Settings (live preview, email chips)
    public/images → ../../web/public/images   symlink so seed photos load in admin too (ADR-011)
packages/
  shared/     Zod schemas, DTO types, order status machine, time + money helpers, constants
  db/         Drizzle schema, migrations (drizzle-kit), seed.sql
docs/         this folder
```

## Request flow: placing an order
1. Storefront checkout → `POST /api/orders` with `{customer, address, deliveryDate, items[{variantId, qty}]}`.
2. `createOrderSchema` validates + normalises the phone (03XXXXXXXXX).
3. `services/orders.ts#createOrder`:
   - loads settings → checks `deliveryDate ∈ availableDeliveryDates()` (cutoff logic in Asia/Karachi)
   - checks city + area active, loads variants with `inventory` for the city
   - rejects unavailable / price 0 / out-of-stock items; checks daily limits for that date
   - reserves tracked stock with conditional `UPDATE … WHERE stock_qty >= qty` in one D1 batch (compensates on failure)
   - increments `counters.order_number` → `PP-000123`, upserts customer, inserts order + items + history in one batch
4. Route returns `201 { orderNumber, totalPkr, deliveryDate, whatsappUrl }` and fires alerts with `waitUntil`.
5. Admin sees it on the Orders board (auto-refresh 30 s), moves it through statuses; cancel restocks.

## Cutoff & delivery dates
`packages/shared/src/time.ts`. Before `cutoffHour` (default 23) the earliest delivery is tomorrow; at/after it,
the day after. Customers may choose `maxDaysAhead` days from the earliest. All in Asia/Karachi.

## Images
- Seed/brand images are static files in `apps/web/public/images` (key starts with `/`).
- Admin uploads go to R2 as `products/<uuid>.webp` after in-browser WebP resize; served via `GET /api/img/<key>`
  with immutable caching. `apps/api/src/lib/images.ts#imageUrl` is the only place that maps keys → URLs.

## Free-plan limits that shape the design
- Workers Free: 100k requests/day, **10 ms CPU per request** → no hashing, no SSR, no image work in Workers.
- D1 Free: daily read/write caps; queries are indexed (see schema indexes).
- Resend Free: 100 emails/day → alerts only, not marketing.
Upgrade path: Workers Paid ($5/mo) removes the CPU concern; see ADR-002 for moving to Railway.

## Testing
- Vitest unit tests: `packages/shared/src/*.test.ts` (time, status machine), `apps/api/test/*`.
- Next: integration tests for `createOrder` with `@cloudflare/vitest-pool-workers` (see ROADMAP P1).

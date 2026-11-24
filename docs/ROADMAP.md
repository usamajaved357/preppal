# Roadmap

Legend: `[x]` done · `[ ]` todo · `[~]` partly done. Update this file at the end of every session.

## P0 — Foundation ✅
- [x] pnpm + Turborepo monorepo, TS strict, Biome, Vitest
- [x] packages/shared (schemas, DTOs, status machine, cutoff/time helpers) + unit tests
- [x] packages/db Drizzle schema, initial migration, seed with real Preppal catalog
- [x] Wrangler configs for api/web/admin with service bindings
- [x] Docs + CLAUDE.md
- [x] GitHub Actions CI (lint, typecheck, test, build)

## P1 — Core ordering (MVP) — current phase
- [x] Public catalog API (settings, cities/areas, categories, products, product detail)
- [x] Order placement: cutoff, price recompute, stock reservation, daily limits, order numbers
- [x] Order tracking by number + phone
- [x] Alerts: Telegram + Resend (optional, via secrets)
- [x] Storefront: home (slideshow, categories, menu, features, deals, Instagram), product, cart, checkout, confirmation, track
- [x] Admin: orders board + prep list, products (+variants, uploads), inventory, areas, settings, team
- [ ] **Preppal to supply**: real prices + pack sizes, delivery areas + fees, owner/admin emails, original product photos (no text)
- [ ] Integration tests for `createOrder` using `@cloudflare/vitest-pool-workers` (stock race, daily limit, cutoff edge)
- [x] Search box in header → filters the home menu client-side
- [ ] Category page `/c/$slug` (currently category tiles filter the home menu)
- [ ] 404 page + error boundary in both apps
- [ ] Product images responsive sizes (`srcset`) once real photos arrive

- [x] Admin UI redesign: navigation, order drawer + timeline, product editor, batched inventory, setup modals, mobile layout
- [x] Admin v2 design (Selling Squads level) + full CRUD: categories page, delete/duplicate products, delete sizes,
      areas, riders, admins, cities management
- [x] Storefront controls from admin: pause orders (+ message), announcement bar, cutoff/city copy from settings

## P2 — Launch
- [ ] Buy domain, add to Cloudflare, custom domains for web + admin (docs/DEPLOY.md)
- [ ] Cloudflare Access app for admin hostname with owner/staff emails
- [ ] `wrangler d1 create`, migrate + seed remote, set real ACCESS_* vars and secrets
- [ ] Verify Resend domain; set alert emails in Settings
- [ ] Cloudflare Web Analytics on storefront
- [x] Privacy policy + terms pages (also delivery + refund/return policies; footer links) — review wording before launch
- [ ] Smoke test on real phones (Android Chrome, low-end)

## P3 — Merchandising
- [ ] Deal bundles as products with limited daily quantity (schema already supports via daily_limit)
- [~] Home banners managed from admin — announcement bar done; hero slides still in `apps/web/src/lib/site.ts`
- [ ] Coming-soon products with "Notify me" (API `/notify` exists)
- [ ] Recipes section (from Instagram "preppal recipes" highlight)

## P4 — Operations
- [x] Rider assignment UI on orders board (order drawer)
- [ ] Printable order slips / labels
- [ ] Daily summary to Telegram at cutoff (Cron Trigger)
- [ ] Simple sales report (per day/product)

## P5 — Customers
- [ ] Phone OTP login (WhatsApp/SMS provider) + order history + one-tap reorder
- [ ] Rider PWA (role `rider`)

## P6 — Growth
- [ ] City picker + more cities (data model ready)
- [ ] Online payments: JazzCash / Easypaisa
- [ ] Urdu UI
- [ ] Move to Workers Paid or Railway when traffic demands (ADR-002)

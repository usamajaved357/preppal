# Progress log

Newest entry on top. Every session appends one entry: Done / In progress / Next / Blockers.

---

## 2026-11-23 — Session 1: initial build (Claude, chat)
**Done**
- Brand research from Instagram @preppal.swl; competitor review (HelloFresh, Licious, Gousto, Freshmate); approved design (canvas "Preppal — Storefront & Admin Design").
- Monorepo scaffold, shared package (Zod schemas, DTOs, status machine, cutoff helpers, 5 unit tests).
- DB schema (16 tables) + initial migration `0000_init.sql` + seed with the real catalog: Ginger-Garlic Paste, Peeled Garlic, Chopped Garlic, Kacha Qeema Kabab Base, Marinated Fish, Cheesy Chicken Cones, Chopped Methi, Gross Matar (Rs 190/kg).
- API: public catalog, order placement (cutoff, stock reservation, daily limits, PP-###### numbers), tracking, notify sign-up, R2 image passthrough; admin CRUD for catalog, inventory, orders (+prep list), areas, riders, admins, settings, uploads; Cloudflare Access auth with local dev bypass; Telegram + Resend alerts.
- Storefront: home (hero slideshow, live cutoff countdown, categories, menu with filters, feature rows, how it works, deals + notify, Instagram), product page, cart, checkout (COD), confirmation (+WhatsApp deep link), tracking.
- Admin: orders board with status actions/COD/WhatsApp + prep list, products list/edit with variants and WebP uploads, inventory per city, delivery areas, settings, team & riders.
- Verified: `pnpm typecheck`, `pnpm test`, `pnpm lint`, both Vite builds, `wrangler deploy --dry-run` for all three Workers; local API smoke test (order placed, tracked, status transitions, prep list, out-of-stock rejection).

**In progress**
- Nothing.

**Next** (see ROADMAP P1/P2)
1. Get real prices/sizes, delivery areas + fees, admin emails, original photos from Preppal; update seed or set in admin.
2. Integration tests for `createOrder`.
3. Header search, category page, 404/error boundaries.
4. Deploy (docs/DEPLOY.md) once the domain is bought.

**Blockers / notes**
- Seed prices are 0 (unknown) except Gross Matar; such variants show "Rs —" and cannot be ordered until priced.
- Categories "Chopped onion", "Spice mixes", "BBQ & tikka" are seeded **inactive** (suggested, not yet sold).
- Instagram-sourced product photos are crops of ad posters (low-res, some text). Replace with originals.
- Storefront UI was built from the approved canvas but not yet checked visually in a browser — do a visual pass first.

# Progress log

Newest entry on top. Every session appends one entry: Done / In progress / Next / Blockers.

---

## 2026-11-24 — Session 3d: hero slideshow
**Done**: hero slideshow rebuilt — 8 high-res free Unsplash photos (karahi, kababs, curry, daal, spices, ginger…)
loaded from Unsplash's CDN at the right size per screen, 3.5 s per photo (was 5 s), per-photo camera moves,
animated captions with tags, progress bars + counter, arrows and swipe. Old 491 px karahi crop replaced by its
original. **Next**: consider self-hosting hero photos (R2) before launch; owner-managed hero slides (ROADMAP P3).

---

## 2026-11-24 — Session 3c: storefront motion + remaining admin-driven copy
**Done**: `useStoreInfo()` hook — product cards, product page, order-placed, "How it works", trust strip and cart now
use cutoff/delivery time/city from settings. Minimum order shown in cart (progress bar) and enforced in cart +
checkout buttons. Header hides on scroll down / shows on scroll up with shadow; scroll reveals; add-to-cart toast,
button pop and cart badge bump; hero cascade; floating chips; WhatsApp pulse. Fixed the deals photo blowing up the
card; categories swipe on phones / centred rows on desktop; "How it works" numbered steps with a dashed connector;
cart page rebuilt with a summary card; mobile header fits on one row.
**Note**: the in-app test browser doesn't fire scroll events from scripted scrolls; verified with real wheel scrolling.

---

## 2026-11-24 — Session 3b: order rows + capsule controls
**Done**: order board rows rebuilt as a column table (wide) / stacked card (narrow) with rider under status and
COD/Paid pill; prep list moves beside the board only at 2xl. Select/search are capsules with a padded custom chevron
everywhere (admin + storefront checkout area select). Docs, CLAUDE.md and .claude/ are now git-ignored (local only).
**Next**: unchanged from Session 3.

---

## 2026-11-24 — Session 3: admin v2 design + full CRUD + storefront controls (Claude Code)
**Done**
- Studied the Selling Squads app + admin console (in Chrome) and rebuilt the admin design system to that level:
  light canvas + inset white workspace with breadcrumbs, ⌘K "Jump to" palette, KPI stat strips, 20px cards with tinted
  icon chips, pill buttons/tabs (brand-gradient active pill), option cards, step-numbered modals with live preview and
  summary footer, "⋯" row menus, avatars. Every page restyled (DESIGN.md "Admin panel v2", ADR-012).
- Full CRUD (API + UI), with guards documented in ADR-013 and logic in `services/admin.ts`:
  - New **Categories** page: add/edit (photo upload, description, slug, position), reorder, show/hide, delete
    (moves products to another category first when needed). "+" in the product editor creates one inline.
  - Products: delete, duplicate (copies sizes, opens as draft), publish/hide from the list; delete individual sizes.
  - Delivery areas: delete (blocked if on orders). New **Cities** card: add/edit/turn on/off/delete (owner).
  - Team: remove admins (not yourself / last owner), remove riders (blocked if on orders), order counts shown.
  - Usage counts on list endpoints (products per category, orders per area/rider, areas per city).
- Storefront controls (ADR-014): Settings → **Pause orders** (+ customer message; API refuses `orders_paused`) and
  **Announcement bar**; storefront top bar / hero / trust strip / checkout read them, plus cutoff hour and city name
  from settings instead of hard-coded "11 PM"/"Sahiwal". Header **search now works** (filters the menu, results bar,
  clear button, empty state); selected category tile gets a ring.
- Tests: `packages/shared/src/schemas.test.ts` (old settings still parse, announcement limit, moveTo). Every new
  endpoint exercised against local D1 with curl; UI loops verified in the browser (create+delete category,
  duplicate+delete product, announcement + pause reflected on storefront and checkout). All admin and storefront
  routes load with no console errors. `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` pass.

**In progress**
- Nothing.

**Next**
1. Integration tests for `createOrder` and the delete guards with `@cloudflare/vitest-pool-workers`.
2. Manual order entry in admin (for WhatsApp/phone orders) and editing an order's items.
3. Hero slides / feature copy managed from admin; R2 cleanup for unused uploads.

**Blockers / notes**
- Local demo data from Session 2 is still in `.wrangler/state` (reset command in Session 2 notes).
- Settings were restored after testing (not paused, no announcement).

---

## 2026-11-24 — Session 2: admin panel redesign (Claude Code)
**Done**
- Local setup: pnpm via corepack, `pnpm install`, local D1 migrated + seeded, `.claude/launch.json` for api/web/admin dev servers.
- Fixed broken product photos in admin (seed images live in the web app) → `apps/admin/public/images` symlink (ADR-011).
- Redesigned every admin page (ADR-012 patterns, DESIGN.md "Admin panel"):
  - Shell: grouped sidebar with icons, pending-orders badge, signed-in card, "View storefront", mobile top bar + menu, nicer no-access screen.
  - Orders: Today/Tomorrow/next-day chips + date picker, KPI cards (to confirm, cash collected progress, delivered progress),
    search, status filter pills with counts, two-line order rows with one "next step" button + WhatsApp, order drawer
    (customer call/WhatsApp, address + note, rider assignment, itemised totals, cash-collected toggle, status timeline),
    confirm dialog for cancel, grouped prep list that prints on its own.
  - Products: photo grid with badge/status, "needs price" banner + filter, search, category filter. Editor with
    visibility cards, organise card, live preview, drag-and-drop multi-photo upload + "make cover", sizes table with
    Rs inputs and on-sale toggles, sticky unsaved-changes bar.
  - Inventory: grouped by product with thumbnails, toggles, Rs city price, low/sold-out badges, filters, edits batched
    into one "Save all"; labelled inputs on mobile.
  - Delivery areas / Team & riders: list rows with toggles + edit modals (riders and admins can now be edited/disabled).
  - Settings: sectioned layout, cutoff as a time picker, live "how ordering works" sentence, day selector, email chips.
- Toasts for every save; no more `window.confirm`.
- Verified in the browser at desktop and phone widths; all 8 admin routes load with no console errors;
  `pnpm typecheck`, `pnpm test`, `pnpm lint`, admin `vite build` pass.

**In progress**
- Nothing.

**Next**
1. Same visual pass on the storefront (still never checked in a browser per Session 1 note).
2. Categories management UI in admin (API exists: GET/POST/PUT /admin/categories).
3. ROADMAP P1 items (createOrder integration tests, header search, category page, 404/error boundaries).

**Blockers / notes**
- Local DB has demo data from this session (prices on 6 sizes, 2 areas, 2 riders, 5 orders for 25 Nov). Reset with
  `rm -rf .wrangler/state && pnpm db:migrate:local && pnpm db:seed:local`.
- Admin JS bundle is ~500 kB (150 kB gzip); route-level code splitting would help if it grows.

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

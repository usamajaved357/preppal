# Design system (approved 2026-11-23)

Reference canvas: "Preppal — Storefront & Admin Design" (claude.ai artifact). Inspired by HelloFresh (hero,
feature rows with labels on photos), Licious (round category tiles, product cards), Gousto (offer box → cutoff
countdown). Real photography only — no illustrations.

## Tokens (`apps/*/src/styles.css` → Tailwind classes)
| Token | Hex | Use |
|---|---|---|
| `forest` | #1F4D3A | primary: header CTA, buttons, hero bg, prices |
| `forest-deep` | #163A2C | promo bar, footer, deals band, admin sidebar |
| `sage` | #C8DB8A | highlights on dark, focus ring |
| `sage-soft` | #EAF0E2 | selected states, icon chips |
| `cream` | #FAF7F1 | page background |
| `cream-btn` | #F6F1E4 | primary button on dark backgrounds |
| `sand` | #F1ECE1 | "How it works" band, image placeholders |
| `ink` | #1B2A22 | body text |
| `muted` | #5C6A61 | secondary text (passes 4.5:1 on white) |
| `line` | #ECE6DA | borders |
| `terra` | #C4572A | deals / Eid / limited badges, errors |
| `gold` | #8A6A2E | small uppercase kickers |

## Type
- Display: **Fraunces** 600/700 (`font-display`, all h1–h3). Tight tracking on big headings.
- Body/UI: **DM Sans** 400–700 (`font-sans`).
- Loaded from Google Fonts in each `index.html`.

## Components
- Product card: photo 216 px (hover zoom), badge pill top-left, Fraunces name, one-line description, price +
  "Add" outline pill (fills green on hover), delivery line with truck icon.
- Category tile: 132–148 px circular photo + name + one-line sub.
- Hero: copy left on forest; right half full-bleed crossfading slideshow (5 s, Ken Burns), gradient blend into
  green, caption pill + dots. Live cutoff countdown under CTAs.
- Feature row: 400 px rounded photo with two white label pills + kicker/heading/body.
- Motion: rise-in on hero, hover lifts on cards, slideshow. Respect `prefers-reduced-motion`.

## Imagery
- `public/images/products/*` — cropped from Preppal's Instagram posts (replace with original photos).
- `public/images/site/*` — Unsplash (free licence): chopping, karahi, mortar, spread, onions, spices, grill, thali.
- Logo: `public/images/logo.png` (from Instagram profile; get the vector original).

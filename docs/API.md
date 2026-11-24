# API

Base path `/api`. JSON in/out. Errors: `{ "error": { "code": string, "message": string, "details"?: any } }`.
Validation errors → `400 validation_error` with Zod issues in `details`.

## Public
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{ ok, env }` |
| GET | `/settings` | `PublicSettingsDto`: cutoffHour, deliveryByLabel, minOrderPkr, whatsappNumber, instagramHandle, deliveryDates[], msUntilCutoff |
| GET | `/cities` | active cities |
| GET | `/cities/:slug/areas` | `{ city, areas[] }` active areas with fees |
| GET | `/categories` | active categories (`imageUrl` resolved) |
| GET | `/products?city=sahiwal&category=` | `ProductCardDto[]` with per-city variant availability |
| GET | `/products/:slug?city=sahiwal` | `ProductDetailDto` |
| POST | `/orders` | body `createOrderSchema` → `201 OrderCreatedDto`. Errors: `delivery_date_unavailable`, `city_unavailable`, `area_unavailable`, `item_unavailable` (409), `out_of_stock` (409), `daily_limit_reached` (409), `below_minimum` |
| GET | `/orders/track?number=&phone=` | `OrderTrackDto` (phone must match) |
| POST | `/notify` | `{ phone, topic }` — "notify me" sign-up |
| GET | `/img/*` | R2 image passthrough, immutable cache |

## Admin (`/api/admin/*`, Cloudflare Access JWT + `admin_users`)
| Method | Path | Role |
|---|---|---|
| GET | `/me` | any admin |
| GET/POST | `/categories`, PUT `/categories/:id` | owner, staff |
| GET/POST | `/products`, GET/PUT `/products/:id` | owner, staff |
| POST | `/products/:id/variants`, PUT `/variants/:id` | owner, staff (new variants get inventory rows in active cities) |
| GET | `/inventory?cityId=` · PUT `/inventory/:variantId/:cityId` | owner, staff |
| GET | `/orders?date=&status=` · GET `/orders/:id` | owner, staff |
| PATCH | `/orders/:id/status` `{status, note}` | transition-checked; cancel restocks |
| PATCH | `/orders/:id/rider` `{riderId}` · `/orders/:id/cod` `{collected}` | owner, staff |
| GET | `/prep-list?date=` | totals per product/size for active orders |
| GET/POST/PUT | `/cities` (owner writes), `/areas`, `/riders` | |
| GET/POST/PUT | `/admins` | owner |
| GET/PUT | `/settings` | PUT owner |
| POST | `/uploads` (multipart `file`, ≤3 MB image) | → `{ key, url }` |

Role `rider` exists in the schema; a rider-facing view is ROADMAP P5. `requireAdmin()` currently allows owner + staff.

# API

Base path `/api`. JSON in/out. Errors: `{ "error": { "code": string, "message": string, "details"?: any } }`.
Validation errors → `400 validation_error` with Zod issues in `details`.

## Public
| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `{ ok, env }` |
| GET | `/settings` | `PublicSettingsDto`: cutoffHour, deliveryByLabel, minOrderPkr, whatsappNumber, instagramHandle, deliveryDates[], msUntilCutoff, announcement, ordersPaused, pauseMessage, cityNames[] |
| GET | `/cities` | active cities |
| GET | `/cities/:slug/areas` | `{ city, areas[] }` active areas with fees |
| GET | `/categories` | active categories (`imageUrl` resolved) |
| GET | `/products?city=sahiwal&category=` | `ProductCardDto[]` with per-city variant availability |
| GET | `/products/:slug?city=sahiwal` | `ProductDetailDto` |
| POST | `/orders` | body `createOrderSchema` → `201 OrderCreatedDto`. Errors: `orders_paused` (409), `delivery_date_unavailable`, `city_unavailable`, `area_unavailable`, `item_unavailable` (409), `out_of_stock` (409), `daily_limit_reached` (409), `below_minimum` |
| GET | `/orders/track?number=&phone=` | `OrderTrackDto` (phone must match) |
| POST | `/notify` | `{ phone, topic }` — "notify me" sign-up |
| GET | `/img/*` | R2 image passthrough, immutable cache |

## Admin (`/api/admin/*`, Cloudflare Access JWT + `admin_users`)
| Method | Path | Role |
|---|---|---|
| GET | `/me` | any admin |
| GET/POST | `/categories` (GET adds `productCount`), PUT/DELETE `/categories/:id` | owner, staff. DELETE needs `?moveTo=<id>` when the category has products (else 409 `category_in_use`) |
| GET/POST | `/products`, GET/PUT/DELETE `/products/:id` | owner, staff. DELETE removes sizes + inventory; orders keep snapshots |
| POST | `/products/:id/variants`, PUT/DELETE `/variants/:id` | owner, staff (new variants get inventory rows in active cities) |
| GET | `/inventory?cityId=` · PUT `/inventory/:variantId/:cityId` | owner, staff |
| GET | `/orders?date=&status=` · GET `/orders/:id` | owner, staff |
| PATCH | `/orders/:id/status` `{status, note}` | transition-checked; cancel restocks |
| PATCH | `/orders/:id/rider` `{riderId}` · `/orders/:id/cod` `{collected}` | owner, staff |
| GET | `/prep-list?date=` | totals per product/size for active orders |
| GET/POST/PUT/DELETE | `/cities` (owner writes; GET adds `areaCount`), `/areas` (GET adds `orderCount`), `/riders` (GET adds `orderCount`) | Deletes return 409 `city_in_use` / `area_in_use` / `rider_in_use` when referenced — see ADR-013 |
| GET/POST/PUT/DELETE | `/admins` | owner. Can't delete yourself (`cannot_remove_self`) or the last owner (`last_owner`) |
| GET/PUT | `/settings` (incl. `announcement`, `ordersPaused`, `pauseMessage`) | PUT owner |
| POST | `/uploads` (multipart `file`, ≤3 MB image) | → `{ key, url }` |

Role `rider` exists in the schema; a rider-facing view is ROADMAP P5. `requireAdmin()` currently allows owner + staff.

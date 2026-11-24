# Preppal

Storefront + admin for **Preppal** — fresh, ready-to-cook prep delivered in Sahiwal. Cash on delivery.
Cloudflare Workers + D1 + R2, React, Hono, Drizzle. Free-plan friendly.

```bash
pnpm install
cp apps/api/.dev.vars.example apps/api/.dev.vars
pnpm db:migrate:local && pnpm db:seed:local
pnpm --filter @preppal/api dev      # :8787
pnpm --filter @preppal/web dev      # :5173  storefront
pnpm --filter @preppal/admin dev    # :5174  admin
```

## Layout
- `apps/api` — Hono API on Cloudflare Workers (D1, R2)
- `apps/web` — storefront (React, Vite, TanStack Router)
- `apps/admin` — admin panel, behind Cloudflare Access
- `packages/shared` — Zod schemas, types, order status machine, time/money helpers
- `packages/db` — Drizzle schema, migrations, seed

## Checks
```bash
pnpm typecheck && pnpm test && pnpm lint
```

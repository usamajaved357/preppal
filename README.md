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

- Working with Claude Code? Start with **CLAUDE.md**.
- Architecture: `docs/ARCHITECTURE.md` · Data model: `docs/DATA_MODEL.md` · API: `docs/API.md`
- What's done / next: `docs/PROGRESS.md`, `docs/ROADMAP.md` · Decisions: `docs/DECISIONS.md`
- Deploy: `docs/DEPLOY.md` · Design tokens: `docs/DESIGN.md`

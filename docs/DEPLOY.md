# Deploy (Cloudflare, free plan)

Run from the repo root unless noted. Requires `npx wrangler login` once.

## 1. One-time resources
```bash
cd apps/api
npx wrangler d1 create preppal-db            # copy database_id into apps/api/wrangler.jsonc
npx wrangler r2 bucket create preppal-images
pnpm db:migrate:remote                        # applies packages/db/migrations
# Edit packages/db/seed/seed.sql first: real owner email, areas, prices (or set them in admin later)
pnpm db:seed:remote
```

## 2. Secrets (optional alerts)
```bash
cd apps/api
npx wrangler secret put TELEGRAM_BOT_TOKEN    # from @BotFather
npx wrangler secret put TELEGRAM_CHAT_ID      # your chat/group id
npx wrangler secret put RESEND_API_KEY        # after verifying your domain in Resend
```

## 3. Deploy order (API first — the others bind to it)
```bash
pnpm --filter @preppal/api deploy
pnpm --filter @preppal/web build && pnpm --filter @preppal/web deploy
pnpm --filter @preppal/admin build && pnpm --filter @preppal/admin deploy
```
Before a domain exists, web/admin get `*.workers.dev` URLs (enable `workers_dev` in their wrangler.jsonc if
needed). The API stays private (`workers_dev: false`).

## 4. Domain (after purchase)
1. Add the domain to Cloudflare (change nameservers at the registrar).
2. In `apps/web/wrangler.jsonc` add `"routes": [{ "pattern": "preppal.pk", "custom_domain": true }]`.
3. In `apps/admin/wrangler.jsonc` add `"routes": [{ "pattern": "admin.preppal.pk", "custom_domain": true }]`.
4. Redeploy web + admin. Update `PUBLIC_SITE_URL` and `ALERT_FROM_EMAIL` in `apps/api/wrangler.jsonc`.

## 5. Protect admin with Cloudflare Access
1. Zero Trust dashboard → Access → Applications → Add → Self-hosted → domain `admin.preppal.pk`.
2. Policy: Allow → Emails → owner + staff emails. Login method: One-time PIN.
3. Copy the application **AUD tag** → `ACCESS_AUD` in `apps/api/wrangler.jsonc`.
4. Team domain (`https://<team>.cloudflareaccess.com`) → `ACCESS_TEAM_DOMAIN`. Redeploy API.
5. Make sure the same emails exist in `admin_users` (seed or Admin → Team).

## 6. CI deploy (optional)
`.github/workflows/deploy.yml` deploys on push to `main`. Add repo secrets `CLOUDFLARE_API_TOKEN`
(Workers + D1 + R2 edit) and `CLOUDFLARE_ACCOUNT_ID`.

## 7. Backups
D1 Time Travel restores to any minute in the last 30 days (Paid) / 7 days (Free):
`npx wrangler d1 time-travel restore preppal-db --timestamp <ISO>`.

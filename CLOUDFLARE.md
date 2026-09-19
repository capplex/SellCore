# SellCore on Cloudflare Workers

SellCore is a full-stack Next.js application. Deploy it to **Cloudflare Workers**, not as a static Cloudflare Pages upload.

This project is configured for the OpenNext Cloudflare adapter because it preserves the existing Next.js App Router/server runtime while targeting Workers.

## 1. Requirements

- Node.js 22+ recommended
- A Cloudflare account
- A Supabase project
- Stripe account/keys for checkout and SellCore platform billing
- Your production domain in Cloudflare DNS (recommended)

## 2. Install

```bash
npm install
```

## 3. Local development

Normal Next.js development still works:

```bash
npm run dev
```

To test the production Worker runtime locally, copy `.dev.vars.example` to `.dev.vars`, fill it in, then run:

```bash
npm run cf:preview
```

## 4. Cloudflare environment variables

For production, add the following in Cloudflare Dashboard -> Workers & Pages -> your Worker -> Settings -> Variables and Secrets.

Public build/runtime variables:

- `NEXT_PUBLIC_APP_URL` — e.g. `https://sellcore.app`
- `NEXT_PUBLIC_PLATFORM_DOMAIN` — e.g. `sellcore.app`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

Secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PLATFORM_WEBHOOK_SECRET`
- `STRIPE_CONNECT_WEBHOOK_SECRET`
- `ENCRYPTION_KEY`
- `EMAIL_API_KEY` when using a real email provider
- `CRON_SECRET`

Non-secret configuration:

- `EMAIL_PROVIDER`
- `EMAIL_FROM`

Do not add secret values to `wrangler.jsonc` or commit `.dev.vars`.

The OpenNext build also needs variables used during static generation/build. When using Cloudflare Workers Builds, add the required `NEXT_PUBLIC_*` values under Build variables as well as runtime variables.

## 5. Deploy from your computer

Authenticate once:

```bash
npx wrangler login
```

Then:

```bash
npm run cf:deploy
```

The first deploy creates/updates the `sellcore` Worker defined by `wrangler.jsonc`.

## 6. Deploy from GitHub in Cloudflare

1. Push this folder to GitHub.
2. In Cloudflare, open **Workers & Pages** and import the repository as a Worker.
3. Set the production branch.
4. Set the build command to:

```bash
npm run cf:build
```

5. Set the deploy command to:

```bash
npx wrangler deploy
```

6. Add the Build Variables and Worker Variables/Secrets described above.

OpenNext writes the Worker entry point to `.open-next/worker.js`, which `wrangler.jsonc` deploys.

## 7. Main SellCore domain

After the Worker is deployed, add `sellcore.app` (or your domain) as a Worker Custom Domain in Cloudflare. Add `www`/`app` hostnames if you use them.

Set:

```env
NEXT_PUBLIC_APP_URL=https://sellcore.app
NEXT_PUBLIC_PLATFORM_DOMAIN=sellcore.app
```

SellCore's request proxy uses the request hostname to distinguish the platform domain, subdomain storefronts, and merchant custom domains.

## 8. Store subdomains

For storefronts such as `merchant.sellcore.app`, add a wildcard hostname/route for `*.sellcore.app` to the same Worker in Cloudflare.

Do not create a separate Worker per merchant.

## 9. Merchant custom domains

The application already resolves stores by the incoming hostname, but Cloudflare still has to terminate TLS and route each merchant hostname to the Worker.

For a small controlled set of domains, attach each hostname to the Worker after DNS verification. For a public self-service SaaS where arbitrary merchants connect their own domains, configure **Cloudflare for SaaS / Custom Hostnames** in your Cloudflare account and automate hostname creation after SellCore verifies merchant ownership. DNS verification alone does not provision Cloudflare TLS for arbitrary third-party hostnames.

## 10. Supabase

Create the Supabase project and run the SQL in `supabase/migrations` in order. Configure Supabase Auth redirect URLs for:

- `https://sellcore.app/auth/callback`
- `https://sellcore.app/reset-password`
- your local development URLs

Private Supabase Storage buckets remain private; SellCore uses signed URLs for authorized downloads.

## 11. Stripe webhooks

After your production URL exists, configure Stripe to call the webhook routes implemented in `app/api/webhooks/stripe`.

Use the signing secrets Stripe gives you as:

- `STRIPE_PLATFORM_WEBHOOK_SECRET`
- `STRIPE_CONNECT_WEBHOOK_SECRET`

Never reuse the Stripe API secret as a webhook secret.

## 12. Verification before production

Run locally after dependencies install:

```bash
npm run lint
npm test
npm run build
npm run cf:build
```

Then test `npm run cf:preview` before pushing the production Worker.


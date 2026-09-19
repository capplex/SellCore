# SellCore

> **Cloudflare deployment:** this build includes `wrangler.jsonc` and OpenNext configuration for Cloudflare Workers. See [`CLOUDFLARE.md`](./CLOUDFLARE.md). Do not deploy this full-stack app as a static Pages upload.


SellCore is a hosted, multi-tenant ecommerce SaaS foundation for digital products and services. This repository contains the marketing site, merchant dashboard, storefront runtime, customer portal, platform administration, Supabase/PostgreSQL schema and RLS policies, Stripe merchant payments, Stripe platform billing, fulfillment, reviews, API keys, outgoing webhooks, usage enforcement and private delivery flows.

The supplied SellCore logo is preserved at `public/assets/sellcore-logo.png` and is also used as the application icon.

## Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL and Storage
- Stripe Checkout / Connect for merchant payments
- Stripe Billing for SellCore plans
- Zod input validation
- Lucide icons
- Vitest

## 1. Install

Requirements: Node.js 20+ and a Supabase project.

```bash
npm install
cp .env.example .env.local
```

Fill the environment variables before running the application.

## 2. Supabase

Create a Supabase project, then set:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

Run migrations in order with the Supabase CLI or SQL editor:

```text
supabase/migrations/0001_initial.sql
supabase/migrations/0002_inventory_reservations.sql
supabase/migrations/0003_admin.sql
supabase/migrations/0004_plan_trials.sql
```

The first migration creates the tenant schema, indexes, RLS helpers/policies, private/public storage buckets, configurable plans and themes. The second migration adds transactional inventory reservations. The third adds platform administration settings/reports, and the fourth adds configurable plan trials.

### Auth configuration

In Supabase Auth, enable email/password and set the Site URL to `NEXT_PUBLIC_APP_URL`. Add your deployed `/auth/callback` URL to the redirect allow-list. Password-reset and email-verification links return through this callback.

### Making the first platform administrator

Register normally first. Then, using the Supabase SQL editor with administrator privileges:

```sql
update public.users
set platform_role = 'admin'
where email = 'owner@example.com';
```

Admin authorization is checked server-side before `/admin` is rendered.

## 3. Stripe merchant payments

SellCore uses Stripe Connect Express accounts for merchant storefront payments. Set:

```env
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_CONNECT_WEBHOOK_SECRET=
```

Enable Connect on the Stripe platform account. Merchants connect from **Dashboard → Payments**. The application creates/loads the connected account and sends the merchant through Stripe-hosted onboarding.

Configure a **Connect webhook** to:

```text
https://YOUR_HOST/api/webhooks/stripe/merchant
```

Subscribe to the events handled by the route, including Checkout Session completion/expiration, connected-account status updates, subscription changes and refunds. Use the Connect endpoint signing secret as `STRIPE_CONNECT_WEBHOOK_SECRET`.

Storefront prices are loaded from PostgreSQL at checkout, coupons are validated server-side, inventory is reserved transactionally, and the Stripe Checkout Session is created on the merchant's connected account. The return page does not mark an order as paid; fulfillment starts only after a verified Stripe webhook updates the order.

## 4. SellCore platform billing

The Free plan is a real database-backed plan and requires no Stripe subscription. Paid plans use Stripe Billing.

Set:

```env
STRIPE_PLATFORM_WEBHOOK_SECRET=
```

Create recurring monthly/yearly Stripe Prices for each paid plan. As a platform admin, open **Admin → Plans** and paste the Stripe Price IDs into the corresponding plan. Prices, plan names, feature flags and usage limits are read from the database rather than duplicated in frontend code.

Configure the platform Stripe webhook to:

```text
https://YOUR_HOST/api/webhooks/stripe/platform
```

The billing page supports Free → Paid checkout, paid-plan changes, cancel-at-period-end, reactivation, immediate return to Free, and Stripe's billing portal. Downgrading does not delete merchant data; the entitlement layer blocks new usage beyond the new limits.

## 5. Free and paid plan configuration

Plan configuration lives in:

- `platform_plans`
- `plan_features`
- `plan_limits`
- `merchant_subscriptions`
- `merchant_usage`

Initial Free, Starter, Pro and Business rows are migration seed configuration, not merchant/demo business data. They can be edited from `/admin/plans`.

Server-side checks are centralized in `lib/usage/service.ts`, including store/product/domain/team limits and feature entitlements for API, webhooks, advanced analytics and advanced themes. Storefront checkout also enforces monthly-order and customer limits. Private downloads and outgoing webhooks enforce their usage limits server-side.

## 6. Product and fulfillment types

Supported product types:

- License keys — hashed for duplicate detection, reserved atomically and assigned once.
- Digital files — private Supabase Storage with authorized 60-second signed downloads.
- Account inventory — credential payload encrypted with AES-256-GCM at rest and decrypted only after an authorized purchase.
- Services — creates a merchant-managed service fulfillment state.
- Subscriptions — Stripe recurring checkout and synchronized customer subscription state.
- Generated products — invokes a merchant HTTPS endpoint after verified payment, signed with an HMAC shared secret.
- Custom fulfillment — delivers merchant-configured instructions/manual fulfillment state.

The checkout reservation functions use PostgreSQL locking (`FOR UPDATE SKIP LOCKED`) so inventory cannot be assigned twice under concurrent purchases. Fulfillment is idempotent at the order/delivery level and duplicate payment webhooks do not double-deliver.

## 7. Storefronts and custom domains

Every store is available under the application route:

```text
/store/<store-slug>
```

When `NEXT_PUBLIC_PLATFORM_DOMAIN` is a production parent domain, `proxy.ts` can map `<store>.YOUR_PLATFORM_DOMAIN` into the same storefront runtime. Verified custom domains are looked up from `domains` and rewritten server-side to `/domain/<hostname>/...`.

Domain verification requires the merchant to create:

```text
TXT _sellcore.shop.example.com = <verification token shown in dashboard>
```

After DNS verification, the domain becomes eligible for routing. DNS/TLS attachment at the hosting provider is deployment-specific: configure your hosting platform to accept wildcard/custom hostnames and terminate TLS for them. SellCore itself never trusts a client-supplied store ID for hostname routing.

## 8. Storage

Buckets are created by the migration:

- `product-images` — public catalog images
- `digital-files` — private fulfillment files
- `store-assets` — public store branding assets

Digital files are never exposed with predictable public storage URLs. The `/api/download/[fileId]` route verifies the logged-in customer, paid order and download limit before generating a short-lived signed URL.

Set a 32-byte encryption key encoded as 64 hex characters or a strong 32+ character secret:

```env
ENCRYPTION_KEY=
```

Keep the key stable. Rotating it without a migration makes previously encrypted account inventory and webhook secrets unreadable.

## 9. Merchant API

Paid plans can enable API access. Keys are generated once, shown once, and only a SHA-256 hash is stored. Routes under `/api/v1` authenticate `Authorization: Bearer sc_live_...`, enforce scopes and tenant ownership, and rate-limit through PostgreSQL.

Implemented scopes/routes include products, orders, customers, store and analytics reads plus product creation where the key has write access.

## 10. Merchant webhooks

Merchants configure HTTPS webhook endpoints from **Dashboard → Developers**. Signing secrets are encrypted in the database and shown once when created. Events are queued in `webhook_deliveries` and sent with HMAC signatures.

Run the dispatcher on a schedule (for example every minute on your deployment platform):

```text
POST /api/internal/webhooks/dispatch
Authorization: Bearer <CRON_SECRET>
```

The dispatcher retries failed deliveries with exponential backoff, stores response status/body, stops after the configured retry ceiling, records failures as merchant notifications, and tracks plan usage.

## 11. Email

`lib/email/index.ts` is a provider abstraction. `EMAIL_PROVIDER=console` logs development mail to the server. `EMAIL_PROVIDER=resend` sends through Resend using:

```env
EMAIL_PROVIDER=resend
EMAIL_API_KEY=
EMAIL_FROM=SellCore <no-reply@example.com>
```

The payment/fulfillment flow calls the abstraction rather than importing a mail vendor throughout the codebase.

## 12. PayPal

PayPal is not enabled in this repository and no PayPal credentials are required. The merchant-payment boundary is isolated in `lib/payments/provider.ts` so a PayPal adapter can be added without inventing or simulating PayPal behavior. Only enable it after implementing official server-side order capture and webhook signature verification.

## 13. Development

```bash
npm run dev
npm run lint
npm test
npm run build
```

No merchant products, orders, customers or reviews are inserted by the production migrations. Create real development data through onboarding or maintain a separate local-only seed script if needed.

## 14. Deployment

1. Deploy the Next.js application to a provider capable of wildcard/custom hostnames.
2. Add every variable in `.env.example` as a server/deployment secret where appropriate.
3. Run the Supabase migrations.
4. Configure Supabase Auth redirect URLs.
5. Configure the Stripe Connect and platform Billing webhook endpoints.
6. Configure a scheduled call to the webhook dispatcher.
7. Point your platform domain/wildcard DNS to the deployment and configure TLS.
8. Create Stripe Price IDs for paid plans and enter them in `/admin/plans`.
9. Test a full transaction using Stripe test mode before enabling live keys.

## Security notes

- Tenant data is scoped by merchant/store and protected with PostgreSQL RLS in addition to server authorization.
- Service-role, payment, encryption and webhook secrets remain server-only.
- Storefront checkout recalculates prices, coupons and inventory on the server.
- Merchant API keys are hash-only at rest.
- Account inventory and merchant webhook secrets are encrypted with authenticated encryption.
- Digital deliveries require authorization and expire.
- Incoming Stripe webhooks verify Stripe signatures before changing payment state.
- Platform-admin routes require the database `platform_role=admin` flag.
- Important merchant actions are written to `audit_logs`.

For production, also configure your hosting/network layer for DDoS/WAF controls, log retention, backups, secret rotation, domain/TLS automation, and compliance requirements applicable to your merchants and payment regions.

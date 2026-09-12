# ProposalFast

AI-powered client proposals: create → edit → send → track → e-sign → pay.

This is a production Next.js 15 app, not a mock. Missing Stripe / OpenAI / Resend / S3 keys disable those surfaces with a real error — they do not return fake success.

## Stack

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- PostgreSQL + Prisma 6
- Auth.js v5 (email/password + optional Google)
- OpenAI, Stripe, Resend, S3/R2, Inngest, `@react-pdf/renderer`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the why.

## Local setup

### 1. Database

```bash
docker compose up -d
# or any Postgres 16 URL
```

Create two databases if you are not using Compose: `proposalfast` and optionally `proposalfast_test`.

### 2. Environment

```bash
cp .env.example .env
```

Generate a session secret:

```bash
openssl rand -base64 32
```

**Required to boot the app locally**

| Key | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Auth.js cookie signing |
| `AUTH_URL` | Canonical origin (use `http://127.0.0.1:43127` locally) |
| `NEXT_PUBLIC_APP_URL` | Same origin, used in emails and OG tags |

**Required for product surfaces (Alfredo must supply these for production)**

| Key | Surface |
| --- | --- |
| `RESEND_API_KEY` | Verification, reset, send, contact |
| `RESEND_FROM_EMAIL` | From address (domain authenticated in Resend) |
| `OPENAI_API_KEY` | Generation pipeline |
| `OPENAI_MODEL` / `OPENAI_MODEL_FAST` | Default `gpt-4.1` / `gpt-4.1-mini` |
| `STRIPE_SECRET_KEY` | Subscriptions + proposal Checkout |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature verify |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client Stripe.js when Checkout is wired in the UI |
| `STRIPE_PRICE_PRO_MONTHLY` / `_YEARLY` | Pro prices |
| `STRIPE_PRICE_BUSINESS_MONTHLY` / `_YEARLY` | Business prices |
| `STRIPE_TRIAL_DAYS` | Optional 1–30 day trial on new Checkout subscriptions |
| `S3_BUCKET` `S3_ACCESS_KEY_ID` `S3_SECRET_ACCESS_KEY` | Logos, PDFs, signatures |
| `S3_REGION` `S3_ENDPOINT` `S3_PUBLIC_URL` | `S3_ENDPOINT` for R2 |

**Optional**

| Key | Surface |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Background jobs |
| `SEED_SAMPLE_DATA` | Dev-only demo user (default on locally) |
| `PLATFORM_ADMIN_EMAILS` | Extra platform-admin emails for `/admin` |
| `SENTRY_DSN` | Optional error reporting. Unset = no-op (no events, no SDK init). |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional shared rate limit. Unset = in-process map. |

Without Resend, verification emails print to the server log (development only).

### 3. Install, migrate, seed

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

App: [http://127.0.0.1:43127](http://127.0.0.1:43127)

**Dev-only sample login** (created by seed, never for production):

- Email: `alex@proposalfast.dev`
- Password: `DemoPassword123!`
- Workspace: Northline Studio

### 4. Tests and production build

```bash
npm test
npm run build
npm run test:e2e   # Playwright home + login; skips if Chromium is not installed
```

## Stripe

1. Create Products/Prices for Pro and Business (monthly + yearly).
2. Put the price IDs in the `STRIPE_PRICE_*` vars.
3. Webhook endpoint: `https://<host>/api/webhooks/stripe`
4. Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Customer Portal is created via `createCustomerPortalSession` when `stripeCustomerId` exists.

The app **does not** flip a plan because a button was clicked. Stripe webhooks write `Subscription`.

## OpenAI

`AIService` is the only caller. Models come from `OPENAI_MODEL` / `OPENAI_MODEL_FAST`. The pipeline is extract → outline → generate → QC → score (0–100 with completeness, fidelity, clarity, commercial readiness). Each stage returns Zod-validated JSON and retries once on a schema miss. Invented prices/stats are replaced with `[PLACEHOLDER: …]`. Rewrite controls (rewrite / shorten / expand / tone / persuasive / humanize) run on selected text. Usage is written to `AIUsage` and capped by the org’s plan.

## Resend

Authenticate your sending domain and set `RESEND_FROM_EMAIL` (e.g. `ProposalFast <noreply@proposalfast.ai>`). Canonical brand domain is `proposalfast.ai`. `proposefast.com` remains valid if that domain is still verified in Resend. Do not change Namecheap Private Email MX for `support@proposalfast.ai`. The `EmailAdapter` interface is the swap point if you change providers.

## S3 / R2

Use the official AWS SDK. For R2, set `S3_ENDPOINT` to the account endpoint and `S3_REGION=auto`.

## Inngest

```bash
npx inngest-cli@latest dev
```

Sync URL: `http://127.0.0.1:43127/api/inngest`

## Deploy (Vercel + Neon/Postgres)

1. Create a Vercel project from this repo (Framework Preset: Next.js).
2. Create a Neon (or other Postgres 16) project. Copy the pooled connection string into Vercel as `DATABASE_URL` for Production and Preview.
3. Copy every key from `.env.example` into Vercel env. Production values that must match the live host:
   - `AUTH_URL=https://proposalfast.ai`
   - `NEXT_PUBLIC_APP_URL=https://proposalfast.ai`
   - `RESEND_FROM_EMAIL` on an authenticated sending domain
   - Stripe price IDs + `STRIPE_WEBHOOK_SECRET` from the live endpoint
   - Optional `PLATFORM_ADMIN_EMAILS` (comma-separated) for `/admin`
4. Build command (Vercel project settings):

   ```bash
   prisma generate && prisma migrate deploy && next build
   ```

   `npm run build` already runs `prisma generate && next build`. **Always run `prisma migrate deploy` in production** — never `prisma migrate dev` against Neon.
5. After the first successful deploy, run `npx prisma db seed` once (plans + system templates). Leave `SEED_SAMPLE_DATA` unset/false in production.
6. **Domain / DNS for ProposalFast**
   - Canonical public host is `proposalfast.ai`. Add it (and `www`) in Vercel → Domains.
   - 301 `proposefast.com` / `www.proposefast.com` → `https://proposalfast.ai` (Vercel domain redirect is preferred; `next.config.ts` also 301s those hosts).
   - Keep Namecheap **Private Email** MX/TXT for `support@proposalfast.ai`. Do not switch nameservers if that would drop inbound mail.
   - Wait for HTTPS to issue, then confirm `AUTH_URL` / `NEXT_PUBLIC_APP_URL` use `https://proposalfast.ai`.
7. **Stripe webhook**
   - Endpoint URL: `https://proposalfast.ai/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.
8. Inngest: sync `https://proposalfast.ai/api/inngest`.
9. Platform admin: set `User.platformAdmin` in the database or list emails in `PLATFORM_ADMIN_EMAILS`. Org **Admin** cannot open `/admin`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js on port 43127 |
| `npm run build` | `prisma generate` + `next build` (local) |
| `npm run build:production` | `prisma generate` + `prisma migrate deploy` + `next build` (Vercel) |
| `npm run db:migrate:deploy` | `prisma migrate deploy` only |
| `npm start` | Production server on 43127 |
| `npm test` | Vitest (auth, RBAC, isolation, proposal lifecycle, Prisma smoke) |
| `npm run test:e2e` | Playwright marketing + login smoke; exits 0 if browsers are missing |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | Seed plans, templates, optional sample data |
| `npm run lint` | ESLint |

## Product rules

- AI never invents client facts. Use `[PLACEHOLDER]` or ask the user.
- Plan limits are enforced in server actions.
- Org data never crosses tenants.
- Stripe webhooks are the subscription source of truth.
- Clients view proposals at `/p/[publicId]` without an account.
- `/admin` is platform operators only (`User.platformAdmin` or `PLATFORM_ADMIN_EMAILS`).
- Team invites use Owner / Admin / Member / Viewer with server-side checks.
- Client comments are opt-in per proposal and attach to the current version.
- After `expiresAt`, the portal shows expired and refuses accept/sign; the owner can extend.

See [docs/LAUNCH_CHECKLIST.md](docs/LAUNCH_CHECKLIST.md) for the success-criteria map.

**Go live:** [docs/GO_LIVE.md](docs/GO_LIVE.md) (Vercel ↔ Origin click-path, env **names**, DNS). Audit: [docs/PRODUCTION_READINESS_AUDIT.md](docs/PRODUCTION_READINESS_AUDIT.md). Checklist: [docs/DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md).

Production build (Vercel): `npm run build:production` → `prisma generate && prisma migrate deploy && next build`. Sample users never seed when `NODE_ENV` or `VERCEL_ENV` is `production`.

## Sentry (optional)

Set `SENTRY_DSN` to a real Sentry project DSN. `src/instrumentation.ts` calls `Sentry.init` only when that variable is present. `src/lib/sentry.ts` (`captureException`) is a no-op otherwise. Do not set a placeholder DSN.

## Upstash rate limits (optional)

Set both `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. `rateLimit()` uses Redis `INCR` + `PEXPIRE`. If the call fails, it falls back to the in-process map so a Redis outage does not take down auth.

## Playwright

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

CI images without browsers should still pass: the wrapper prints a skip message and exits 0. `npm test` never launches a browser.

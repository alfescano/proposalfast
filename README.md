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

Authenticate `proposalfast.com` (or your sending domain) and set `RESEND_FROM_EMAIL`. The `EmailAdapter` interface is the swap point if you change providers.

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
   - `AUTH_URL=https://proposalfast.com`
   - `NEXT_PUBLIC_APP_URL=https://proposalfast.com`
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
   - Add `proposalfast.com` (and `www` if you want) in Vercel → Domains.
   - At the registrar, point the apex to Vercel (`A` 10.0.1.2 or the records Vercel shows) and `www` as a CNAME to `cname.vercel-dns.com`.
   - Wait for HTTPS to issue, then confirm `AUTH_URL` / `NEXT_PUBLIC_APP_URL` use `https://proposalfast.com`.
7. **Stripe webhook**
   - Endpoint URL: `https://proposalfast.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
   - Paste the signing secret into `STRIPE_WEBHOOK_SECRET`.
8. Inngest: sync `https://proposalfast.com/api/inngest`.
9. Platform admin: set `User.platformAdmin` in the database or list emails in `PLATFORM_ADMIN_EMAILS`. Org **Admin** cannot open `/admin`.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js on port 43127 |
| `npm run build` | `prisma generate` + `next build` |
| `npm start` | Production server on 43127 |
| `npm test` | Vitest (auth, RBAC, isolation, proposal lifecycle, Prisma smoke) |
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

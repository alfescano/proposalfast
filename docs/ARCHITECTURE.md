# ProposalFast architecture

ProposalFast is a multi-tenant SaaS for creating, sending, tracking, signing, and collecting payment on client proposals. This document covers Phases 1–4 plus launch polish: comments, expiry, optional Sentry/Upstash, block editor, and the launch checklist.

## Stack choices

| Concern | Choice | Why |
| --- | --- | --- |
| App | Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, shadcn/ui | Locked. |
| Data | PostgreSQL + Prisma **6** | Prisma 7 moves the datasource URL into `prisma.config.ts` and changes client generation. Prisma 6 is the production-stable line that `@auth/prisma-adapter` already ships against. |
| Auth | Auth.js (`next-auth@5.0.0-beta.32`) | Official NextAuth v5 package on npm is still the beta line. JWT session cookies, bcrypt password hashes (`bcryptjs` — same algorithm, no native addon, so Vercel/serverless stays reliable). |
| AI | Official OpenAI SDK via `AIService` | No canned completions. Missing `OPENAI_API_KEY` throws. |
| Payments | Stripe SDK + webhooks | Subscriptions and proposal Checkout. Webhooks are the only writer of paid `Subscription` rows. |
| Email | `EmailAdapter` + Resend | Swappable. Console adapter is development-only and refuses `NODE_ENV=production`. |
| Files | AWS SDK v3 (`S3Client`) | Works with AWS S3 and Cloudflare R2 (`S3_ENDPOINT`). |
| PDF | `@react-pdf/renderer` | Deterministic proposal PDFs without a Chromium binary — fits Vercel serverless size and time limits. Puppeteer was rejected for that reason. |
| Jobs | Inngest | First-class Next.js route at `/api/inngest`, local `inngest-cli`, and typed events for AI, email, PDF, and follow-ups. Trigger.dev is a fine alternative; Inngest has the thinner local loop. |
| Validation | Zod on every action and public API |  |
| Deploy | Vercel + managed Postgres (Neon or Supabase) |  |

## Folder structure

```
prisma/                 schema, migrations, seed
docs/                   architecture
src/app/
  (marketing)/          public site
  (auth)/               login, register, reset, verify
  (app)/                dashboard, proposals, clients, settings
  (admin)/admin/        platform operators only (not org Admin)
  p/[publicId]/         client portal (no account)
  invite/[token]        team invite accept/register
  api/auth/             Auth.js
  api/webhooks/stripe/  signed Stripe events
  api/inngest/          background jobs
  api/contact/          marketing contact form → SupportRequest
src/actions/            server actions (auth, org, CRM, proposals, team, account)
src/auth.ts             Node runtime Auth.js (Prisma + credentials)
src/auth.config.ts      Edge-safe config used by middleware
src/lib/
  ai/                   AIService + extract→outline→generate→QC→score
  email/                adapter + Resend + console + templates
  stripe/               Checkout, portal, webhook handlers
  storage/              S3 adapter
  inngest/              client + functions
  pdf/                  react-pdf document
  plans.ts              FREE / PRO / BUSINESS (source of truth)
  rbac.ts               Owner / Admin / Member / Viewer
  org.ts                tenant context + plan capacity checks
```

## Multi-tenant isolation

- Every `Client`, `Proposal`, `File`, `Payment`, `AIUsage`, `FollowUp`, and `Notification` row has `organizationId`.
- Server actions call `requireOrg` / `requireWritableOrg` first, then query with `{ organizationId, deletedAt: null }`.
- A record from another workspace throws `TenantError` — never a 200 with leaked data.
- The public portal loads by `publicId` only and writes `ProposalView` / `ProposalEvent` against that proposal.

## RBAC

| Role | Read | Write proposals/clients | Manage members | Billing |
| --- | --- | --- | --- | --- |
| Viewer | Yes | No | No | No |
| Member | Yes | Yes | No | No |
| Admin | Yes | Yes | Yes | No |
| Owner | Yes | Yes | Yes | Yes |

Enforced in `src/lib/rbac.ts` and `src/lib/org.ts`, not only in the UI. Workspace settings and notification prefs require Admin+. Data export and account deletion require Owner.

Invites (`OrganizationInvite`) are email + role (Admin/Member/Viewer). Accepting from `/invite/[token]` adds a membership. Users with more than one org switch via the `pf_org` cookie.

**Platform admin is not org Admin.** `/admin` calls `requirePlatformAdmin()` (`User.platformAdmin` or `PLATFORM_ADMIN_EMAILS`). Everyone else gets a 404 — the admin chrome is never rendered for normal users.

## Billing plans

Defined in `src/lib/plans.ts` and seeded into `Plan`:

| Tier | Proposals | Clients | Seats | AI / month |
| --- | --- | --- | --- | --- |
| FREE | 5 | 10 | 1 | 10 |
| PRO | 100 | 500 | 5 | 200 |
| BUSINESS | Unlimited | Unlimited | 25 | 1000 |

`assertPlanCapacity` and `assertAiQuota` run in server actions before insert. The UI cannot raise a limit.

Paid status is written only from verified Stripe webhooks (`customer.subscription.*`, `checkout.session.completed`). Clicking “Upgrade” without a webhook does nothing to `Subscription.planId`.

## AI pipeline (no hallucination)

`AIService.complete` / `completeJson` is the only OpenAI entry point. Models: `OPENAI_MODEL` and `OPENAI_MODEL_FAST`.

`runProposalPipeline` in `src/lib/ai/pipeline.ts`:

1. **Extract** — Zod `extractResultSchema`. Facts explicitly present in the brief.
2. **Outline** — Zod `outlineResultSchema`.
3. **Generate** — Zod `generateResultSchema`. Missing commercial facts become `[PLACEHOLDER: …]`.
4. **QC** — Zod `qcResultSchema`. Flag invented prices, stats, guarantees, or case studies.
5. **Score** — Zod `scoreDimensionsSchema` (completeness, fidelity, clarity, commercialReadiness, overall 0–100), blended with a local placeholder completeness score.

Each `completeJson` call retries **once** if Zod rejects the payload. After generate, `sanitizeInventedClaims` strips dollar amounts, guarantee percents, and case-study language that do not appear in the fact corpus.

Rewrite modes (`src/lib/ai/rewrite.ts`) apply the same rules to a selected span. `AIUsage` logs every call; `assertAiQuota` enforces FREE/PRO/BUSINESS monthly caps. Create-proposal can run the pipeline when “Draft with AI” is checked.

## Email

`getEmailAdapter()` returns `ResendEmailAdapter` when `RESEND_API_KEY` is set. Otherwise, in development only, `ConsoleEmailAdapter` logs the message. Production throws if the Resend key is missing.

Used for: welcome, verification, password reset, contact, proposal sent / opened / accepted / signed, payment received, subscription started / canceled, follow-ups (opt-in only).

## Jobs

Inngest functions (wired at `/api/inngest`):

- `proposal/generate` — full AI pipeline + new `ProposalVersion`
- `email/send` — adapter send
- `proposal/pdf` — render + S3 upload
- `proposal/follow-up` — scheduled reminder

If `INNGEST_EVENT_KEY` is unset, proposal generation still runs inline when `OPENAI_API_KEY` is present so local work is not blocked on the Inngest dev server.

## Security

- Passwords: bcrypt cost 12, never stored in plaintext.
- Reset and verification tokens stored as SHA-256 hashes.
- Auth.js JWT cookies, `trustHost: true`, `Secure` in production (HTTPS).
- Stripe: `constructEvent` with `STRIPE_WEBHOOK_SECRET`. Unsigned bodies are 400.
- IP addresses on views/signatures are hashed with `AUTH_SECRET`.
- Rate limits on register, login, forgot-password, contact, public sign/accept/comment, and AI generate/rewrite (`src/lib/rate-limit.ts`). Uses Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set; otherwise an in-process map. Redis errors fall back to memory.
- Optional Sentry: `SENTRY_DSN` initializes `@sentry/nextjs` in `src/instrumentation.ts`. Unset = no-op.
- Security headers in `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`.
- Audit log on register, password reset, onboarding, client/proposal writes, team changes, account deletion, and Stripe events.
- Owner data export at `GET /settings/export`. Last-owner account deletion archives the org, clients, and proposals, then anonymizes the user.

## Public client portal

`/p/[publicId]` is unauthenticated. It records a view (first open emails the owner and writes an in-app notification), renders the latest sections, and offers:

- **Accept** — name + email. Sets `ACCEPTED` / `acceptedAt` without locking.
- **E-sign** — name, email, typed or drawn signature, consent checkbox. Persists `Signature` (version id, IP hash, user agent, timestamp) and locks every `ProposalVersion`. Further edits throw `ProposalLockedError`.
- **Pay** — Stripe Checkout when `paymentEnabled` and an amount are set. Modes: FULL, DEPOSIT (% of `amountCents`), FIXED.
- **Comments** — opt-in (`Proposal.commentsEnabled`). Stored on the current `ProposalVersion`. Owner email + in-app notification.
- **Expiry** — `expiresAt` (synced with `validUntil`). After that instant the portal shows expired and refuses accept/sign. Owner extends from the editor.

The portal uses skip-to-content, labeled fields, a named signature pad, and ink-on-paper contrast for keyboard and screen-reader use.

Proposal blocks (heading, paragraph, pricing, signature, FAQ, plus legacy types) persist `type`, body, and `sortOrder`. The editor autosaves after 1.2s and can reorder.

## Stripe billing

Plans live in `src/lib/plans.ts` (the UI only reads that catalog). Owner starts Checkout; `STRIPE_TRIAL_DAYS` (1–30) is attached when set. Customer Portal requires a stored `stripeCustomerId`.

`handleStripeEvent` claims `StripeEvent.id` first (unique). Duplicates return `{ duplicate: true }` and do not write again. Failed handlers delete the claim so Stripe can retry. Webhook signatures are verified in `/api/webhooks/stripe`.

## Follow-ups

Inngest `proposal/follow-up` sends only when **both** the workspace (`Settings.followUpOptIn`) and the proposal (`Proposal.followUpOptIn`) are on. Off by default.

## PDF

`GET /proposals/[id]/pdf` renders `@react-pdf/renderer` with brand color, pricing box, and a signature block (filled after sign).

## Deployment

1. Provision Neon or Supabase Postgres.
2. Set every **REQUIRED** and **PRODUCT** key from `.env.example` on Vercel.
3. `npx prisma migrate deploy`
4. `npx prisma db seed` (plans + system templates; sample data stays off in production unless `SEED_SAMPLE_DATA=true`)
5. Stripe webhook URL: `https://<host>/api/webhooks/stripe` (`checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`)
6. Inngest app pointing at `/api/inngest`
7. Domain: `proposalfast.ai`. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://proposalfast.ai`. 301 `proposefast.com` to the canonical host.
8. Optional `PLATFORM_ADMIN_EMAILS` for the `/admin` console.

Production migrate is `npx prisma migrate deploy` (never `migrate dev` against Neon). See the README for DNS and Vercel build command details.

## Analytics and notifications

Dashboard and `/admin` charts aggregate `ProposalEvent` (`created`, `sent`, `viewed`, `accepted`, `signed`) and succeeded `Payment` rows. Funnel: signup / members → first proposal → sent → opened → accepted → paid.

In-app notifications (`Notification`) fire for opened / accepted / signed / paid / subscription failed. Workspace Admins toggle `Settings.notify*`. Stripe `invoice.payment_failed` writes the subscription-failed alert.

Local loop: Postgres 16 (Docker Compose or the packages in this environment), `npm install`, `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev` on port **43127**.

# ProposalFast production readiness audit

**Date:** 2026-09-07  
**Verdict:** Do **not** deploy. Local build, Postgres, auth, isolation, proposal lifecycle, e-sign lock, PDF, admin gate, and tests were run. Live OpenAI / Stripe / Resend / S3 / Inngest / production DNS were **not** exercised. Those surfaces are **NEEDS CONFIGURATION**, not PASS.

Statuses below are only **PASS**, **FAIL**, or **NEEDS CONFIGURATION**. PASS means this audit ran or inspected the path and it behaved. Code existing is not PASS.

---

## 1) What was run (commands + outcomes)

| Command | Outcome |
| --- | --- |
| `npx prisma validate` | Schema valid. Provider is PostgreSQL (`localhost:5432` / database `proposalfast`). |
| `npx prisma migrate status` | 4 migrations present and applied (`init`, `phase3_sign_pay_ai`, `phase4_admin_teams_notifs`, `comments_expiry`). |
| `npx prisma db seed` | Seeded / refreshed demo users. Created non-admin `member@proposalfast.dev`. |
| `npx tsc --noEmit` | Exit 0 after audit fixes. |
| `npx eslint . --max-warnings=0` | Exit 0. |
| `npx vitest run` | **21 files, 56 passed, 0 failed, 0 skipped.** Duration ~8.5s. |
| `npx vitest run --coverage` | Not collected — `@vitest/coverage-v8` is not installed. |
| `npm run build` | Exit 0. Next.js 15.5.25 compiled, linted, and type-checked. 25 static pages generated. |
| Client bundle grep (`/.next/static` for `process.env.OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`) | **No matches.** `OPENAI_API_KEY` appears only as UI copy on `/proposals/new` (“requires OPENAI_API_KEY”). Secret usage is server-only. |
| HTTP against `http://127.0.0.1:43127` | `/api/health` 200 `{"ok":true}`. Unauthenticated `/dashboard`, `/settings`, `/admin`, `/clients`, `/library` → **307** to `/login`. `/api/webhooks/stripe` POST without signature → **400** `Missing stripe-signature`. Marketing `/`, `/login`, `/pricing`, `/features`, `/templates`, `/sitemap.xml` → 200. `/p/doesnotexist999` → 404. `/p/dPD2TtktTd2o` (seed) → 200. Contact POST 6th request → **429**. Security headers present (`X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`). Auth.js cookies `HttpOnly; SameSite=Lax`. |
| `npx playwright test` | **8 passed / 0 failed** (smoke + audit: unauth redirects, demo login, member `/admin` 404, mobile home, mobile portal). |
| PDF render (`src/lib/pdf.audit.test.ts`) | Wrote `tmp/audit-proposal.pdf` (3290 bytes). Header `%PDF-1.3`, MediaBox 612×792 (Letter), Times-Roman/Bold/Italic, title `Brand system for Harbor & Co (sample)`, author `Northline Studio`, `%%EOF`. Body is FlateDecode (placeholder text not visible as raw ASCII). Layout: single page, no logo, no images, brand bar + serif type only. |
| Repo secret scan (`sk_live`, `sk_test`, `whsec_`, `AKIA…`, PEM keys, `OPENAI_API_KEY=sk-`) | Only intentional **test** dummies in `src/lib/security.guards.test.ts` (`sk_test_dummy_not_live`). `.env` is gitignored. `.env.example` has empty placeholders. |
| `TODO` / `FIXME` / `XXX` / `HACK` in `src/` | **None.** Other “placeholder / dummy / mock” hits are product language (`[PLACEHOLDER: …]`), test fixtures, or refuse-to-mock error strings. |

Local Postgres is real (`pg_isready` accepted connections; Prisma datasource `postgresql://…@localhost:5432/proposalfast`). Not a mock DB.

---

## 2) Fixes committed during this audit

Proven gaps that were fixed and re-tested:

1. **Change password was missing.** Added `changePasswordSchema`, `changePasswordForUser`, `changePasswordAction`, Settings UI. Lifecycle test: register → verify → reset → change password + `AuditLog` (`user.password_changed`).
2. **Section IDOR.** `saveProposalSectionsAction` updated `ProposalSection` by id only. Extracted `saveProposalSectionsForOrg` — updates require `versionId` of the caller’s proposal. Cross-org forged section ids now throw `TenantError`; Alpha body unchanged.
3. **Status unlock.** `setProposalStatusAction` could rewrite status on a signed proposal. Now uses `setProposalStatusForOrg` + `isProposalLocked`.
4. **AI persist lock.** `persistGeneratedVersion` now uses `isProposalLocked` (status / `lockedAt` / version lock), not only `lockedAt`.
5. **`robots.txt`** now disallows `/admin` and `/library`.
6. **Plan-limit bypass.** `assertPlanCapacity` extracted to `src/lib/plan-capacity.ts`. FREE org with 5 proposals: 6th capacity check throws `PlanLimitError`.
7. **Follow-up processor** extracted (`processScheduledFollowUp`) and tested: missing opt-in → `CANCELED`; both opt-ins → `SENT` via console adapter (dev only).
8. **Seed non-admin user** `member@proposalfast.dev` / `MemberPassword123!` for `/admin` 404 e2e.
9. **`.env.example`** every variable classified `REQUIRED` \| `OPTIONAL` \| `DEVELOPMENT ONLY` \| `PRODUCTION`. No real secrets.

---

## 3) Final status table

| AREA | STATUS | EVIDENCE | REMAINING ACTION |
| --- | --- | --- | --- |
| Build | PASS | `npm run build` exit 0; Next compiled + lint + types. Transient Turbopack 500s after mixing prod `.next` with `next dev` were environmental; after `rm -rf .next` health/home/login returned 200. | Keep prod and dev `.next` caches separate. |
| TypeScript | PASS | `npx tsc --noEmit` exit 0. | None. |
| Database | PASS | Live Postgres; Prisma models User, Organization, members/roles, Client, Proposal, ProposalVersion, ProposalSection, Template, ProposalView/Event, Signature, Payment, Subscription, Notification, AIUsage, FollowUp, File, AuditLog, StripeEvent, Settings, invites. FKs + indexes + uniques present. Soft-delete on User/Org/Client/Proposal/Template/File. Cascades on members/versions/events; `Proposal.createdBy` and `File.createdBy` Restrict (account delete anonymizes). | None for schema. Production must use its own `DATABASE_URL`. |
| Migrations | PASS | `prisma migrate status`: 4 migrations up to date on local Postgres. | On the production DB run `npx prisma migrate deploy` (never `migrate dev`). |
| Authentication | PASS | Register/verify/reset/change-password integration test (56th suite). Demo login e2e. Unauth app routes 307 → login. JWT session 14d, `HttpOnly` + `SameSite=Lax` cookies. Forgot does not leak whether email exists. | Configure Google OAuth only if wanted. Production needs HTTPS `AUTH_URL`. |
| Authorization | PASS | RBAC unit test Owner>Admin>Member>Viewer. `requireWritableOrg` is MEMBER+. Viewer cannot write. Billing Owner-only. Platform admin ≠ org Admin (`platform-admin.test.ts` + e2e 404). | None. |
| Organization isolation | PASS | Prisma isolation + write IDOR tests: org B cannot read/write org A client, proposal, section, file, payment, membership, or analytics. `persistGeneratedVersion` with org B id throws. Plan capacity scoped by `organizationId`. | None. |
| Onboarding | PASS | `/onboarding` requires ADMIN+; writes Organization + Settings (`completeOnboarding`). Seed/demo already completed so page redirects. Schema validated. | None. |
| Dashboard | PASS | Demo user e2e reached dashboard. Counts/charts query live Prisma (`loadOrgAnalytics`) filtered by org. | None. |
| Clients | PASS | CRM actions org-scoped; IDOR update/delete throw `TenantError`. FREE client cap is server-side. | None. |
| Proposal creation | PASS | `createProposalAction` + plan cap + client/template org checks. Lifecycle test created versions/sections/events in Postgres. | None. |
| AI | NEEDS CONFIGURATION | Pipeline is real code (`src/lib/ai/pipeline.ts`: extract→outline→generate→QC→score). `AIService` throws without `OPENAI_API_KEY` (tested). `queueProposalGenerationAction` returns that error when unset. No live OpenAI call was made. | Set `OPENAI_API_KEY` (optional `OPENAI_MODEL` / `OPENAI_MODEL_FAST`). Do not paste the key in chat. |
| AI safety/validation | PASS | Placeholders replace invented prices/guarantees (unit tests). Malformed JSON → `parseJsonAgainst` fail; `completeJson` retries once then throws. `assertAiQuota` rejects after 10 FREE `AIUsage` rows. Key not in client bundle. | None beyond providing a live key to run the model. |
| Proposal editor | PASS | Blocks persist type/sortOrder via version-scoped save. Locked/signed proposals refuse persist (lock test). Autosave UI present. | None. |
| Templates | PASS | System catalog + `/library` org-or-system query. Marketing `/templates` is public. Seed consulting template used in create path. | None. |
| Pricing | PASS | `PLAN_CATALOG` + `chargeAmountCents` (FULL/DEPOSIT/FIXED). Pricing blocks default to `[PLACEHOLDER]`. Server plan caps tested. | Stripe price IDs required before Checkout (see Stripe). |
| Client portal | PASS | HTTP 200 on seed `/p/dPD2TtktTd2o`; 404 on unknown id. Playwright mobile viewport. Accept/sign UI present. `robots` noindex on portal metadata. | None. |
| Tracking | PASS | Lifecycle test: view → `ProposalView` + `ProposalEvent` `viewed` + notification `opened`. First-open email uses console adapter in dev. | Production email of “opened” needs Resend. |
| E-signature | PASS | `recordPublicSignature` writes Signature (SIGNED) + AuditLog `proposal.signed` + version `locked` + `lockedAt`. Subsequent generate persist throws `/locked/i`. Accept is separate from sign. | None. |
| PDF | PASS | Real file `tmp/audit-proposal.pdf` from seed proposal. Letter page, react-pdf, title/author correct. Layout is sparse (no logo, compressed body, single page). Route `/proposals/[id]/pdf` is org-scoped. | Optional S3 upload of PDFs via Inngest (`S3_*`). Review visual spacing with a designer after logos exist. |
| Stripe | NEEDS CONFIGURATION | `getStripe()` / `constructWebhookEvent()` throw without keys (tested). Unsigned webhook HTTP 400. Idempotency: `StripeEvent` claim-once + `handleStripeEvent` duplicate (tested against live Postgres). Subscription writes only inside verified webhook handler. **No Checkout/Portal/deposit session was created.** Dummy keys used only to prove forged signatures fail. | Create Stripe products/prices, set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs, webhook URL `/api/webhooks/stripe`. |
| Payments | NEEDS CONFIGURATION | Proposal Checkout code exists (`createProposalPaymentCheckout`); missing secret throws, no mock success. Deposit math is unit-level via `chargeAmountCents`. | Same Stripe keys + enable `paymentEnabled` on a proposal. |
| Resend | NEEDS CONFIGURATION | `getEmailAdapter()` throws in `NODE_ENV=production` without `RESEND_API_KEY` (tested). `ConsoleEmailAdapter.send` throws in production. Dev adapter logs `[email:console]` and does **not** claim Resend delivery. Contact form in this audit used the console adapter (200) — that is **not** production success. | Authenticate a sending domain; set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. |
| Follow-ups | PASS | Dual opt-in required; processor cancels otherwise; send marks `SENT` (console in this audit). Inngest job wraps the same function. Scheduled fire in production needs Inngest keys. | Set `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` so reminders send on a schedule (otherwise they stay `SCHEDULED`). |
| CRM | PASS | Clients + notes + soft-delete; org isolation tested. | None. |
| Admin | PASS | `requirePlatformAdmin`: unauthenticated → login (307). Org owner `member@proposalfast.dev` → **404** (Playwright). Flag or `PLATFORM_ADMIN_EMAILS` only. | Set `PLATFORM_ADMIN_EMAILS` or `User.platformAdmin` for the live operator. Demo `alex@…` is platformAdmin only when `NODE_ENV !== production`. |
| Teams/RBAC | PASS | Invite/accept/roles in schema + `team.ts` + RBAC helpers. Isolation test attaches a VIEWER. Seat cap via `assertPlanCapacity("members")`. | None. |
| Analytics | PASS | `loadOrgAnalytics` scoped by `organizationId`. Org B funnel `paid=0` while org A `paid=1` after a SUCCEEDED payment row. Dashboard charts use this. | None. |
| Notifications | PASS | Lifecycle created `opened` / `accepted` / `signed`. Comment test created `comment`. Prefs live on Settings. | Opened/signed emails in production need Resend. |
| File storage | NEEDS CONFIGURATION | `File` model is org-scoped; isolation test: org B `findFirst` by file id is null. `getStorage()` throws without `S3_*` (tested). No public upload API (safer than an open endpoint). Inngest PDF upload cannot run without S3. No general upload UI. | Set S3/R2 vars if you want stored PDFs/logos. Keep uploads server-side and org-prefixed. |
| Security | PASS | IDOR fail-closed (clients/proposals/sections/files/payments/analytics). Admin 404. Webhook signature required. Rate limits. Cookies HttpOnly/Lax. Headers DENY/nosniff/HSTS. No committed secrets. No `TODO`/`FIXME` in `src/`. | Production HTTPS + real secrets in the host, not the repo. |
| Rate limiting | PASS | In-process limiter unit test. Contact API 5/min then 429 (this audit). Auth/AI/portal actions call `assertRateLimit`. Upstash not configured — memory fallback (one Node instance). | Optional: `UPSTASH_REDIS_REST_URL` + `TOKEN` for multi-instance prod. |
| Mobile | PASS | Playwright 390×844: marketing home + seed portal heading visible. App sidebar is `md:flex` (mobile uses stacked layout). | Spot-check editor on a real phone after deploy. |
| SEO | PASS | `robots.txt` allows `/`, disallows app + `/admin` + `/library` + `/api/`. Sitemap 200 for marketing routes only. Portal metadata `robots: noindex`. | Point `NEXT_PUBLIC_APP_URL` at the live host so sitemap URLs are canonical. |
| Tests | PASS | Vitest **56 / 56 passed / 0 failed / 0 skipped**. Playwright **8 / 8 passed**. Coverage **not collected**. | Optional: add `@vitest/coverage-v8` later. |
| Environment configuration | PASS | `.env.example` lists every var with class REQUIRED / OPTIONAL / DEVELOPMENT ONLY / PRODUCTION. Local `.env` gitignored; no live keys present. | Fill production secrets in the host (Vercel/Neon), never commit them. |
| Deployment readiness | NEEDS CONFIGURATION | Checklist written in `docs/DEPLOYMENT_CHECKLIST.md`. **This audit did not deploy.** Production DB, DNS, Stripe webhook, Resend domain, and secrets are not configured. | Follow the checklist. Do not ship until those items are done. |

---

## Repo search (TODO / mock / dummy / placeholder)

| Hit | Classification |
| --- | --- |
| `[PLACEHOLDER: …]` in AI, templates, editor, marketing | **Product rule** — missing facts, not unfinished code. |
| `placeholder=` on inputs | HTML attribute. |
| `sk_test_dummy_not_live` in `security.guards.test.ts` | **Test-only** forged Stripe secret to prove verify fails. |
| “Refusing to mock a payment / fabricate AI output” | Fail-closed production errors. |
| `SEED_SAMPLE_DATA` / `alex@proposalfast.dev` | **Development only.** |
| `TODO` / `FIXME` in `src/` | **None found.** |

---

## Honest blockers (do not deploy until these are true)

1. Production Postgres + `prisma migrate deploy`.
2. `AUTH_SECRET`, HTTPS `AUTH_URL` / `NEXT_PUBLIC_APP_URL`.
3. Resend domain + API key (verification, send, follow-ups, opened alerts).
4. Stripe secret, webhook secret, price IDs, endpoint on the live host (or stay on Free with no Checkout).
5. OpenAI key only if AI drafting is sold on day one.
6. S3/R2 only if stored PDFs/logos are required.
7. A real platform admin email (seed admin flag is stripped in production).
8. Inngest if scheduled follow-ups and background AI must run unattended.

---

## EXTERNAL ACCOUNTS/CREDENTIALS I MUST CONFIGURE

Do **not** paste secret keys into chat. Create them in each vendor dashboard and set them on the host (Vercel env, or equivalent).

### Neon / PostgreSQL (required to boot)

1. Create a Neon (or other Postgres 16) project.
2. Copy the pooled connection string into `DATABASE_URL`.
3. From CI or a one-off job: `npx prisma migrate deploy`.
4. Do **not** set `SEED_SAMPLE_DATA=true` on this database.

### Auth / domain (required)

1. Buy/point the apex (and optional `www`) to the Vercel project.
2. Issue HTTPS.
3. Set `AUTH_URL` and `NEXT_PUBLIC_APP_URL` to `https://proposalfast.ai` (or the live host).
4. Generate `AUTH_SECRET` with `openssl rand -base64 32` and store it only in the host.

### Vercel (or other Node host)

1. Import this repo. Framework: Next.js. Install: `npm ci`. Build: `npm run build`.
2. Bind the production env vars from `.env.example` (never commit `.env`).
3. After first deploy, confirm `/api/health` returns `{"ok":true,"service":"proposalfast"}`.

### Resend (required to send email in production)

1. Create a Resend account. Add and verify `proposefast.com` (SPF/DKIM/DMARC as Resend instructs).
2. Create an API key. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (e.g. `ProposalFast <noreply@proposefast.com>`).
3. Without these, production email **throws** — it will not silently succeed.

### Stripe (required for paid plans and proposal Checkout)

1. Create a Stripe account (test first, then live).
2. Create Products/Prices for Pro and Business, monthly and yearly.
3. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_BUSINESS_MONTHLY`, `STRIPE_PRICE_BUSINESS_YEARLY`. While Founding Pro is advertised, also set `STRIPE_PRICE_FOUNDING_PRO_MONTHLY` to a real $29/month Price id.
4. Optional: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (browser only; never the secret).
5. Add a webhook endpoint `https://<host>/api/webhooks/stripe` for `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`.
6. Set `STRIPE_WEBHOOK_SECRET` from that endpoint. Subscriptions update **only** from this verified webhook.

### OpenAI (required only for AI draft/rewrite)

1. Create an OpenAI project API key with access to the configured models.
2. Set `OPENAI_API_KEY`. Optional: `OPENAI_MODEL`, `OPENAI_MODEL_FAST`.
3. Missing key returns a real error; the app will not invent proposal copy.

### S3 or Cloudflare R2 (required only for stored files/PDF uploads)

1. Create a private bucket.
2. Set `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Optional: `S3_REGION`, `S3_ENDPOINT`, `S3_PUBLIC_URL`.
3. Keep objects under `org/<organizationId>/…`. Do not make the bucket world-readable.

### Inngest (optional but needed for scheduled follow-ups / background AI)

1. Create an Inngest app. Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY`.
2. Point the serve route at `/api/inngest`.

### Platform admin

1. Set `PLATFORM_ADMIN_EMAILS` to the operator’s email, **or** set `User.platformAdmin=true` in production SQL after that user exists.
2. Org Admin is not enough. `/admin` 404s for everyone else.

### Optional

- Google OAuth: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, callback `{AUTH_URL}/api/auth/callback/google`.
- Sentry: `SENTRY_DSN` (no-op when unset).
- Upstash: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for multi-instance rate limits.

---

**STOP. Not deployed.**

# ProposalFast launch checklist

Maps the original product success criteria to what ships in this repo, and what still needs Alfredo’s live keys or operational setup. Nothing here is faked.

| Criterion | Status | Notes |
| --- | --- | --- |
| Register / login / verify / reset | Works | Email/password + optional Google. Verification and reset send via Resend; console logger in development only. |
| Multi-tenant orgs + RBAC | Works | Owner / Admin / Member / Viewer enforced on the server. Org isolation tests. |
| Team invites | Works | Email invite, accept, register-from-invite. Seat limits from the plan catalog. |
| Clients + proposals | Works | CRM, versions, sections, archive. |
| Block editor | Works | Heading, paragraph, pricing, signature, FAQ (and legacy types). Persist, reorder, add/remove. Debounced autosave + manual save. |
| AI draft from facts | Works when keyed | OpenAI pipeline extract → outline → generate → QC → score. No key → real error, not a canned draft. |
| Send + public portal | Works | `/p/[publicId]`, view tracking, first-open email. |
| Accept + e-sign | Works | Accept then typed/drawn sign with consent. Locks versions. |
| Client comments (opt-in) | Works | Portal form when `commentsEnabled`. Stored on the current version. Owner email + in-app notification. |
| Expiration | Works | `expiresAt` (kept in sync with `validUntil`). Portal shows expired and disables accept/sign. Owner can extend 14 days or set a new date. |
| Stripe subscriptions | Needs keys | Checkout + Customer Portal. Webhooks are the only writer of paid `Subscription`. |
| Proposal payment | Needs keys | FULL / DEPOSIT / FIXED via Checkout. Skipped in tests when keys are absent. |
| PDF | Works | `@react-pdf/renderer` at `/proposals/[id]/pdf`. |
| Follow-ups | Works when opted in | Both workspace and proposal must opt in. Inngest required to fire on schedule. |
| Dashboard charts + funnel | Works | From `ProposalEvent` and succeeded payments. |
| In-app notifications | Works | Opened / accepted / signed / paid / subscription failed / comment. Prefs in Settings. |
| Platform admin `/admin` | Works | `User.platformAdmin` or `PLATFORM_ADMIN_EMAILS`. Org Admin is not enough. |
| Data export + account delete | Works | Owner JSON export; last-owner cascade archive + anonymize. |
| Rate limits | Works | In-process by default. Upstash Redis when `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set. |
| Sentry | Optional | No-op unless `SENTRY_DSN` is set. Init in `src/instrumentation.ts`. |
| Cookie banner | Works | Marketing pages. Essential cookies only unless accepted. |
| Marketing site + legal | Works | Features, pricing, templates, security, privacy, terms, cookies, refunds, contact. |
| Vitest suite | Works | `npm test` — auth, RBAC, isolation, lifecycle, expiry, placeholders, webhooks. |
| Playwright smoke | Optional | `npm run test:e2e` — home + login. Skips with exit 0 if Chromium is not installed. |

## Alfredo must supply for production

These surfaces refuse to pretend they work without credentials:

1. **`DATABASE_URL`** — Neon/Postgres. Run `npx prisma migrate deploy` (not `migrate dev`).
2. **`AUTH_SECRET`**, **`AUTH_URL`**, **`NEXT_PUBLIC_APP_URL`** — `https://proposalfast.ai`.
3. **`RESEND_API_KEY`**, **`RESEND_FROM_EMAIL`** — authenticated sending domain (e.g. `ProposalFast <noreply@proposalfast.ai>`). Canonical brand domain is `proposalfast.ai`; `proposefast.com` remains valid if still verified. Production throws without Resend.
4. **`OPENAI_API_KEY`** — generation and rewrite.
5. **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable key, Pro/Business price IDs. Webhook URL: `https://proposalfast.ai/api/webhooks/stripe`.
6. **S3/R2** — logos, PDFs, drawn signatures if stored.
7. **DNS** — Namecheap Advanced DNS for `proposalfast.ai` (A `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`, or the records Vercel shows); HTTPS issued. Keep Private Email MX. 301 `proposefast.com` → `https://proposalfast.ai`.
8. Optional: Google OAuth, Inngest, `PLATFORM_ADMIN_EMAILS`, `SENTRY_DSN`, Upstash Redis, `STRIPE_TRIAL_DAYS`.

## True blockers before charging customers

- Live Stripe products/prices + signed webhook (subscriptions will stay Free without this).
- Resend domain authentication (clients will not receive proposal emails).
- Production `AUTH_URL` / cookie domain on HTTPS (sessions will fail on the real host).
- `prisma migrate deploy` against the production database.
- A platform admin email or `User.platformAdmin` so `/admin` is reachable after launch.
- OpenAI only if you sell AI drafting on day one; the rest of the product works without it.

Not blockers: Sentry, Upstash, Inngest, Google login, Playwright in CI, sample seed data.

# ProposalFast deployment checklist

**Click-path for Origin → Vercel → `proposalfast.ai`:** [docs/GO_LIVE.md](GO_LIVE.md).

This file is the operational list. It is not a substitute for `docs/PRODUCTION_READINESS_AUDIT.md`.

Use this only after local `npm run build` and `npx prisma migrate status` are clean (they were on 2026-09-07).

## 1. Host and DNS

- [ ] Vercel (or equivalent Node 20+) project created from this repo
- [ ] Apex + optional `www` DNS pointed at the host; HTTPS issued
- [ ] `AUTH_URL` = `https://proposalfast.ai`
- [ ] `NEXT_PUBLIC_APP_URL` = `https://proposalfast.ai`
- [ ] `AUTH_SECRET` = 32+ random bytes, unique to production

## 2. Database

- [ ] Production Postgres (Neon recommended) created — not the local Docker DB
- [ ] `DATABASE_URL` set on the host
- [ ] `npx prisma migrate deploy` run against that URL
- [ ] `SEED_SAMPLE_DATA` unset or `false` (never seed demo users in production)
- [ ] `/api/health` returns `{"ok":true,"service":"proposalfast"}`

## 3. Email (blocking if you send proposals)

- [ ] Resend domain authenticated (SPF/DKIM)
- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL` set
- [ ] Send a real verification email to yourself from the production register flow

## 4. Stripe (blocking if you charge)

- [ ] Live (or test-then-live) products/prices for Pro and Business
- [ ] `STRIPE_SECRET_KEY` + four `STRIPE_PRICE_*` vars
- [ ] Webhook endpoint `https://<host>/api/webhooks/stripe`
- [ ] Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- [ ] `STRIPE_WEBHOOK_SECRET` set
- [ ] Confirm a test Checkout updates `Subscription` only after the webhook (never from the success URL alone)

## 5. AI (blocking only if you sell drafts)

- [ ] `OPENAI_API_KEY` set on the server only
- [ ] Confirm a generate from a real brief writes `AIUsage` and `[PLACEHOLDER]` for missing fees

## 6. Files (optional)

- [ ] Private S3/R2 bucket + `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
- [ ] Optional `S3_ENDPOINT` / `S3_PUBLIC_URL` for R2
- [ ] Confirm PDF job keys are `org/<organizationId>/…`

## 7. Jobs and limits (optional)

- [ ] Inngest keys + `/api/inngest` connected (follow-ups + background generate)
- [ ] Upstash Redis if more than one Node instance
- [ ] `SENTRY_DSN` if you want crash reports

## 8. Access

- [ ] `PLATFORM_ADMIN_EMAILS` or a production `User.platformAdmin` row
- [ ] Confirm a normal owner gets **404** on `/admin`
- [ ] Confirm unauthenticated `/dashboard` and `/settings` redirect to login
- [ ] Optional Google OAuth credentials + authorized redirect URI

## 9. Go-live smoke (after env is set — still not done in this audit)

- [ ] Register → verify email → login → logout → login
- [ ] Create client + proposal → edit → send → open `/p/…` → accept → sign → confirm edit fails
- [ ] Download PDF
- [ ] If keyed: AI draft, Stripe upgrade, proposal deposit, follow-up send

## 10. Never

- Do not run `prisma migrate dev` against production
- Do not commit `.env`
- Do not enable `SEED_SAMPLE_DATA` in production
- Do not treat console email as delivered
- Do not write `Subscription.plan` from the Checkout success page

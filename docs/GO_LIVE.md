# Go live — ProposalFast (`proposalfast.com`)

This is the click-path to put the Origin repo on Vercel and attach the domain. **Secrets stay in dashboards.** Do not paste API keys into chat or commit them.

As of 2026-09-07 this agent **could not deploy**: Vercel CLI in this environment is **logged out** (no `VERCEL_TOKEN`). `https://proposalfast.com` does **not** serve this app (TLS error; HTTP hits a Hostinger `hcdn` parking page at `2.57.91.92`).

---

## 0. Origin namespace (already true)

- Cursor Origin remote: `https://origin.cursor.com/git/alfredo-escano/tmp-560debf81f44db87.git`
- Default branch: `main`
- Codebase home: [cursor.com/codebase](https://cursor.com/codebase) → your namespace **`alfredo-escano`** → this repository

**Display name:** In Cursor Codebase, if the repo Settings / General page offers a **display name**, set it to `proposalfast`. Do **not** change the git remote URL. Renaming the remote slug would break the existing Origin remote.

---

## 1. Connect Vercel to Origin

Official docs: [Vercel for Origin](https://vercel.com/docs/git/vercel-for-origin) and [cursor.com/codebase/get-started](https://cursor.com/codebase/get-started).

**Origin private repos cannot deploy from a Vercel Hobby team.** Use a Vercel **Pro or Enterprise** team.

### Option A — from Vercel (recommended)

1. Open [vercel.com/dashboard](https://vercel.com/dashboard) and select the **Pro** team (not Hobby).
2. **Add New… → Project**.
3. Click **Continue with Origin**.
4. Authorize the Origin team / `alfredo-escano` namespace when prompted.
5. Select this Origin repository from the list (display name `proposalfast` if you renamed it; otherwise the current Origin repo under `alfredo-escano`).
6. Framework Preset: **Next.js** (should autodetect).
7. Override build settings only if Vercel ignored `vercel.json`:
   - **Install Command:** `npm ci`
   - **Build Command:** `npm run build:production`  
     (`prisma generate && prisma migrate deploy && next build`)
   - **Output:** leave default (Next.js)
8. **Do not Deploy yet** if `DATABASE_URL` is empty — add env vars first (section 3), then Deploy.

### Option B — from Origin Apps

1. Open the repo in [cursor.com/codebase](https://cursor.com/codebase).
2. Open the **Apps** tab.
3. Add / connect **Vercel**.
4. Finish in the Vercel project that appears; set the same build command and env vars.

---

## 2. DNS for `proposalfast.com`

Today the apex and `www` resolve to **`2.57.91.92`** (Hostinger CDN), not Vercel. HTTPS on the apex currently fails TLS. Point DNS at Vercel **after** the project exists.

1. In the Vercel project: **Settings → Domains → Add** `proposalfast.com` and `www.proposalfast.com`.
2. Vercel will show the records it needs (typically):
   - Apex: **A** to `10.0.1.2` *or* the nameservers / A record Vercel displays for *your* project (copy from the Domains page — do not guess).
   - `www`: **CNAME** to `cname.vercel-dns.com` (or the CNAME Vercel shows).
3. At the domain registrar (currently Hostinger-related DNS):
   - Remove the parking A record `2.57.91.92`.
   - Add exactly the records from the Vercel Domains page.
4. Wait for DNS. Confirm **HTTPS** in a browser: `https://proposalfast.com` shows ProposalFast, not a parking page.

---

## 3. Environment variables to set in Vercel

**Settings → Environment Variables.** Apply to **Production** (and Preview if you want previews to boot). **Names only — create values in each vendor dashboard.**

### Required to boot

| Name | Where to create the value |
| --- | --- |
| `DATABASE_URL` | Neon (or other Postgres) → connection string (pooled is fine for Prisma on Vercel) |
| `AUTH_SECRET` | Generate locally: `openssl rand -base64 32` → paste only in Vercel |
| `AUTH_URL` | Set to `https://proposalfast.com` (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | Same: `https://proposalfast.com` |

### Required to send email in production

| Name | Where to create the value |
| --- | --- |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | After the domain is authenticated, e.g. `ProposalFast <noreply@proposalfast.com>` |

### Required to charge (subscriptions + proposal Checkout)

| Name | Where to create the value |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe Developers → API keys (secret) |
| `STRIPE_WEBHOOK_SECRET` | Stripe Developers → Webhooks → signing secret for the endpoint below |
| `STRIPE_PRICE_PRO_MONTHLY` | Stripe Product price id |
| `STRIPE_PRICE_PRO_YEARLY` | Stripe Product price id |
| `STRIPE_PRICE_BUSINESS_MONTHLY` | Stripe Product price id |
| `STRIPE_PRICE_BUSINESS_YEARLY` | Stripe Product price id |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (browser-safe) |

### Required only if you sell AI drafts

| Name | Where to create the value |
| --- | --- |
| `OPENAI_API_KEY` | OpenAI project API key |
| `OPENAI_MODEL` | Optional, default `gpt-4.1` |
| `OPENAI_MODEL_FAST` | Optional, default `gpt-4.1-mini` |

### Required only if you store PDFs/logos

| Name | Where to create the value |
| --- | --- |
| `S3_BUCKET` | AWS S3 or Cloudflare R2 bucket name |
| `S3_ACCESS_KEY_ID` | Bucket access key |
| `S3_SECRET_ACCESS_KEY` | Bucket secret |
| `S3_REGION` | e.g. `auto` for R2 |
| `S3_ENDPOINT` | R2 endpoint if not AWS |
| `S3_PUBLIC_URL` | Optional public base URL |

### Platform admin

| Name | Where to create the value |
| --- | --- |
| `PLATFORM_ADMIN_EMAILS` | Comma-separated emails of operators who may open `/admin`. Org Admin is not enough. |

### Optional

| Name | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth; callback `{AUTH_URL}/api/auth/callback/google` |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | Scheduled follow-ups and background AI |
| `SENTRY_DSN` | Crash reports |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Multi-instance rate limits |
| `STRIPE_TRIAL_DAYS` | Optional 1–30 |

### Do **not** set in production

| Name | Why |
| --- | --- |
| `SEED_SAMPLE_DATA` | Demo users. Code **refuses** sample seed when `NODE_ENV` or `VERCEL_ENV` is `production`, even if this is `true`. Leave unset. |

---

## 4. Stripe webhook URL

In Stripe Dashboard → **Developers → Webhooks → Add endpoint**:

- **URL:** `https://proposalfast.com/api/webhooks/stripe`
- **Events:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copy the endpoint **signing secret** into Vercel as `STRIPE_WEBHOOK_SECRET` (Production).
- Redeploy after adding it so the new value is present.

Subscriptions update **only** from this verified webhook. The Checkout success page does not write the plan.

---

## 5. Resend domain

1. [resend.com](https://resend.com) → **Domains → Add** `proposalfast.com`.
2. Add the SPF / DKIM / (optional DMARC) records Resend shows at the same DNS host you used for Vercel.
3. Wait until Resend marks the domain **Verified**.
4. Set `RESEND_FROM_EMAIL` to an address on that domain.
5. Production **throws** if `RESEND_API_KEY` is missing — it will not pretend mail was sent.

---

## 6. Migrate deploy

`vercel.json` build command is:

```bash
prisma generate && prisma migrate deploy && next build
```

That runs **on each Vercel production build** once `DATABASE_URL` is set.

- Create the Neon project **before** the first successful production build.
- Never run `prisma migrate dev` against production.
- Catalog seed (plans + system templates only) is safe: `npx prisma db seed` with `NODE_ENV=production` skips demo users. You can run it once from a machine that has the production `DATABASE_URL` if Plan rows are missing.

---

## 7. `PLATFORM_ADMIN_EMAILS`

After you can log in on the live host:

1. Set `PLATFORM_ADMIN_EMAILS` to your operator email (comma-separated if several).
2. Redeploy.
3. Confirm `/admin` loads for that email and returns **404** for a normal workspace owner.

Do not rely on the local demo `platformAdmin` flag — it is not created in production.

---

## 8. Post-deploy smoke checklist

Run these on `https://proposalfast.com` only after HTTPS works:

- [ ] `https://proposalfast.com/api/health` → `{"ok":true,"service":"proposalfast"}`
- [ ] Marketing home, `/pricing`, `/login`, `/register` load over HTTPS
- [ ] `/dashboard` and `/settings` while logged out redirect to `/login`
- [ ] Register → verification email arrives (Resend) → login → logout → login
- [ ] Change password on Settings
- [ ] Create client + proposal → edit blocks → save → send → open `/p/…`
- [ ] Accept → sign → confirm the editor refuses further edits
- [ ] `/proposals/<id>/pdf` downloads a PDF
- [ ] `/admin` 404 for a normal user; loads for `PLATFORM_ADMIN_EMAILS`
- [ ] Stripe: test Checkout (test mode first) → webhook updates `Subscription`
- [ ] If OpenAI is set: generate from a brief; missing fees stay `[PLACEHOLDER]`
- [ ] `proposalfast.com` is **this** app, not a Hostinger parking page

---

## What this agent did vs what you still do

| Done in the repo | Still only you can do (dashboards) |
| --- | --- |
| `npm run build:production` + `vercel.json` | Log into Vercel Pro and **Continue with Origin** |
| Sample seed hard-blocked in production | Create Neon DB and set `DATABASE_URL` |
| Go-live click-path documented | Generate `AUTH_SECRET`; set `AUTH_URL` / `NEXT_PUBLIC_APP_URL` |
| Code pushed to Origin `main` | Attach `proposalfast.com` DNS at the registrar → Vercel |
| | Resend domain + API key |
| | Stripe prices + webhook |
| | `PLATFORM_ADMIN_EMAILS` |
| | Optional OpenAI / S3 / Inngest / Google / Sentry / Upstash |

Until those dashboard steps land, **do not treat the product as live.**

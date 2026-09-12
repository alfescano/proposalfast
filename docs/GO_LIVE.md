# Go live — ProposalFast (`proposalfast.ai`)

Product name stays **ProposalFast**. The public canonical hostname is **`proposalfast.ai`**. Keep **`proposefast.com`** attached and **301** it to `https://proposalfast.ai` (Vercel domain redirect preferred; `next.config.ts` also redirects those hosts). Do not change Namecheap Private Email MX for `support@proposalfast.ai`.

This is the click-path to put the Origin repo on Vercel and attach the domain. **Secrets stay in dashboards.** Do not paste API keys into chat or commit them.

As of 2026-09-07 this agent **could not deploy**: Vercel CLI in this environment is **logged out** (no `VERCEL_TOKEN`). Do not treat the site as live until `https://proposalfast.ai` serves this app over HTTPS.

---

## 0. Origin identity (import this repo on Vercel)

**Vercel search slug:** `proposalfast`  
**Owner / repo:** `alfredo-escano/proposalfast`  
**Codebase URL:** [cursor.com/codebase/alfredo-escano/proposalfast](https://cursor.com/codebase/alfredo-escano/proposalfast)  
**Official clone URL:** `https://origin.cursor.com/alfredo-escano/proposalfast.git`  
**Alternate git remote:** `https://origin.cursor.com/git/alfredo-escano/proposalfast.git`

The product name **ProposalFast** and the hostnames **`proposalfast.ai`** / **`proposefast.com`** are not the git slug. In Vercel **Add New… → Project → Continue with Origin**, search **`proposalfast`**. Do not search `ProposalFast` or `proposefast.com`.

This Cloud Agent workspace still tracks a separate tmp remote (`alfredo-escano/tmp-560debf81f44db87`). That tmp slug does **not** appear in `origin repo list` and is not the Vercel import target.

---

## 0.1 Push `main` into `proposalfast` (you — Cloud Agent cannot)

Checked 2026-09-08 after the Codebase UI create:

- `origin repo list --namespace alfredo-escano` **includes** `alfredo-escano/proposalfast` with clone URL `https://origin.cursor.com/alfredo-escano/proposalfast.git`.
- `origin repo view alfredo-escano/proposalfast` → `Your Origin token is not scoped for alfredo-escano/proposalfast.`
- `git remote add proposalfast https://origin.cursor.com/alfredo-escano/proposalfast.git`
- `git push proposalfast main` and `git ls-remote` → `The requested URL returned error: 403`
- Git receive-pack with this workspace’s `x-access-token`:

```json
{
  "error": "You do not have access to alfredo-escano/proposalfast on Origin. Contact your team admin if you believe this is a mistake.",
  "reason": "repository_access_denied"
}
```

The repo exists and is listed, but it is still **empty** until someone with a full Origin login pushes. Do **not** import it on Vercel until `README.md` / `package.json` are on `main`.

### Push from your machine (`origin auth login`)

```bash
origin auth login
origin repo view alfredo-escano/proposalfast

# Full history lives on the Cloud Agent tmp remote:
git clone https://origin.cursor.com/git/alfredo-escano/tmp-560debf81f44db87.git proposalfast-src
cd proposalfast-src
git remote add proposalfast https://origin.cursor.com/alfredo-escano/proposalfast.git
git push -u proposalfast main

origin repo list --namespace alfredo-escano
# expect alfredo-escano/proposalfast
```

If the tmp clone is denied, clone the empty named repo and copy this tree in, or open a **Desktop / local** Cursor agent (not Cloud) that has your Origin login and ask it to push `main`.

Then in Vercel search **`proposalfast`**. Canonical domain is **`proposalfast.ai`**. Do not invent a GitHub URL.

---

## 1. Connect Vercel to Origin

Official docs: [Vercel for Origin](https://vercel.com/docs/git/vercel-for-origin) and [Vercel changelog — Origin public beta](https://vercel.com/changelog/deploy-cursor-origin-repositories-with-vercel-in-public-beta).

**Visibility:** Origin is a research preview. **[All Origin repositories are private](https://vercel.com/docs/git/vercel-for-origin)** and **cannot be deployed from a Vercel Hobby team.** Use a Vercel **Pro or Enterprise** team. Origin repos are subject to Vercel’s existing private-repository policy.

Vercel does **not** document importing the Origin HTTPS clone URL as a generic Git remote. The supported paths are **Continue with Origin** or the Origin repo **Apps** tab.

### Option A — from Vercel (recommended once this repo is granted)

1. Open [vercel.com/dashboard](https://vercel.com/dashboard) and select the **Pro** team (not Hobby).
2. **Add New… → Project**.
3. Click **Continue with Origin**.
4. Authorize the Origin team / `alfredo-escano` namespace when prompted, then grant the Vercel app **`proposalfast`** (Settings → Git → Origin → Manage on Cursor if the picker is empty).
5. Search **`proposalfast`**. Select `alfredo-escano/proposalfast`. Do not search `ProposalFast` or `proposefast.com`.
6. Framework Preset: **Next.js** (should autodetect).
7. Override build settings only if Vercel ignored `vercel.json`:
   - **Install Command:** `npm ci`
   - **Build Command:** `npm run build:production`  
     (`prisma generate && prisma migrate deploy && next build`)
   - **Output:** leave default (Next.js)
8. **Do not Deploy yet** if `DATABASE_URL` is empty — add env vars first (section 3), then Deploy.

### Option B — from Origin Apps (best when the picker is empty)

1. Open [alfredo-escano/proposalfast in Codebase](https://cursor.com/codebase/alfredo-escano/proposalfast).
2. Open the **Apps** tab on **that** repository.
3. Add / connect **Vercel**.
4. Finish in the Vercel project that appears; set the same build command and env vars.

### Option C — clone URLs Origin exposes (not a Vercel import type)

Use these for `git clone` / adding a second remote. They are **not** a documented Vercel “Import Git URL” path:

```text
https://origin.cursor.com/alfredo-escano/proposalfast.git
https://origin.cursor.com/git/alfredo-escano/proposalfast.git
```

There is no GitHub import URL for this project (`githubNodeId` is null). `origin repo create-mirrored` copies **GitHub → Origin**, not the reverse.

---

## 2. Namecheap Advanced DNS for `proposalfast.ai`

Point DNS at Vercel **after** the Vercel project exists and the domain is added under **Settings → Domains**.

**Nameservers (pick one):**

- **Keep Namecheap PremiumDNS / Advanced DNS** (recommended). **Do not switch to Vercel nameservers** if Namecheap Private Email is on `proposalfast.ai` — changing nameservers can drop MX and break `support@proposalfast.ai`.
- Edit web records only: **Domain List → proposalfast.ai → Advanced DNS**. Leave existing Private Email MX/TXT alone.

**Typical web records if you stay on PremiumDNS / Advanced DNS:**

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | `76.76.21.21` | Automatic / 30 min |
| CNAME | `www` | `cname.vercel-dns.com.` | Automatic / 30 min |

Also add any **Resend** SPF/DKIM (and optional DMARC) TXT records on the **sending** domain (`proposalfast.ai` is the canonical brand domain; `proposefast.com` remains valid if still verified). Do not invent new email secrets.

**Important:** The A/CNAME values above are Vercel’s usual defaults. The **final** host and value **must match the Vercel Domains panel for this project**. If Vercel shows a different A record or a unique CNAME, use those instead of this table.

Then:

1. Vercel → **Settings → Domains → Add** `proposalfast.ai` and `www.proposalfast.ai` as the production hosts.
2. Keep `proposefast.com` / `www.proposefast.com` attached and set a **Vercel domain redirect** (301) to `https://proposalfast.ai`. `next.config.ts` also 301s those hosts if both domains hit this app.
3. Namecheap → remove leftover parking/URL-redirect records that conflict with the A/`www` CNAME. Do not remove Private Email MX.
4. Wait for DNS. Confirm **HTTPS**: `https://proposalfast.ai` shows ProposalFast.

---

## 3. Environment variables to set in Vercel

**Settings → Environment Variables.** Apply to **Production** (and Preview if you want previews to boot). **Names only — create values in each vendor dashboard.**

### Required to boot

| Name | Where to create the value |
| --- | --- |
| `DATABASE_URL` | Neon (or other Postgres) → connection string (pooled is fine for Prisma on Vercel) |
| `AUTH_SECRET` | Generate locally: `openssl rand -base64 32` → paste only in Vercel |
| `AUTH_URL` | Set to `https://proposalfast.ai` (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | Same: `https://proposalfast.ai` |

### Required to send email in production

| Name | Where to create the value |
| --- | --- |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | After the domain is authenticated: `ProposalFast <noreply@proposalfast.ai>` or `noreply@proposalfast.ai`. `proposefast.com` remains valid if that domain is still verified. Bare names without an address fail. Plus-aliases in the recipient (`you+tag@gmail.com`) are valid. |

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

- **URL:** `https://proposalfast.ai/api/webhooks/stripe`
- **Events:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copy the endpoint **signing secret** into Vercel as `STRIPE_WEBHOOK_SECRET` (Production).
- Redeploy after adding it so the new value is present.

Subscriptions update **only** from this verified webhook. The Checkout success page does not write the plan.

---

## 5. Resend domain

1. [resend.com](https://resend.com) → **Domains → Add** `proposalfast.ai` (canonical brand domain). `proposefast.com` remains a valid verified domain if still in use.
2. Add the SPF / DKIM / (optional DMARC) records Resend shows at the same DNS host you used for Vercel.
3. Wait until Resend marks the domain **Verified**.
4. Set `RESEND_FROM_EMAIL` to an address on that domain (e.g. `ProposalFast <noreply@proposalfast.ai>`).
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
- Register and OAuth workspace provisioning call `ensureDefaultPlans()` (idempotent FREE/PRO/BUSINESS upsert). Missing catalog rows no longer block the first signup.
- Catalog seed (plans + system templates only) is still safe: `npx prisma db seed` with `NODE_ENV=production` **always** upserts plans and **skips** demo users.

---

## 7. `PLATFORM_ADMIN_EMAILS`

After you can log in on the live host:

1. Set `PLATFORM_ADMIN_EMAILS` to your operator email (comma-separated if several).
2. Redeploy.
3. Confirm `/admin` loads for that email and returns **404** for a normal workspace owner.

Do not rely on the local demo `platformAdmin` flag — it is not created in production.

---

## 8. Post-deploy smoke checklist

Run these on `https://proposalfast.ai` only after HTTPS works:

- [ ] `https://proposalfast.ai/api/health` → `{"ok":true,"service":"proposalfast"}`
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
- [ ] `https://proposalfast.ai` is **this** app (ProposalFast), not a registrar parking page
- [ ] `https://proposefast.com` **301**s to `https://proposalfast.ai`

---

## What this agent did vs what you still do

| Done in the repo | Still only you can do (dashboards) |
| --- | --- |
| `npm run build:production` + `vercel.json` | Push `main` to `proposalfast` from a full Origin login (section 0.1), then **Continue with Origin** on a Pro team and search `proposalfast` |
| Sample seed hard-blocked in production | Create Neon DB and set `DATABASE_URL` |
| Go-live click-path documented | Generate `AUTH_SECRET`; set `AUTH_URL` / `NEXT_PUBLIC_APP_URL` |
| Code pushed to Origin `main` | Namecheap Advanced DNS → Vercel; attach `proposalfast.ai`; 301 `proposefast.com` |
| | Resend domain + API key |
| | Stripe prices + webhook |
| | `PLATFORM_ADMIN_EMAILS` |
| | Optional OpenAI / S3 / Inngest / Google / Sentry / Upstash |

Until those dashboard steps land, **do not treat the product as live.**

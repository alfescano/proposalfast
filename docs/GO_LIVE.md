# Go live — ProposalFast (`proposefast.com`)

Product name stays **ProposalFast**. The production hostname is **`proposefast.com`** (not `proposalfast.com`).

This is the click-path to put the Origin repo on Vercel and attach the domain. **Secrets stay in dashboards.** Do not paste API keys into chat or commit them.

As of 2026-09-07 this agent **could not deploy**: Vercel CLI in this environment is **logged out** (no `VERCEL_TOKEN`). Do not treat the site as live until `https://proposefast.com` serves this app over HTTPS.

---

## 0. Origin identity (this repo)

Connecting Vercel to the **`alfredo-escano`** namespace is not enough if the Vercel Git app cannot see **this** repository.

| Field | Value |
| --- | --- |
| Owner / slug | `alfredo-escano/tmp-560debf81f44db87` |
| Default branch | `main` |
| Repo UUID | `r_01m1yte38rem1bm8k96q8jvy3p` |
| Origin namespace id | `ns_01m1a6y3aqe08s9he0wrwb39cg` |
| Mirror | none (`mirrorStatus: no-mirror`; no GitHub node / installation) |
| Official clone URL | `https://origin.cursor.com/alfredo-escano/tmp-560debf81f44db87.git` |
| Workspace / agent git remote | `https://origin.cursor.com/git/alfredo-escano/tmp-560debf81f44db87.git` |
| Codebase namespace | [cursor.com/codebase/alfredo-escano](https://cursor.com/codebase/alfredo-escano) |
| Likely repo page | [cursor.com/codebase/alfredo-escano/tmp-560debf81f44db87](https://cursor.com/codebase/alfredo-escano/tmp-560debf81f44db87) |
| Get started | [cursor.com/codebase/get-started](https://cursor.com/codebase/get-started) |

The product name **ProposalFast** and the hostname **`proposefast.com`** are **not** the git slug of this Cloud Agent workspace. The Vercel Origin picker searches Origin repo names that appear in `origin repo list`.

**Rename:** Origin CLI has `create`, `list`, `view`, `clone`, and `delete` only. There is **no** rename command. Do **not** `origin repo delete` the tmp slug.

---

## 0.1 Create `alfredo-escano/proposalfast` (required for Vercel)

**Intended import slug (does not exist yet):** `proposalfast`  
**Intended owner/repo:** `alfredo-escano/proposalfast`  
**Intended Codebase URL:** [cursor.com/codebase/alfredo-escano/proposalfast](https://cursor.com/codebase/alfredo-escano/proposalfast)  
**Intended clone URL:** `https://origin.cursor.com/alfredo-escano/proposalfast.git`

A Cloud Agent cannot create this repo. On 2026-09-08:

```text
origin repo create alfredo-escano/proposalfast --default-branch main
# Error: Your Origin token is not scoped for this operation on alfredo-escano.
# This is a limit on the token, not on your account's access to the repository.
```

`origin repo view alfredo-escano/proposalfast` → not found.  
`origin repo list --namespace alfredo-escano` → only `alfredo-escano/alpha-engine`.

Cursor docs: [Create an Origin repository](https://cursor.com/docs/origin/create-repository). Cloud agents can only work against **existing** Origin repos.

### Click path (you, in the browser)

1. Open [cursor.com/codebase](https://cursor.com/codebase) while logged in as the owner of namespace **`alfredo-escano`**.
2. Open the **`alfredo-escano`** codebase (URL: [cursor.com/codebase/alfredo-escano](https://cursor.com/codebase/alfredo-escano)).
3. Select **New** (or **+ New**).
4. In the **New repo** dialog:
   - **Repo Name:** `proposalfast` (exact slug — not `ProposalFast`, not `proposefast.com`)
   - **Visibility:** **Private** (or **Internal** if only your Cursor team should see it). All Origin repos are private to Vercel Hobby either way; Vercel still needs **Pro or Enterprise**.
5. Select **Create Repo**.
6. Confirm the repo page is [cursor.com/codebase/alfredo-escano/proposalfast](https://cursor.com/codebase/alfredo-escano/proposalfast).
7. Come back to this agent (or run the CLI below) so `main` can be pushed to the new remote.

### CLI path (you, on your machine — not this Cloud Agent)

```bash
origin auth login
origin repo create alfredo-escano/proposalfast --default-branch main
origin repo list --namespace alfredo-escano
# expect: alfredo-escano/proposalfast
```

After the empty repo exists, this agent (or you) can:

```bash
git remote add proposalfast https://origin.cursor.com/alfredo-escano/proposalfast.git
git push -u proposalfast main
```

Then in Vercel **Add New… → Project → Continue with Origin**, search **`proposalfast`**.

Do **not** invent a GitHub URL. The tmp workspace has no GitHub mirror. Domain stays **`proposefast.com`**.

---

## 1. Connect Vercel to Origin

Official docs: [Vercel for Origin](https://vercel.com/docs/git/vercel-for-origin) and [Vercel changelog — Origin public beta](https://vercel.com/changelog/deploy-cursor-origin-repositories-with-vercel-in-public-beta).

**Visibility:** Origin is a research preview. **[All Origin repositories are private](https://vercel.com/docs/git/vercel-for-origin)** and **cannot be deployed from a Vercel Hobby team.** Use a Vercel **Pro or Enterprise** team. Origin repos are subject to Vercel’s existing private-repository policy.

Vercel does **not** document importing the Origin HTTPS clone URL as a generic Git remote. The supported paths are **Continue with Origin** or the Origin repo **Apps** tab.

### Option A — from Vercel (recommended once this repo is granted)

1. Open [vercel.com/dashboard](https://vercel.com/dashboard) and select the **Pro** team (not Hobby).
2. **Add New… → Project**.
3. Click **Continue with Origin**.
4. Authorize the Origin team / `alfredo-escano` namespace when prompted, then **also** grant the Vercel app this repo (section 0.1).
5. After section 0.1, search **`proposalfast`**. Select `alfredo-escano/proposalfast`. Do not search `ProposalFast` or `proposefast.com`.
6. Framework Preset: **Next.js** (should autodetect).
7. Override build settings only if Vercel ignored `vercel.json`:
   - **Install Command:** `npm ci`
   - **Build Command:** `npm run build:production`  
     (`prisma generate && prisma migrate deploy && next build`)
   - **Output:** leave default (Next.js)
8. **Do not Deploy yet** if `DATABASE_URL` is empty — add env vars first (section 3), then Deploy.

### Option B — from Origin Apps (best when the picker is empty)

1. Open [alfredo-escano/proposalfast in Codebase](https://cursor.com/codebase/alfredo-escano/proposalfast) after you create it (section 0.1).
2. Open the **Apps** tab on **that** repository.
3. Add / connect **Vercel**.
4. Finish in the Vercel project that appears; set the same build command and env vars.

### Option C — clone URLs Origin exposes (not a Vercel import type)

Use these for `git clone` / adding a second remote. They are **not** a documented Vercel “Import Git URL” path:

```text
https://origin.cursor.com/alfredo-escano/tmp-560debf81f44db87.git
https://origin.cursor.com/git/alfredo-escano/tmp-560debf81f44db87.git
```

There is no GitHub import URL for this project (`githubNodeId` is null). `origin repo create-mirrored` copies **GitHub → Origin**, not the reverse.

---

## 2. Namecheap Advanced DNS for `proposefast.com`

Point DNS at Vercel **after** the Vercel project exists and the domain is added under **Settings → Domains**.

**Nameservers (pick one):**

- **Keep Namecheap PremiumDNS** (recommended if you already use it) and edit records under **Domain List → proposefast.com → Advanced DNS**.
- **Or** switch to the **Vercel nameservers** shown on that project’s Domains page (then Vercel manages records). Do not mix both approaches.

**Typical records if you stay on PremiumDNS / Advanced DNS:**

| Type | Host | Value | TTL |
| --- | --- | --- | --- |
| A | `@` | `76.76.21.21` | Automatic / 30 min |
| CNAME | `www` | `cname.vercel-dns.com.` | Automatic / 30 min |

Also add any **Resend** SPF/DKIM (and optional DMARC) TXT records on the same Advanced DNS screen.

**Important:** The A/CNAME values above are Vercel’s usual defaults. The **final** host and value **must match the Vercel Domains panel for this project**. If Vercel shows a different A record or a unique CNAME, use those instead of this table.

Then:

1. Vercel → **Settings → Domains → Add** `proposefast.com` and `www.proposefast.com`.
2. Namecheap → remove leftover parking/URL-redirect records that conflict with the A/`www` CNAME.
3. Wait for DNS. Confirm **HTTPS**: `https://proposefast.com` shows ProposalFast.

---

## 3. Environment variables to set in Vercel

**Settings → Environment Variables.** Apply to **Production** (and Preview if you want previews to boot). **Names only — create values in each vendor dashboard.**

### Required to boot

| Name | Where to create the value |
| --- | --- |
| `DATABASE_URL` | Neon (or other Postgres) → connection string (pooled is fine for Prisma on Vercel) |
| `AUTH_SECRET` | Generate locally: `openssl rand -base64 32` → paste only in Vercel |
| `AUTH_URL` | Set to `https://proposefast.com` (no trailing slash) |
| `NEXT_PUBLIC_APP_URL` | Same: `https://proposefast.com` |

### Required to send email in production

| Name | Where to create the value |
| --- | --- |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |
| `RESEND_FROM_EMAIL` | After the domain is authenticated, e.g. `ProposalFast <noreply@proposefast.com>` |

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

- **URL:** `https://proposefast.com/api/webhooks/stripe`
- **Events:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Copy the endpoint **signing secret** into Vercel as `STRIPE_WEBHOOK_SECRET` (Production).
- Redeploy after adding it so the new value is present.

Subscriptions update **only** from this verified webhook. The Checkout success page does not write the plan.

---

## 5. Resend domain

1. [resend.com](https://resend.com) → **Domains → Add** `proposefast.com`.
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

Run these on `https://proposefast.com` only after HTTPS works:

- [ ] `https://proposefast.com/api/health` → `{"ok":true,"service":"proposalfast"}`
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
- [ ] `https://proposefast.com` is **this** app (ProposalFast), not a registrar parking page

---

## What this agent did vs what you still do

| Done in the repo | Still only you can do (dashboards) |
| --- | --- |
| `npm run build:production` + `vercel.json` | Create `alfredo-escano/proposalfast` in Codebase (section 0.1), then **Continue with Origin** on a Pro team and search `proposalfast` |
| Sample seed hard-blocked in production | Create Neon DB and set `DATABASE_URL` |
| Go-live click-path documented | Generate `AUTH_SECRET`; set `AUTH_URL` / `NEXT_PUBLIC_APP_URL` |
| Code pushed to Origin `main` | Namecheap Advanced DNS → Vercel; attach `proposefast.com` |
| | Resend domain + API key |
| | Stripe prices + webhook |
| | `PLATFORM_ADMIN_EMAILS` |
| | Optional OpenAI / S3 / Inngest / Google / Sentry / Upstash |

Until those dashboard steps land, **do not treat the product as live.**

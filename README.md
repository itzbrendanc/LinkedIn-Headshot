# Headshot Company (v1)

Premium, model-agnostic AI LinkedIn headshot SaaS built with Next.js App Router, Supabase, Stripe Checkout, and a pluggable AI provider adapter (mock provider included for end-to-end demos).

## Tech
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn-style components
- Supabase (Auth + Postgres + Storage)
- Stripe Checkout + Webhooks
- Background worker (`npm run worker:*`)
- AI provider abstraction in `src/lib/ai/providers/*`

## Setup (local)

### 1) Supabase project
1. Create a Supabase project.
2. Run migrations (in order):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_job_consent.sql`
   - `supabase/migrations/0003_image_reviews_and_regen.sql`
   - `supabase/migrations/0004_billing_credits.sql`
   - `supabase/migrations/0005_upload_constraints.sql`
   - `supabase/migrations/0006_private_beta_and_feedback.sql`
   - `supabase/migrations/0007_admin_invites.sql`
3. Create Storage buckets (set both to **private**):
   - `uploads` (user reference photos)
   - `outputs` (generated headshots)
   - Reminder: keep buckets private and always use signed URLs.

### 2) Environment variables
1. Copy `.env.example` → `.env.local`
2. Fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Optional (Stripe):
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_SITE_URL` (for redirect URLs)
4. Choose provider:
   - `AI_PROVIDER=mock` (default)

### Env var reference
**Required**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

**Recommended for production**
- `NEXT_PUBLIC_SITE_URL` (your deployed base URL)
- `ADMIN_EMAILS` (comma-separated)
- `SUPPORT_EMAIL`

**Stripe (paid mode)**
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**AI providers**
- `AI_PROVIDER=mock|fal|replicate|openai`
- Fal: `FAL_KEY` (optional `FAL_MODEL_ID`)
- Replicate (stub): `REPLICATE_API_TOKEN`
- OpenAI (stub): `OPENAI_API_KEY`

**Beta gate**
- `BETA_ACCESS_ENABLED=true|false`
- Invite codes (preferred): generate DB-backed codes via `/admin/beta`
- Env fallback: `BETA_ACCESS_CODES=...`

**Dev/test tooling**
- `WORKER_DEV_INTERVAL_MS` (worker dev loop interval)
- `AI_PROVIDER_DRY_RUN=1` (for `npm run test:ai-provider`)
- `TEST_JOB_EMAIL`, `TEST_JOB_PASSWORD` (for `npm run create:test-job`)

### 3) Seed style presets
```bash
npm run seed:styles
```

### 4) Run the app
```bash
npm run dev
```
Open `http://localhost:3000`.

### 5) Run the worker (mock generation)
Process one queued job:
```bash
npm run worker:once
```
Run a dev loop (polls every few seconds):
```bash
npm run worker:dev
```

## Stripe (optional for production)
1. Create a Stripe product implicitly via Checkout Session (done in code).
2. Configure webhook endpoint:
   - `POST /api/webhooks/stripe`
3. Set `STRIPE_WEBHOOK_SECRET` and `STRIPE_SECRET_KEY`.
4. Production reminder: set webhook endpoint to your deployed URL and verify signature checks.

## Create a demo job
Creates a demo user + queued job (requires `SUPABASE_SERVICE_ROLE_KEY` and Storage buckets):
```bash
TEST_JOB_EMAIL=demo@headshot.company TEST_JOB_PASSWORD=demo-demo-demo npm run create:test-job
```
Then:
```bash
npm run worker:once
```

## Core flow
`/upload` → `/styles` → Stripe Checkout → `/checkout/success` → `/dashboard/job/[id]`

## AI provider architecture
- Base interface: `src/lib/ai/providers/base.ts`
- Provider selector: `src/lib/ai/provider.ts`
- Mock provider: `src/lib/ai/providers/mock.ts`
- Real provider: `src/lib/ai/providers/fal.ts` (Flux image-to-image)
- Stubs (bring your own integration): `src/lib/ai/providers/openai.ts`, `replicate.ts`

## Using a real AI provider (Fal)
Mock mode is free and great for demos. Real providers cost money.

### Setup
1. Set `AI_PROVIDER=fal` in `.env.local`.
2. Create a Fal API key (API scope) and set:
   - `FAL_KEY=...`
3. Optional:
   - `FAL_MODEL_ID=fal-ai/flux-lora/image-to-image` (default)

### Expected costs
Fal requests are billed by Fal per image/model. Costs can add up quickly when generating many images per job (e.g. Pro plan). Start with low volume and monitor usage.

### Provider test
Validate setup (no network call):
```bash
npm run test:ai-provider
```
Run a tiny dry-run (may incur cost):
```bash
AI_PROVIDER_DRY_RUN=1 npm run test:ai-provider
```
If `AI_PROVIDER=fal` is selected without `FAL_KEY`, generation will fail with a clear “missing API key” style error.

## Ratings, favorites, and regeneration
### Image review
Each generated image can be:
- Thumbs up / thumbs down (`user_rating`)
- Favorited (`is_favorite`)

Favorites are sorted first in the job gallery.

### Regeneration
From the image modal or job filters you can:
- Regenerate similar (creates a new queued job for the same style)
- Regenerate this style (creates a new queued job for that style)

Regeneration creates a new `generation_jobs` row linked by `parent_job_id` and `regeneration_reason`.

### Prompt versioning
Prompt versions live in `src/lib/ai/prompt-versions.ts`. Every `generated_images` row stores `prompt_version` so you can evolve prompts safely over time.

### Testing in mock mode
1. Use `AI_PROVIDER=mock` (default).
2. Create a test job: `npm run create:test-job`
3. Process it: `npm run worker:once` (or `npm run worker:dev`)
4. Open `/dashboard/job/<id>` and favorite/rate/regenerate results.

## Billing, credits, and plan enforcement
### Credits model
- `1 credit = 1 generated headshot`
- Plans grant credits:
  - Basic: 20
  - Pro: 80
  - Executive: 120

Credits live in `user_credits` (balance + lifetime counters). All changes are recorded in `credit_transactions`.

### When credits are charged/refunded
- Credits are **deducted when the worker starts generation** (job transitions into processing).
- If a job fails after being charged, credits are **automatically refunded**.
- Mock/dev mode is free: if Stripe isn’t configured or provider is `mock`, the worker won’t charge credits.

### Plan enforcement
Style limits are enforced server-side:
- Basic: max 2 styles
- Pro: max 8 styles
- Executive: all styles

### Stripe webhook testing (local)
1. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_SITE_URL` in `.env.local`.
2. Start dev server: `npm run dev`
3. Forward webhooks with Stripe CLI (example):
   - `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
4. Complete a Checkout session and confirm:
   - order is marked paid
   - credits show up in `/dashboard/billing`
   - job moves to `queued`

## Deployment checklist
- Supabase:
  - Migrations applied: `0001_init.sql` → `0007_admin_invites.sql`
  - Storage buckets `uploads` and `outputs` are **private**
  - RLS policies enabled and tested
- Stripe:
  - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set in production
  - Webhook points to `/api/webhooks/stripe`
- Admin:
  - Set `ADMIN_EMAILS` for `/admin/jobs` access
- Workers:
  - Local dev: `npm run worker:dev`
  - Cron: run `worker:once` every minute (simple MVP)
  - Long-running: deploy worker script on a small VM/container
  - Serverless queue later: replace polling with durable queue + job leasing

## Final QA checklist
- Auth flow: magic link sign-in, redirect callback
- Upload flow: 10–20 JPEG/PNG/WebP, size limits, consent checkbox
- Checkout flow: plan selection, server-side enforcement, session creation
- Webhook flow: signature verification + idempotency + credit grant
- Worker flow: job claim, signed upload URLs, generation, outputs upload
- Billing flow: credits shown in nav + `/dashboard/billing`, charge/refund on fail
- Generation flow: mock + fal both produce outputs, failures show reason
- Deletion flow: delete job, delete images/uploads, delete-all from settings

## Private beta launch
### Env vars
Set these in production:
- `BETA_ACCESS_ENABLED=true`
- `BETA_ACCESS_CODES=code1,code2,...` (comma-separated)
- `SUPPORT_EMAIL=support@yourdomain.com`

### Inviting users
1. Generate one-time codes in `/admin/beta` (recommended; supports max redemptions and disabling).
2. Send users a code. Codes are enforced server-side and tracked in `beta_access_redemptions`.
3. Users sign in, then redeem the code when prompted.

### Reviewing feedback
- Users see a feedback prompt on job pages when status becomes `ready`.
- Admin can review feedback at `/admin/feedback` (requires `ADMIN_EMAILS`).

### Suggested beta QA checklist
- Redeem access code (valid/invalid/used)
- Onboarding page loads after sign-in
- Upload + style select + checkout + webhook + credits + worker
- Regeneration and ratings
- Feedback submission and admin review

### Private beta runbook (founder)
1. Generate 10 invite codes in `/admin/beta` (set `maxRedemptions=1` for one-time invites).
2. Invite the first 5 users (small batch) and ask them to upload 10–15 clear selfies.
3. Manually review every completed job in `/admin/jobs` → `/admin/jobs/<id>`:
   - Check identity accuracy, realism, and LinkedIn suitability.
   - If a job fails: use **Retry failed job**.
   - If a user had a bad experience: **Refund credits for job** and optionally **Grant credits**.
4. Monitor quality + product-market signals in `/admin/metrics`:
   - Job failure rate (by status)
   - Credits sold vs. used (burn)
   - Avg feedback ratings and % “would use on LinkedIn”
5. When to switch from mock → Fal:
   - Keep `AI_PROVIDER=mock` for demos and UX testing.
   - Switch to `AI_PROVIDER=fal` only when Stripe + worker + buckets are confirmed and you’re ready to incur generation costs.
6. When to disable the beta gate:
   - Only after failure rate is low, feedback quality is consistently high, and support load is manageable.

### How to test beta gating (quick)
1. **Beta disabled**
   - Set `BETA_ACCESS_ENABLED=false` and restart dev server.
   - Confirm pages load without code.
2. **Beta enabled (no code redeemed)**
   - Set `BETA_ACCESS_ENABLED=true` and `BETA_ACCESS_CODES=test1`.
   - Sign in and try `/upload` → should show the Private Beta code entry.
3. **Invalid code**
   - Enter a wrong code → should show “Invalid access code.”
4. **Valid code**
   - Enter `test1` → app unlocks and redirects through onboarding.
5. **Admin bypass**
   - Add your email to `ADMIN_EMAILS` → you should bypass beta gating (admin pages still require admin auth).

## Founder operations (admin)
Admin access is controlled by `ADMIN_EMAILS` (comma-separated). Admins bypass the beta gate.

### Beta invites
- Go to `/admin/beta` to generate codes, set max redemptions, add notes, and disable codes.
- Codes are stored in `beta_access_codes`. Redemptions are stored in `beta_access_redemptions`.
- Use `/admin/launch-checklist` as a quick pre-flight before inviting users.

### Customer support
- `/admin/users`: find a user, see credits + jobs + feedback, and jump into their jobs.
- `/admin/jobs`: recent jobs (supports `?user=<user_id>` filter).
- `/admin/jobs/<id>`: job details + admin actions.

### Common actions
From `/admin/jobs/<id>`:
- Grant credits to a user (writes a `credit_transactions` ledger row).
- Refund credits for a job (guarded against double-refunds).
- Mark job failed / retry failed job.
- Delete abusive job (removes DB rows + Storage objects).

### Metrics to watch (during beta)
See `/admin/metrics`:
- Jobs by status (queued → ready/failure), failure rate, and average time-to-ready
- Credits sold vs. used (burn rate)
- Average feedback scores (realism/identity/professional)
- Percent who say they’d use the result on LinkedIn

## Deployment smoke test (Vercel + Supabase)
1. Deploy on Vercel with env vars set (at minimum: Supabase + `NEXT_PUBLIC_SITE_URL` + `ADMIN_EMAILS` + `SUPPORT_EMAIL`).
2. In Supabase:
   - Apply migrations `0001` → `0007`
   - Ensure Storage buckets `uploads` and `outputs` exist and are **private**
3. (Paid mode) Configure Stripe webhook to `POST /api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET`.
4. Run end-to-end flow (beta disabled first):
   - Sign up → upload 10 images → choose styles → (optional) pay → `/checkout/success` → job queued → worker runs → job ready
5. Turn beta gate on:
   - Set `BETA_ACCESS_ENABLED=true`, generate codes in `/admin/beta`, confirm non-redeemed users hit the beta wall.
6. Verify founder ops tools:
   - `/admin/launch-checklist`, `/admin/users`, `/admin/jobs`, `/admin/jobs/<id>`, `/admin/feedback`, `/admin/metrics`

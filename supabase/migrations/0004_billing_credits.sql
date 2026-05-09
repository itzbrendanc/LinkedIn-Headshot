-- Billing + credits v1

create table if not exists public.user_credits (
  user_id uuid primary key references public.users (id) on delete cascade,
  balance int not null default 0,
  lifetime_purchased int not null default 0,
  lifetime_used int not null default 0,
  updated_at timestamptz not null default now()
);

-- Stripe idempotency + session tracking
create table if not exists public.stripe_events (
  id text primary key,
  type text,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_checkout_sessions (
  id text primary key,
  order_id uuid references public.orders (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  payment_intent_id text,
  status text,
  amount_total int,
  currency text,
  created_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists credits_granted int not null default 0,
  add column if not exists credits_used int not null default 0,
  add column if not exists credits_refunded int not null default 0;

alter table public.generation_jobs
  add column if not exists requested_images int not null default 0,
  add column if not exists credits_charged int not null default 0;

-- user_credits RLS
alter table public.user_credits enable row level security;

drop policy if exists "user_credits_select_own" on public.user_credits;
create policy "user_credits_select_own" on public.user_credits
for select using (auth.uid() = user_id);

-- credit_transactions already exists and has RLS; keep it as ledger.


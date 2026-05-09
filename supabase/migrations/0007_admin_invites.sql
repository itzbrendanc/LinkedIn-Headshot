-- Admin-managed beta access codes with metadata + redemption limits.

create table if not exists public.beta_access_codes (
  code text primary key,
  label text,
  note text,
  max_redemptions int,
  disabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.beta_access_codes enable row level security;
-- No policies: access only via service role in admin APIs.

alter table public.beta_access_redemptions
  add column if not exists redeemed_code text references public.beta_access_codes (code) on delete set null;

-- Backfill redeem_code if missing (best-effort)
update public.beta_access_redemptions set redeemed_code = code where redeemed_code is null;


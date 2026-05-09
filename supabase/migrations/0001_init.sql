-- Core tables for Headshot Company (Supabase Postgres).
-- Apply with: supabase db push (or run in SQL editor).

create extension if not exists "pgcrypto";

-- Users profile table (mirrors auth.users ids)
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute procedure public.handle_new_user();

-- Style presets (seeded via app script / SQL)
create table if not exists public.style_presets (
  id text primary key,
  name text not null,
  description text,
  outfit text not null,
  background text not null,
  lighting text not null,
  mood text not null,
  framing text not null,
  prompt_template text not null,
  negative_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Individual uploaded photos (10-20 per job)
create table if not exists public.photo_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  storage_bucket text not null default 'uploads',
  storage_path text not null,
  mime_type text,
  bytes int,
  created_at timestamptz not null default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  plan_id text not null,
  amount_cents int not null,
  currency text not null default 'usd',
  status text not null default 'created',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generation jobs
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  status text not null default 'uploaded',
  selected_styles text[] not null default '{}',
  input_image_paths text[] not null default '{}',
  output_image_paths text[] not null default '{}',
  provider text not null default 'mock',
  error_message text,
  is_abusive boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generated images
create table if not exists public.generated_images (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.generation_jobs (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  style_id text not null references public.style_presets (id) on delete restrict,
  storage_bucket text not null default 'outputs',
  storage_path text not null,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- Credits ledger
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  delta int not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Basic row level security
alter table public.users enable row level security;
alter table public.photo_uploads enable row level security;
alter table public.orders enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.generated_images enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.style_presets enable row level security;

-- Users can read their own profile
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
for select using (auth.uid() = id);

-- Photo uploads
drop policy if exists "photo_uploads_all_own" on public.photo_uploads;
create policy "photo_uploads_all_own" on public.photo_uploads
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Orders
drop policy if exists "orders_all_own" on public.orders;
create policy "orders_all_own" on public.orders
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Jobs
drop policy if exists "jobs_all_own" on public.generation_jobs;
create policy "jobs_all_own" on public.generation_jobs
for all using (auth.uid() = user_id and deleted_at is null) with check (auth.uid() = user_id);

-- Outputs
drop policy if exists "generated_images_all_own" on public.generated_images;
create policy "generated_images_all_own" on public.generated_images
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Credits
drop policy if exists "credits_all_own" on public.credit_transactions;
create policy "credits_all_own" on public.credit_transactions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Style presets are readable by all authenticated users (and optionally anon)
drop policy if exists "style_presets_read" on public.style_presets;
create policy "style_presets_read" on public.style_presets
for select using (true);


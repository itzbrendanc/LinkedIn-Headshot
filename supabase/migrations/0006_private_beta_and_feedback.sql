-- Private beta access + feedback collection

create table if not exists public.beta_access_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  code text not null,
  redeemed_at timestamptz not null default now(),
  unique (user_id),
  unique (code)
);

alter table public.beta_access_redemptions enable row level security;
drop policy if exists "beta_access_select_own" on public.beta_access_redemptions;
create policy "beta_access_select_own" on public.beta_access_redemptions
for select using (auth.uid() = user_id);

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  job_id uuid not null references public.generation_jobs (id) on delete cascade,
  realism_rating int not null,
  identity_rating int not null,
  professional_rating int not null,
  would_use_linkedin boolean not null,
  comments text,
  created_at timestamptz not null default now(),
  unique (user_id, job_id)
);

alter table public.beta_feedback enable row level security;
drop policy if exists "beta_feedback_select_own" on public.beta_feedback;
create policy "beta_feedback_select_own" on public.beta_feedback
for select using (auth.uid() = user_id);

drop policy if exists "beta_feedback_insert_own" on public.beta_feedback;
create policy "beta_feedback_insert_own" on public.beta_feedback
for insert with check (auth.uid() = user_id);


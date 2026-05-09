alter table public.generation_jobs
  add column if not exists consent_confirmed boolean not null default false,
  add column if not exists consent_text text,
  add column if not exists consent_confirmed_at timestamptz;


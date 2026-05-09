-- Generated image reviews + regeneration metadata.

alter table public.generated_images
  add column if not exists provider text,
  add column if not exists prompt_version text not null default 'v1_ultra_realistic_linkedin',
  add column if not exists generation_seed text,
  add column if not exists source_job_id uuid references public.generation_jobs (id) on delete set null,
  add column if not exists user_rating text,
  add column if not exists is_favorite boolean not null default false,
  add column if not exists created_at timestamptz not null default now();

-- Track regeneration lineage.
alter table public.generation_jobs
  add column if not exists parent_job_id uuid references public.generation_jobs (id) on delete set null,
  add column if not exists regeneration_reason text;

create index if not exists generated_images_user_job_idx
  on public.generated_images (user_id, job_id, created_at desc);

create index if not exists generated_images_fav_idx
  on public.generated_images (user_id, is_favorite, created_at desc);

-- Allow users to update rating/favorite only on their rows.
drop policy if exists "generated_images_update_own" on public.generated_images;
create policy "generated_images_update_own" on public.generated_images
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);


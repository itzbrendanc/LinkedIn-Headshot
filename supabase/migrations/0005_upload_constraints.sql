-- Basic upload constraints to reduce abuse/misuse via direct DB inserts.
-- Note: storage object enforcement still requires Storage policies.

alter table public.photo_uploads
  add constraint if not exists photo_uploads_bytes_max
  check (bytes is null or bytes <= 10485760);

alter table public.photo_uploads
  add constraint if not exists photo_uploads_mime_allowed
  check (
    mime_type is null
    or mime_type in ('image/jpeg','image/png','image/webp')
  );


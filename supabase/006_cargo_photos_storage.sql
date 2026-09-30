-- Private storage for cargo photos uploaded on the booking forms — feeds
-- Haulio SmartLoad's™ AI vehicle-size suggestion (see the `analyze-cargo`
-- edge function under supabase/functions/) and, later, gives the driver a
-- look at what they're picking up before arrival, matching the site's own
-- "Cargo details are shared up front" trust point.
--
-- Same private-bucket, own-folder-only pattern as driver-documents — see
-- 004_driver_documents_storage.sql. Safe to re-run.

insert into storage.buckets (id, name, public)
values ('cargo-photos', 'cargo-photos', false)
on conflict (id) do nothing;

-- Each customer can only read/write inside a path prefixed with their own
-- auth.uid() — the app uploads to `${userId}/${timestamp}-${filename}`.
drop policy if exists "customers manage their own cargo photos" on storage.objects;
create policy "customers manage their own cargo photos" on storage.objects
  for all
  using (
    bucket_id = 'cargo-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'cargo-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';

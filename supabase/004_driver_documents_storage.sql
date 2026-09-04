-- Private storage for driver verification documents (licence, vehicle
-- registration, insurance, vehicle photos). Not the "public covers bucket"
-- the original request template mentioned — nothing in HaulioCargo has a
-- public-image concept yet, so no public bucket is created here. This one
-- stays private on purpose: these are identity and vehicle documents.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

insert into storage.buckets (id, name, public)
values ('driver-documents', 'driver-documents', false)
on conflict (id) do nothing;

-- Each user can only read/write inside a path prefixed with their own
-- auth.uid() — the app already uploads to `${userId}/${kind}-...`, so this
-- is enforcing a convention the client already follows, not introducing a
-- new one.
drop policy if exists "drivers manage their own documents" on storage.objects;
create policy "drivers manage their own documents" on storage.objects
  for all
  using (
    bucket_id = 'driver-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'driver-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';

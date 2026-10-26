-- Lets a matched customer see their driver's vehicle (truck) photo
-- specifically -- not the rest of `driver-documents` (licence, vehicle
-- registration document, insurance), which stay private per
-- 004_driver_documents_storage.sql's own "never public" reasoning.
--
-- Narrowed to just the vehicle photo by matching the filename pattern
-- `uploadDriverDocument` already uses (`vehicle-photo-...`), the same
-- convention app/dashboard/driver/page.tsx already relies on to find its
-- own vehicle photo. A customer can list/sign only objects matching that
-- pattern under their matched driver's folder -- everything else in that
-- folder stays invisible to them, same bookings-join shape as migration
-- 015/021's other matched-counterpart exceptions.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

drop policy if exists "matched customer reads driver vehicle photo" on storage.objects;
create policy "matched customer reads driver vehicle photo" on storage.objects
  for select
  using (
    bucket_id = 'driver-documents'
    and name like '%/vehicle-photo-%'
    and exists (
      select 1 from public.bookings b
      where b.driver_id::text = (storage.foldername(name))[1]
        and b.customer_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';

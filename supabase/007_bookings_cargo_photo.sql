-- Adds the cargo photo's storage path to bookings, populated when the
-- customer uses Haulio SmartLoad's™ photo-based vehicle suggestion on Move
-- With You. Nullable on purpose — a booking is still valid with a manually
-- chosen vehicle size and no photo. Safe to re-run.

alter table public.bookings
  add column if not exists cargo_photo_url text;

notify pgrst, 'reload schema';

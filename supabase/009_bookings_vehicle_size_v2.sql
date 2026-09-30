-- Follow-up to 008: the truck-size guide now has a different "Best for"
-- version per cargo category, so both paths on Move With You (AI or
-- manual) always resolve a category again — it's no longer optional. Truck
-- size itself moves from relative labels (Small/Middle/Big) to literal
-- lengths (10ft/15ft/20ft/26ft), matching the size-guide reference the user
-- sent. Safe to re-run.

-- vehicle_category is required again — backfill any nulls from the brief
-- window where it wasn't (008), same harmless-default reasoning as before:
-- no real production bookings exist yet.
update public.bookings set vehicle_category = 'Household Moves' where vehicle_category is null;

alter table public.bookings
  alter column vehicle_category set not null;

-- Swap the vehicle_size check constraint's allowed values. Existing rows
-- using the old Small/Middle/Big labels get remapped to a same-ballpark
-- new value before the new constraint goes on, so nothing fails the swap.
alter table public.bookings drop constraint if exists bookings_vehicle_size_check;

update public.bookings set vehicle_size = '10ft' where vehicle_size = 'Small';
update public.bookings set vehicle_size = '15ft' where vehicle_size = 'Middle';
update public.bookings set vehicle_size = '20ft' where vehicle_size = 'Big';

alter table public.bookings
  add constraint bookings_vehicle_size_check check (vehicle_size in ('10ft', '15ft', '20ft', '26ft'));

notify pgrst, 'reload schema';

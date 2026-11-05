-- Splits the single "on the way" status into three real trip stages
-- (heading_to_pickup, arrived_at_pickup, heading_to_dropoff), and adds the
-- columns an automatic end-of-trip price adjustment needs.
--
-- `bookings.status` is the booking's CURRENT state, so old `in_progress`
-- rows get remapped forward before the tightened constraint goes on -- safe,
-- this project's own migrations have repeatedly noted no real production
-- bookings exist yet.
--
-- `booking_status_events.status` (027) is a HISTORY log, not current state --
-- past `in_progress` entries represent what actually happened and aren't
-- rewritten, so that constraint is only ever widened, never tightened.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

update public.bookings set status = 'heading_to_pickup' where status = 'in_progress';

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check
  check (status in ('pending', 'confirmed', 'heading_to_pickup', 'arrived_at_pickup', 'heading_to_dropoff', 'completed', 'cancelled'));

alter table public.booking_status_events drop constraint if exists booking_status_events_status_check;
alter table public.booking_status_events
  add constraint booking_status_events_status_check
  check (status in ('pending', 'confirmed', 'in_progress', 'heading_to_pickup', 'arrived_at_pickup', 'heading_to_dropoff', 'completed', 'cancelled'));

alter table public.bookings
  add column if not exists final_price numeric,
  add column if not exists price_change_reason text;

notify pgrst, 'reload schema';

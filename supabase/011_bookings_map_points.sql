-- Exact pickup and drop-off points the customer chose on the map, so the
-- booking page can place pins precisely after submit (and after reload).
-- Nullable: bookings made before this existed simply have no points, and the
-- booking page falls back to showing the addresses without pins. Safe to re-run.

alter table public.bookings
  add column if not exists pickup_lat double precision,
  add column if not exists pickup_lng double precision,
  add column if not exists dropoff_lat double precision,
  add column if not exists dropoff_lng double precision;

notify pgrst, 'reload schema';

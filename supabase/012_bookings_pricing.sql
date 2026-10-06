-- The trip distance and estimated price the customer saw before submitting.
-- Nullable: older bookings simply have no price. Safe to re-run.

alter table public.bookings
  add column if not exists distance_km numeric,
  add column if not exists estimated_price numeric;

notify pgrst, 'reload schema';

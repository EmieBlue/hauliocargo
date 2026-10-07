-- Optional cargo weight/volume the customer entered on Move With You, used
-- to price the load on top of distance. Nullable: most bookings won't have
-- these, since the fields are optional. Safe to re-run.

alter table public.bookings
  add column if not exists cargo_weight_kg numeric,
  add column if not exists cargo_volume_m3 numeric;

notify pgrst, 'reload schema';

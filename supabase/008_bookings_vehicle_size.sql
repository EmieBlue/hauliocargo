-- Move With You's real final answer is now a truck size (Small/Middle/Big),
-- reached either via SmartLoad™'s AI suggestion or picked manually after a
-- cargo category. The category picker only shows up on the manual path now,
-- so vehicle_category can no longer be required on every booking — only
-- vehicle_size is. Safe to re-run.

alter table public.bookings
  add column if not exists vehicle_size text;

-- Backfill any existing rows before adding the not-null constraint below —
-- every booking so far went through the old category-only flow, so there's
-- nothing meaningful to size them by; "Middle" is a reasonable, harmless
-- default for the handful of rows this project has so far.
update public.bookings set vehicle_size = 'Middle' where vehicle_size is null;

alter table public.bookings
  alter column vehicle_size set not null;

do $$ begin
  alter table public.bookings
    add constraint bookings_vehicle_size_check check (vehicle_size in ('Small', 'Middle', 'Big'));
exception
  when duplicate_object then null;
end $$;

-- vehicle_category is now optional — the AI path never collects one.
alter table public.bookings
  alter column vehicle_category drop not null;

notify pgrst, 'reload schema';

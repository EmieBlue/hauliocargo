-- One row per booking request. Shared across all three customer booking
-- types (move/send/receive) rather than three separate tables, since the
-- shape (pickup, dropoff, cargo, vehicle, schedule) is the same for each.
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references public.profiles(id) on delete cascade,
  booking_type       text not null check (booking_type in ('move', 'send', 'receive')),
  pickup_location    text not null,
  dropoff_location   text not null,
  scheduled_for      timestamptz,
  cargo_description  text not null,
  vehicle_category   text not null,
  status             text not null default 'pending'
                       check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at         timestamptz not null default now()
);

alter table public.bookings enable row level security;

-- Own-row read/insert only, same reasoning as profiles/driver_applications:
-- no public-listing feature exists yet to justify a broader policy.
drop policy if exists "customer reads own bookings" on public.bookings;
create policy "customer reads own bookings" on public.bookings
  for select using (auth.uid() = customer_id);

drop policy if exists "customer creates own booking" on public.bookings;
create policy "customer creates own booking" on public.bookings
  for insert with check (auth.uid() = customer_id);

-- Deliberately no update/delete policy for customers — status moves from
-- pending to confirmed/in_progress/etc. as a driver/admin action, out of
-- scope this round, same as driver_applications' own status field.

notify pgrst, 'reload schema';

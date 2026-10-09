-- Lets a verified driver release ("cancel") a job they'd already accepted
-- back to the open pool, rather than ending the customer's request:
-- status goes back to pending and driver_id is cleared, so any driver
-- (including a different one) can pick it up again.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

-- Snapshot columns on job_declines, added here rather than in
-- 016_job_declines.sql: once another driver later accepts a job this
-- driver declined, migration 015's own-job-only SELECT policy means this
-- driver loses read access to that live bookings row — so their own
-- decline history needs its own copy of the display fields, not a join.
alter table public.job_declines
  add column if not exists pickup_location text,
  add column if not exists dropoff_location text,
  add column if not exists cargo_description text,
  add column if not exists vehicle_size text,
  add column if not exists vehicle_category text,
  add column if not exists scheduled_for timestamptz;

-- job_cancellations: the audit trail a driver's own "cancelled" history
-- reads from — after a cancel, driver_id is cleared on the booking
-- itself, so there is nothing left there to list. Same snapshot shape and
-- same reasoning as job_declines' new columns above.
create table if not exists public.job_cancellations (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references public.bookings(id) on delete cascade,
  driver_id          uuid not null references public.profiles(id) on delete cascade,
  reasons            text[] not null,
  pickup_location    text,
  dropoff_location   text,
  cargo_description  text,
  vehicle_size       text,
  vehicle_category   text,
  scheduled_for      timestamptz,
  created_at         timestamptz not null default now()
);

alter table public.job_cancellations enable row level security;

drop policy if exists "verified driver reads own cancellations" on public.job_cancellations;
create policy "verified driver reads own cancellations" on public.job_cancellations
  for select using (auth.uid() = driver_id);

drop policy if exists "verified driver inserts own cancellation" on public.job_cancellations;
create policy "verified driver inserts own cancellation" on public.job_cancellations
  for insert with check (auth.uid() = driver_id);

-- Additive UPDATE policy on bookings (combined with migration 015's own
-- policy via OR), not an edit to that one — a different, narrower
-- transition in the opposite direction: own confirmed/in_progress job ->
-- pending + unclaimed, never the reverse.
drop policy if exists "verified driver cancels own job" on public.bookings;
create policy "verified driver cancels own job" on public.bookings
  for update using (
    driver_id = auth.uid()
    and status in ('confirmed', 'in_progress')
    and exists (
      select 1 from public.driver_applications da
      where da.profile_id = auth.uid() and da.status = 'verified'
    )
  )
  with check (driver_id is null and status = 'pending');

notify pgrst, 'reload schema';

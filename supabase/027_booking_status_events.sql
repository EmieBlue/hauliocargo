-- A timestamped history of a booking's status changes -- lets the admin (and
-- later the customer) see when it moved from pending to confirmed to
-- in_progress to completed, not just what it currently is. Populated by a
-- trigger, not by touching every place lib/bookings.ts already changes
-- status (acceptJob/advanceJob/cancelJob), so it can never drift out of
-- sync -- same approach as lock_driver_application_status (019) and
-- lock_profile_role (024).
--
-- This is a stage timeline, not live location tracking -- no lat/lng here,
-- that's a separate future round.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.booking_status_events (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  status     text not null check (status in ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.booking_status_events enable row level security;

create or replace function public.log_booking_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.booking_status_events (booking_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_log_status_event on public.bookings;
create trigger bookings_log_status_event
  after insert or update on public.bookings
  for each row execute function public.log_booking_status_event();

-- Backfill: one event per existing booking at its current status, so older
-- bookings get a timeline entry instead of an empty history.
insert into public.booking_status_events (booking_id, status, created_at)
select id, status, created_at from public.bookings b
where not exists (select 1 from public.booking_status_events e where e.booking_id = b.id);

drop policy if exists "customer reads own booking events" on public.booking_status_events;
create policy "customer reads own booking events" on public.booking_status_events
  for select using (exists (select 1 from public.bookings b where b.id = booking_id and b.customer_id = auth.uid()));

drop policy if exists "driver reads own booking events" on public.booking_status_events;
create policy "driver reads own booking events" on public.booking_status_events
  for select using (exists (select 1 from public.bookings b where b.id = booking_id and b.driver_id = auth.uid()));

drop policy if exists "admin reads all booking events" on public.booking_status_events;
create policy "admin reads all booking events" on public.booking_status_events
  for select using (public.is_admin());

notify pgrst, 'reload schema';

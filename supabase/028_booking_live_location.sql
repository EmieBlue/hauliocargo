-- The driver's live position while a job is in progress -- an append-only
-- ping log, same shape as messages (020): a table, RLS, and a Realtime
-- publication entry so customer/driver/admin all see new pings live instead
-- of only after a reload.
--
-- Unpruned on purpose, same as messages -- only ever queried for the single
-- latest row per booking, so old pings just sit there unused. Pruning is a
-- future concern, not this round's.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.booking_locations (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  lat         double precision not null,
  lng         double precision not null,
  recorded_at timestamptz not null default now()
);

create index if not exists booking_locations_booking_recorded_idx
  on public.booking_locations (booking_id, recorded_at desc);

alter table public.booking_locations enable row level security;

-- Only the assigned driver can add pings to their own job -- same
-- "driver_id = auth.uid()" ownership check migration 015 already uses for
-- claiming/advancing a job.
drop policy if exists "driver inserts own booking location" on public.booking_locations;
create policy "driver inserts own booking location" on public.booking_locations
  for insert with check (
    exists (select 1 from public.bookings b where b.id = booking_id and b.driver_id = auth.uid())
  );

-- That booking's own customer or driver, or any admin -- same three-way
-- shape as messages' own read policy, plus is_admin().
drop policy if exists "booking parties and admin read locations" on public.booking_locations;
create policy "booking parties and admin read locations" on public.booking_locations
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and (b.customer_id = auth.uid() or b.driver_id = auth.uid())
    )
    or public.is_admin()
  );

-- Live updates -- without this, a new ping only shows up after a reload.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'booking_locations'
  ) then
    alter publication supabase_realtime add table public.booking_locations;
  end if;
end $$;

notify pgrst, 'reload schema';

-- Records why a driver declined an open job. Declining never touches the
-- bookings row itself -- the job stays open for every other driver; this
-- is only a record of the one driver's own decision, replacing the
-- previous localStorage-only version so it follows them across devices
-- and the reason is actually captured somewhere, not just discarded.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.job_declines (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  driver_id   uuid not null references public.profiles(id) on delete cascade,
  reasons     text[] not null,
  created_at  timestamptz not null default now()
);

alter table public.job_declines enable row level security;

-- Own-row read/insert only, same verified-driver check the bookings
-- policies already use (migration 015) -- a pending/rejected account
-- shouldn't be able to decline jobs it was never shown.
drop policy if exists "verified driver reads own declines" on public.job_declines;
create policy "verified driver reads own declines" on public.job_declines
  for select using (
    auth.uid() = driver_id
    and exists (
      select 1 from public.driver_applications da
      where da.profile_id = auth.uid() and da.status = 'verified'
    )
  );

drop policy if exists "verified driver inserts own decline" on public.job_declines;
create policy "verified driver inserts own decline" on public.job_declines
  for insert with check (
    auth.uid() = driver_id
    and exists (
      select 1 from public.driver_applications da
      where da.profile_id = auth.uid() and da.status = 'verified'
    )
  );

notify pgrst, 'reload schema';

-- Links a booking to the driver who accepted it, plus the RLS a driver
-- needs to see open jobs, claim one, and move their own job through its
-- later stages. Also lets a customer and their matched driver each read
-- the other's name/phone -- narrow, two-way exceptions to "no public
-- profile read", not a general one.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

alter table public.bookings
  add column if not exists driver_id uuid references public.profiles(id) on delete set null;

-- A verified driver can see bookings that are open for anyone to claim
-- (pending, unclaimed) or already theirs -- never another driver's job or
-- a customer's full history.
drop policy if exists "verified driver reads open or own bookings" on public.bookings;
create policy "verified driver reads open or own bookings" on public.bookings
  for select using (
    exists (
      select 1 from public.driver_applications da
      where da.profile_id = auth.uid() and da.status = 'verified'
    )
    and ((driver_id is null and status = 'pending') or driver_id = auth.uid())
  );

-- A verified driver can claim an open job (the app always sets driver_id
-- to themself and status to 'confirmed' in that one request) or move
-- their own job forward (confirmed -> in_progress -> completed). The
-- WITH CHECK only guarantees driver_id is their own row after the update
-- -- it can't restrict which columns changed, so the step-by-step
-- validation (only ever one status forward, only ever their own id)
-- lives in lib/bookings.ts, the same trust level this project's RLS
-- already gives its own client code elsewhere.
drop policy if exists "verified driver updates open or own bookings" on public.bookings;
create policy "verified driver updates open or own bookings" on public.bookings
  for update using (
    exists (
      select 1 from public.driver_applications da
      where da.profile_id = auth.uid() and da.status = 'verified'
    )
    and ((driver_id is null and status = 'pending') or driver_id = auth.uid())
  )
  with check (driver_id = auth.uid());

-- Once matched, each side can read the other's name/phone.
drop policy if exists "customer reads assigned driver profile" on public.profiles;
create policy "customer reads assigned driver profile" on public.profiles
  for select using (
    exists (
      select 1 from public.bookings b
      where b.driver_id = profiles.id and b.customer_id = auth.uid()
    )
  );

drop policy if exists "driver reads assigned customer profile" on public.profiles;
create policy "driver reads assigned customer profile" on public.profiles
  for select using (
    exists (
      select 1 from public.bookings b
      where b.customer_id = profiles.id and b.driver_id = auth.uid()
    )
  );

notify pgrst, 'reload schema';

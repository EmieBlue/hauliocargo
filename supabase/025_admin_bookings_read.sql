-- Admin-wide read access to bookings, for the new Bookings section of the
-- admin dashboard. `profiles` already has this (023, fixed in 024); `bookings`
-- never did. Reuses `public.is_admin()` (024) -- not a repeat of 023's
-- self-referencing-policy mistake, since this policy is on `bookings`, not
-- on the table `is_admin()` itself reads.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

drop policy if exists "admin reads all bookings" on public.bookings;
create policy "admin reads all bookings" on public.bookings
  for select using (public.is_admin());

notify pgrst, 'reload schema';

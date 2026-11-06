-- A second, independent signal that a trip is actually progressing --
-- informational only, doesn't change bookings.status or require agreement
-- with the driver's own self-reported stage. Useful precisely because
-- location sharing (028) is opt-in and the driver could turn it off.
--
-- Same trust shape already established for the driver's own update policy
-- (015): RLS enforces row ownership, the client code is trusted to only
-- ever touch this one field for this action -- not a new model.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

alter table public.bookings
  add column if not exists customer_confirmed_departure_at timestamptz;

drop policy if exists "customer confirms own booking departure" on public.bookings;
create policy "customer confirms own booking departure" on public.bookings
  for update using (auth.uid() = customer_id);

notify pgrst, 'reload schema';

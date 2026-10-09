-- A customer rates their driver once a booking is completed — one rating
-- per booking (the unique constraint), 1-5 stars plus an optional
-- comment. The driver reads their own ratings to compute their average;
-- nothing here exposes one driver's ratings to another, or to a customer
-- who wasn't actually on that booking.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.driver_ratings (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null unique references public.bookings(id) on delete cascade,
  driver_id   uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  stars       int not null check (stars between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

alter table public.driver_ratings enable row level security;

-- Only for a booking the customer actually owns, already completed, and
-- actually matching that booking's driver — not a free-standing rating of
-- anyone.
drop policy if exists "customer rates own completed booking" on public.driver_ratings;
create policy "customer rates own completed booking" on public.driver_ratings
  for insert with check (
    auth.uid() = customer_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and b.customer_id = auth.uid()
        and b.driver_id = driver_ratings.driver_id
        and b.status = 'completed'
    )
  );

drop policy if exists "customer reads own ratings" on public.driver_ratings;
create policy "customer reads own ratings" on public.driver_ratings
  for select using (auth.uid() = customer_id);

drop policy if exists "driver reads own ratings" on public.driver_ratings;
create policy "driver reads own ratings" on public.driver_ratings
  for select using (auth.uid() = driver_id);

notify pgrst, 'reload schema';

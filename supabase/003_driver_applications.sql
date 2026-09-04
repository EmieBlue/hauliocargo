-- One driver application per driver profile: vehicle details + verification status.
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.driver_applications (
  id                      uuid primary key default gen_random_uuid(),
  profile_id              uuid not null references public.profiles(id) on delete cascade,
  date_of_birth           date,
  license_number          text not null,
  vehicle_type            text not null,
  vehicle_make            text not null,
  vehicle_model           text not null,
  vehicle_year            int not null,
  vehicle_registration_no text not null,
  vehicle_capacity        text not null,
  status                  text not null default 'pending'
                            check (status in ('pending', 'verified', 'rejected')),
  submitted_at            timestamptz not null default now()
);

alter table public.driver_applications enable row level security;

-- Own-row read/insert only — license numbers and vehicle registration are
-- never public. No public-read policy belongs here for the same reason as
-- profiles: there is no driver-listing feature yet to justify one.
drop policy if exists "driver reads own application" on public.driver_applications;
create policy "driver reads own application" on public.driver_applications
  for select using (auth.uid() = profile_id);

drop policy if exists "driver submits own application" on public.driver_applications;
create policy "driver submits own application" on public.driver_applications
  for insert with check (auth.uid() = profile_id);

-- Deliberately no update policy: a driver cannot self-approve. Status moves
-- from pending to verified/rejected as an admin action, out of scope this
-- round, and will need the service_role key from a trusted server context —
-- never the anon key, never a browser.

notify pgrst, 'reload schema';

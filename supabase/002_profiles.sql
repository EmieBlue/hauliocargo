-- One row per authenticated user: role, name, contact info.
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('customer', 'driver', 'admin')),
  first_name text not null,
  last_name  text not null,
  phone      text not null,
  city       text,
  area       text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Own-row-only in every direction. No public read: this holds phone numbers
-- and city/area, and HaulioCargo has no "public profile" concept yet (no
-- driver listing, no public-facing customer page). A public-read policy
-- belongs alongside whichever future feature actually needs one, not here
-- pre-emptively.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Populated by the app right after auth.signUp() returns, not by a trigger
-- on auth.users: role and name aren't known at the moment the auth user is
-- created, only once the registration form submits them. This policy — not
-- the timing of the insert — is what keeps it safe: a signed-in user can
-- only ever insert the row matching their own auth.uid().
drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

notify pgrst, 'reload schema';

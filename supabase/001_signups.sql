-- Early-access list (landing page sign-up form).
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  intent     text not null check (intent in ('contact', 'register')),
  created_at timestamptz not null default now()
);

alter table public.signups enable row level security;

-- Insert-only, on purpose, for every role including the row's own creator:
-- there is no "your own signups" concept to expose, and the point of leaving
-- select ungranted is that the list cannot be scraped even with the public
-- anon key. If a genuine business need for reading these rows back ever
-- shows up, it should go through the service_role key from a trusted
-- context, never a new anon-facing select policy.
drop policy if exists "anon can insert" on public.signups;
create policy "anon can insert" on public.signups
  for insert to anon with check (true);

notify pgrst, 'reload schema';

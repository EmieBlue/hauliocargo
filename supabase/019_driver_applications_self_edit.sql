-- Lets a driver edit their own application's vehicle/licence fields from
-- the Profile page, without being able to touch `status` themselves --
-- the exact self-approval risk 003_driver_applications.sql's own comment
-- flagged as the reason no update policy existed at all. A plain RLS
-- policy can't protect one column while allowing the rest (its WITH CHECK
-- only sees the new row, not the old one to compare against), so a
-- trigger does that part: any status change coming through a normal
-- session is silently reverted, while a future service-role-based admin
-- tool (the "trusted server context" that same comment already pointed
-- to) is unaffected, since it runs as a different Postgres role.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

create or replace function public.lock_driver_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' and new.status is distinct from old.status then
    new.status := old.status;
  end if;
  return new;
end;
$$;

drop trigger if exists driver_applications_lock_status on public.driver_applications;
create trigger driver_applications_lock_status
  before update on public.driver_applications
  for each row
  execute function public.lock_driver_application_status();

drop policy if exists "driver updates own application" on public.driver_applications;
create policy "driver updates own application" on public.driver_applications
  for update using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

notify pgrst, 'reload schema';

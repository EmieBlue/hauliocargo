-- The backend half of the real admin page: lets an admin account actually
-- read driver applications/profiles/documents (nothing could before this --
-- every existing policy is scoped to "your own row" or a specific matched
-- customer/driver exception), stores a reason when an application is
-- rejected, and closes the self-role-escalation gap flagged in
-- PROJECT_NOTES.md ("profiles' update policy has no WITH CHECK, so a user
-- could technically change their own role").
--
-- Nothing here lets an admin WRITE driver_applications.status -- that still
-- requires the service_role key, via the new admin-driver-decision Edge
-- Function, same as migration 019 already established. This migration only
-- grants admin-scoped READ access plus the rejection-reason column.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

-- Array, not a single text field, matching how job_declines/job_cancellations
-- already store reasons (016/017) -- the admin picks one or more preset
-- reasons via the same ReasonDialog component those use.
alter table public.driver_applications
  add column if not exists rejection_reasons text[];

-- Same trigger shape as 019's lock_driver_application_status, for the same
-- reason: a WITH CHECK alone can't compare against the row's OLD value, so
-- it can't by itself stop `role` changing while still allowing everything
-- else `updateOwnProfile` legitimately writes (first_name, last_name,
-- phone, city, area).
--
-- One deliberate difference from 019: this also allows the change when
-- auth.role() is NULL, not just when it's 'service_role'. auth.role() is
-- only ever set by PostgREST for a real API request (authenticated/anon
-- JWT) -- a direct Supabase SQL Editor connection has no JWT context at
-- all, so auth.role() reads as NULL there. Without this, promoting the
-- very first admin account by hand in the SQL Editor (the only way it can
-- ever happen, since nothing in the app sets role='admin') would silently
-- revert itself the same way the vehicle-color save silently failed
-- earlier this project, for the same root cause -- only here it would be a
-- lot harder to notice, since nothing in the UI would ever report an error.
create or replace function public.lock_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is not null
     and auth.role() is distinct from 'service_role'
     and new.role is distinct from old.role then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_lock_role on public.profiles;
create trigger profiles_lock_role
  before update on public.profiles
  for each row
  execute function public.lock_profile_role();

-- Admin-only reads. Each checks the CALLING user's own profile role, not
-- the row being read -- narrow and additive, same pattern as every other
-- exception policy in this project (015, 021, 022).
drop policy if exists "admin reads all profiles" on public.profiles;
create policy "admin reads all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
  );

drop policy if exists "admin reads all driver applications" on public.driver_applications;
create policy "admin reads all driver applications" on public.driver_applications
  for select using (
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
  );

drop policy if exists "admin reads all driver documents" on storage.objects;
create policy "admin reads all driver documents" on storage.objects
  for select using (
    bucket_id = 'driver-documents'
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
  );

notify pgrst, 'reload schema';

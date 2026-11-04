-- Fixes a bug in migration 023: "admin reads all profiles" checked admin
-- status with `exists (select 1 from public.profiles me where ...)` -- a
-- policy ON profiles querying profiles again. Postgres can't evaluate that;
-- it fails every single read of profiles with "infinite recursion detected
-- in policy for relation profiles", which getSessionProfile() silently
-- swallows (it only checks `data`, not `error`) and treats as "not signed
-- in" -- bouncing every account, not just admins, straight back to sign-in.
--
-- Fix: do the admin check inside a `security definer` function owned by the
-- table owner (`postgres`), which runs outside RLS entirely instead of
-- re-triggering the policy it's being called from.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "admin reads all profiles" on public.profiles;
create policy "admin reads all profiles" on public.profiles
  for select using (public.is_admin());

drop policy if exists "admin reads all driver applications" on public.driver_applications;
create policy "admin reads all driver applications" on public.driver_applications
  for select using (public.is_admin());

drop policy if exists "admin reads all driver documents" on storage.objects;
create policy "admin reads all driver documents" on storage.objects
  for select using (bucket_id = 'driver-documents' and public.is_admin());

notify pgrst, 'reload schema';

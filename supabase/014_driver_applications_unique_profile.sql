-- One application per driver profile — enforces what this table's own
-- comment in 003_driver_applications.sql already says. Lets
-- completeDriverProfile (lib/auth.ts) upsert by profile_id instead of
-- insert, so retrying after a transient failure can't create a second
-- application row for the same driver.
--
-- Safe to re-run: guarded by a check against pg_constraint first, since
-- Postgres has no `add constraint if not exists`.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'driver_applications_profile_id_key'
  ) then
    alter table public.driver_applications
      add constraint driver_applications_profile_id_key unique (profile_id);
  end if;
end $$;

notify pgrst, 'reload schema';

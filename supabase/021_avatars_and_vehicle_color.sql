-- Profile photo upload (any user) + a matched customer seeing their
-- driver's picture, truck color, and registration number.
--
-- `profiles.avatar_path` is covered for free by migration 015's existing
-- two-way "matched customer/driver read each other's profile" exception --
-- no new policy needed for the photo itself.
--
-- `driver_applications` has no cross-user read policy at all (003's own
-- comment: licence numbers and vehicle registration are never public), and
-- that table also holds license_number/date_of_birth alongside the vehicle
-- fields a customer should be able to see. A plain row policy can't expose
-- some columns while hiding others, so a `security definer` function does
-- the narrow exposure instead -- its own select list is hard-coded to the
-- safe vehicle columns only, same approach as 019's status-lock trigger.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.driver_applications
  add column if not exists vehicle_color text;

-- Private bucket, matching 004/006's deliberate choice not to introduce a
-- public-image concept in this project -- avatars stay signed-URL-on-read,
-- same as every other upload here.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

-- Each user manages their own avatar under a path prefixed by their own id.
drop policy if exists "users manage their own avatar" on storage.objects;
create policy "users manage their own avatar" on storage.objects
  for all
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- A matched customer can also read (sign a URL for) their driver's avatar --
-- same bookings-join shape as migration 015's profiles exception, applied
-- to storage.objects instead. One-directional: this round only asked for
-- the customer to see the driver's photo.
drop policy if exists "matched customer reads driver avatar" on storage.objects;
create policy "matched customer reads driver avatar" on storage.objects
  for select
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.bookings b
      where b.driver_id::text = (storage.foldername(name))[1]
        and b.customer_id = auth.uid()
    )
  );

-- Narrow, read-only peek at a matched driver's vehicle display info.
-- security definer so it can read driver_applications internally despite
-- that table having no customer-facing policy -- but its own select list
-- only ever includes these six columns, so license_number/date_of_birth
-- are unreachable through it no matter what.
create or replace function public.get_matched_driver_vehicle(p_booking_id uuid)
returns table (
  vehicle_make text,
  vehicle_model text,
  vehicle_year int,
  vehicle_color text,
  vehicle_registration_no text,
  vehicle_type text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select da.vehicle_make, da.vehicle_model, da.vehicle_year, da.vehicle_color,
           da.vehicle_registration_no, da.vehicle_type
    from public.bookings b
    join public.driver_applications da on da.profile_id = b.driver_id
    where b.id = p_booking_id
      and b.customer_id = auth.uid()
      and b.driver_id is not null;
end;
$$;

grant execute on function public.get_matched_driver_vehicle(uuid) to authenticated;

notify pgrst, 'reload schema';

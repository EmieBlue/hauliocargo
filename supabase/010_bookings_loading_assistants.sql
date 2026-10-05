-- Move With You's optional "need help loading?" step: how many assistants,
-- if any, the customer asked for. Nullable -- null means no assistant was
-- requested, same "optional, doesn't block the rest of the booking" shape
-- as cargo_photo_url. Safe to re-run.

alter table public.bookings
  add column if not exists loading_assistants text;

do $$ begin
  alter table public.bookings
    add constraint bookings_loading_assistants_check check (loading_assistants in ('1', '2', '3', '4+'));
exception
  when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';

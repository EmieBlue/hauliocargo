-- One conversation per booking, between that booking's customer and
-- whichever driver is assigned to it -- not a general inbox, since every
-- chat here is always tied to a specific move. Realtime is turned on for
-- this table so both sides see new messages appear live.
--
-- Safe to re-run: every statement either checks first or replaces cleanly.

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  sender_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Only that booking's own customer or its currently assigned driver --
-- never a driver who merely declined/cancelled it in the past, and never
-- anyone else's conversation.
drop policy if exists "booking parties read messages" on public.messages;
create policy "booking parties read messages" on public.messages
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.driver_id = auth.uid())
    )
  );

drop policy if exists "booking parties send messages" on public.messages;
create policy "booking parties send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.customer_id = auth.uid() or b.driver_id = auth.uid())
    )
  );

-- Live updates for the chat UI -- without this, a new message only shows
-- up after a manual reload.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

notify pgrst, 'reload schema';

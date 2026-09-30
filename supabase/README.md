# Database setup

Migration files, run in order, each in Supabase → **SQL Editor** → New query → paste → Run. Every file is
safe to run more than once — nothing errors on a second run, which is what "idempotent" buys: re-running the
whole set after a change never needs a rollback first.

```
001_signups.sql                    the early-access list (landing page)
002_profiles.sql                   one row per authenticated user
003_driver_applications.sql        vehicle details + verification status
004_driver_documents_storage.sql   private bucket for licence/registration/insurance uploads
005_bookings.sql                   one row per booking request (move/send/receive)
006_cargo_photos_storage.sql       private bucket for SmartLoad™ cargo photo uploads
007_bookings_cargo_photo.sql       adds bookings.cargo_photo_url
008_bookings_vehicle_size.sql      adds bookings.vehicle_size, makes vehicle_category optional
```

If `001` and `002` already exist from earlier setup, running them again is harmless — `create table if not
exists` and the policy drop-then-recreate pattern both no-op cleanly against what's already there.

Every file ends with `notify pgrst, 'reload schema';` — Supabase's API layer (PostgREST) caches the schema and
won't see a new table, column or policy until told to reload. Skipping this is the classic "I ran the SQL and
the app still can't see it" trap.

---

## Verifying as an anonymous user (no session)

In the SQL Editor, `set role` switches the current query to run as a given Postgres role — this is the
standard way to test an RLS policy directly, without needing a real browser session:

```sql
set role anon;

-- Expect: 0 rows. profiles has no select policy for anon at all.
select * from public.profiles;

-- Expect: 0 rows, same reason.
select * from public.driver_applications;

-- Expect: 0 rows. signups has no select policy for anyone, including anon —
-- deliberate, so the list can't be scraped with the public key.
select * from public.signups;

-- Expect: this succeeds. signups is insert-only for anon, by design.
insert into public.signups (email, intent) values ('test@example.com', 'contact');

reset role;
```

## Verifying as a signed-in user

`set role` alone can't fake a real `auth.uid()`, so the simplest reliable check is the live app itself:

1. Register a real test account (customer or driver) through `/register`.
2. In **Table Editor**, confirm the new row appears in `profiles` (and `driver_applications` for a driver),
   owned by that user's `auth.users` id.
3. Still in Table Editor, with RLS **on** (the default view), confirm you only ever see that one row per table
   — not every user's data — which is the RLS policy actually doing its job rather than the editor's own
   elevated access masking a missing policy.
4. For the storage bucket: after a driver registration with an uploaded document, confirm the file exists in
   **Storage → driver-documents** under a path starting with that user's id.

---

## Edge Function: `analyze-cargo` (Haulio SmartLoad™)

The one server-side piece in this project — everything else is a direct browser call using the public anon
key, safe because RLS (not secrecy) protects it. An Anthropic API key is a real secret with no
domain-restriction option, so it can only live here, never in browser code. Source:
`supabase/functions/analyze-cargo/index.ts`.

**Deploy** — Supabase → **Edge Functions** → **Deploy a new function** → name it `analyze-cargo` → paste in
the contents of that file → Deploy. (The dashboard's own code editor is enough; no command line needed.)

**Secret** — Supabase → **Project Settings** → **Edge Functions** → **Secrets** → add `ANTHROPIC_API_KEY` with
a real Anthropic API key. The function returns a clear "not configured yet" response until this is set, rather
than failing oddly.

**Verify**: on Move With You, add a cargo photo — within a couple of seconds a vehicle size should highlight
itself with a "SmartLoad™ suggests…" note. Tapping a different size still overrides it; nothing here forces
the AI's pick.

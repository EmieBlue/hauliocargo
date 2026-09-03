# Deploying HaulioCargo

The landing page is a **static export** — `next build` emits plain files into
`out/`, and Netlify serves them straight from its CDN. There is no Next.js
runtime and no serverless function involved.

> When registration or booking needs a server, remove `output: "export"` from
> `next.config.ts`. `next build` fails loudly if a server feature is added while
> that setting stands, so this cannot be forgotten silently.

---

## 1. Push to GitHub

Create an **empty** repository on GitHub — no README, no `.gitignore`, no
licence, or the first push will conflict. Then:

```bash
git remote add origin https://github.com/<you>/hauliocargo.git
git push -u origin master
```

## 2. Connect Netlify

**Add new site → Import an existing project → GitHub**, pick the repo. The
settings come from `netlify.toml` and should need no editing:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `out` |
| Node version | 22 |

The site goes live at `<name>.netlify.app`. Rename it under **Site
configuration → Site details**. Every push to `master` redeploys automatically.

A custom domain attaches later under **Domain management** without redeploying —
there is no need to own one before going live.

---

## 3. Supabase — the early-access list

Sign-ups degrade gracefully: with the environment variables absent the form
tells visitors the list is not open yet, so the site works before this step.

**Create the table.** Supabase → SQL Editor:

```sql
create table public.signups (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  intent     text not null check (intent in ('contact','register')),
  created_at timestamptz not null default now()
);

alter table public.signups enable row level security;

create policy "anon can insert" on public.signups
  for insert to anon with check (true);

-- Deliberately no select policy. The browser can add a row and can never
-- read one back, so the list cannot be scraped with the public key.
```

**Wire the keys.** From Supabase → Project Settings → API, take the Project URL
and the `anon` public key.

Locally, in `.env.local` (gitignored — **never commit these**):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

On Netlify, the same two under **Site configuration → Environment variables**,
then trigger a redeploy so the build picks them up.

The `anon` key is designed to be public — it identifies the project and grants
nothing on its own. Row-level security is what protects the table. The
`service_role` key is the opposite: it bypasses RLS entirely and must never
appear in this repository or in any `NEXT_PUBLIC_*` variable.

**Check it.** Submit the form, confirm the row appears in **Table Editor →
signups**, and confirm a `select` from the browser returns nothing.

---

## 4. Supabase — authentication

Uses the **same project** as the early-access list above, so if that's already connected, the
`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` pair is already in place — this section only adds
tables and two dashboard settings.

**Run the schema.** Supabase → SQL Editor:

```sql
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('customer','driver','admin')),
  first_name text not null,
  last_name  text not null,
  phone      text not null,
  city       text,
  area       text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);

create table public.driver_applications (
  id                        uuid primary key default gen_random_uuid(),
  profile_id                uuid not null references public.profiles(id) on delete cascade,
  date_of_birth             date,
  license_number            text not null,
  vehicle_type              text not null,
  vehicle_make              text not null,
  vehicle_model             text not null,
  vehicle_year              int not null,
  vehicle_registration_no   text not null,
  vehicle_capacity          text not null,
  status                    text not null default 'pending' check (status in ('pending','verified','rejected')),
  submitted_at              timestamptz not null default now()
);
alter table public.driver_applications enable row level security;
create policy "driver reads own application" on public.driver_applications
  for select using (auth.uid() = profile_id);
create policy "driver submits own application" on public.driver_applications
  for insert with check (auth.uid() = profile_id);
-- Deliberately no update policy — a driver cannot self-approve. Status
-- changes are an admin action, out of scope this round, and will need the
-- service-role key, which never belongs in browser code.
```

**Create the storage bucket.** Supabase → Storage → New bucket → name it `driver-documents`, **private** (not
public). Then, in the SQL editor, a policy scoping each user to their own folder:

```sql
create policy "drivers manage their own documents"
on storage.objects for all
using (bucket_id = 'driver-documents' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'driver-documents' and (storage.foldername(name))[1] = auth.uid()::text);
```

**Two dashboard settings, not code:**

- **Auth → Policies → Password requirements** — set minimum length 8 with uppercase/lowercase/number required.
  Supabase's default is weaker than that; the app's own checklist promises these four rules, so the account
  needs to actually enforce them, not just the UI.
- **Auth → Email Templates → Confirm signup** *and* **Reset password** — set both to **OTP** (a 6-digit code),
  not the default magic-link. The verification screen expects a code to type in; a magic-link email would send
  something that screen can't consume.

**Check it.** Register a customer account, confirm the real email OTP arrives and verifies, confirm the new
row appears in **Table Editor → profiles**. Register a driver account, confirm `driver_applications` gets a row
with `status = 'pending'` and the uploaded files appear under that user's folder in the `driver-documents`
bucket.

---

## Local development

```bash
npm run dev     # http://localhost:3000
npm run url     # the address to open on a phone on the same Wi-Fi
npm run build   # static export into out/
```

`allowedDevOrigins` in `next.config.ts` is what lets a phone load the dev
server. Without it Next blocks `/_next/*` from any origin but localhost, and the
phone receives HTML with no JavaScript — a page that renders but never hydrates.

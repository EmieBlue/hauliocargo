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

## Local development

```bash
npm run dev     # http://localhost:3000
npm run url     # the address to open on a phone on the same Wi-Fi
npm run build   # static export into out/
```

`allowedDevOrigins` in `next.config.ts` is what lets a phone load the dev
server. Without it Next blocks `/_next/*` from any origin but localhost, and the
phone receives HTML with no JavaScript — a page that renders but never hydrates.

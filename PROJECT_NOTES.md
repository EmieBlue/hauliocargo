# Project notes — where things stand

This file is a running status note, not documentation. It exists so a Claude Code session on *any* machine
(work laptop or home laptop) picks up current context automatically — `CLAUDE.md` imports it, so it loads at
the start of every session in this project folder. Keep it short and current rather than exhaustive; update it
at the end of a work session or a meaningful chunk of progress, then commit + push so the next `git pull`
carries it over. Never put secrets/credentials here — this file is as visible as the rest of this public repo.

**The user is not a technical/developer user.** Give step-by-step, explicit guidance for anything in a
third-party dashboard (GitHub, Vercel, Supabase) — name the actual platform, never just "the dashboard."
Screenshots of their own screen are the most reliable way they report state back.

## Session log

Plain-English recap of each work session, newest first — this is for the user to read back, not just for
Claude's context. Add a new dated entry here at the end of a session; don't rewrite old ones.

**2026-10-15** — Set up this file so work survives switching between the work laptop and the user's home
laptop (both already have Claude Code + this repo). Separately, checked today's driver-side pages on an actual
phone-width screen and found the mobile menu button (the hamburger icon that opens the side navigation on a
phone) was invisible-but-unclickable on every dashboard page, for both customer and driver — fixed with a
one-line CSS change in `DashboardShell.tsx`. Confirmed fixed and pushed live.

## Stack and deploy

- Next.js 16 (static export) + Supabase (Auth, Postgres, Storage, Realtime, one Edge Function). Repo:
  https://github.com/EmieBlue/hauliocargo (public). Live at https://hauliocargo.vercel.app (Vercel; moved off
  Netlify earlier in the project).
- Supabase project: `jevraebgmgllciqpmnag`. Migrations live in `supabase/*.sql`, numbered sequentially, each
  safe to re-run. Established workflow: write migration → user runs it in the Supabase SQL Editor → verify
  read-only via an anon-key curl against the REST API (200 = exists, 400/42703 = missing) → only then push code
  that depends on it.

## What's built and shipped (as of 2026-10-15)

- Full customer registration/auth, dashboard, and booking forms (Move With You / Send / Receive), DB-backed.
- Driver side: application/registration, a dashboard with an editable vehicle "car card" (photo upload,
  stat tiles), a Jobs page (accept/decline/cancel with required reasons, start/deliver flow), a History page
  (completed/declined/cancelled, snapshot-based so it survives RLS visibility changes), and a driver ratings
  system (customers rate completed rides; average shown in the driver's own side menu).
- Role-aware `/dashboard/profile` page for both customer and driver (editable fields + password change).
- Real-time chat between a matched customer and driver, scoped per booking (Supabase Realtime + RLS).
- Driver self-edit of their own application is locked against self-approving verification status via a
  `BEFORE UPDATE` trigger (`lock_driver_application_status`, migration 019) — they can edit vehicle/licence
  fields but not `status`.

## Fixed today (2026-10-15)

Found via a real phone-width (390×844) Playwright check, not just reasoning about Tailwind breakpoints: the
mobile hamburger button that opens the side-menu drawer was present and styled correctly but **completely
unclickable** on every dashboard page with a sidebar (both customer and driver), on any screen under `lg`. Root
cause: `position: sticky` always creates its own stacking/paint context regardless of z-index, so the sidebar
wrapper in `components/auth/DashboardShell.tsx` — including the fixed button living inside it — was silently
losing to the later-in-DOM page content next to it. Fixed with one line (`z-30` on the sticky wrapper),
verified via Playwright hit-testing and a click-through screenshot. This was a pre-existing bug, not something
introduced by the driver-side work — just never checked on an actual phone-width screen until now.

## Known open items (not yet fixed, flagged but not blocking)

- `profiles`' "update own profile" RLS policy has no `WITH CHECK`, so a user could technically change their own
  `role` via a direct API call. Low priority until a real admin panel exists — fix then.
- Driver verification is still manual via the Supabase Table Editor/SQL Editor — no admin panel yet.
- SQLTools → Supabase Postgres connection was being set up for local DB browsing, then explicitly paused by the
  user ("hold on to the SQL for now") — not resumed since. Revisit only if the user brings it up again.

## Working patterns established this project (apply these without being asked)

- Mobile-first Tailwind: single `flex-col` column by default, `sm:`/`lg:` breakpoints only *add* multi-column
  layout on wider screens. Still worth an actual phone-width Playwright check for anything involving `fixed`/
  `sticky` positioning or overlapping layers — the mobile-nav bug above shows "looks right by class" isn't
  the same as "is actually clickable."
  - A legibility trap recurs on pages using `DashboardShell`'s `clearBackdrop`: text placed directly on it
  without a solid card/panel behind it goes illegible over bright parts of the background photo.
- Never trust a step is done from a description alone — verify directly (fetch the live URL, curl the REST
  API, screenshot via Playwright) before telling the user something works.
- `useSearchParams` requires a `Suspense` boundary (Next.js App Router rule, hit repeatedly early on).
- Git push 403s on this machine are almost always a stale cached credential, not a real permissions problem —
  fixed by clearing the cached Windows credential for `git:https://github.com` and retrying with an
  interactive sign-in. Occasional "could not resolve host" errors have been a flaky local router DNS resolver,
  not a real outage — plain retry fixes it.
- Shared *data* logic lives in `lib/*.ts` (reused across customer/driver); *presentation* is deliberately
  duplicated per page where the two roles' visual systems differ (dark dashboard tokens vs. the cream palette
  used by Move With You and the bookings page) rather than forced into one generic shared component.

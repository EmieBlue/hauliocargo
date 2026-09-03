# HaulioCargo — Introduction / Landing Page

> Move it. We'll handle it.

The public landing page for HaulioCargo, a cargo and truck-booking platform.
**This is the marketing page only.** No dashboard, booking flow, driver system,
payments, auth or database exists yet — see [Not built yet](#not-built-yet).

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
npx eslint .     # lint
npx tsc --noEmit # typecheck
```

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · React Three Fiber + drei · lucide-react

> **React is pinned to `~19.2`.** React Three Fiber v9's peer range is
> `>=19 <19.3`; letting React float to 19.3 will break the 3D scenes.

## Layout

```
app/
  layout.tsx        fonts, metadata, skip link, MotionConfig
  page.tsx          section order — the only place it lives
  globals.css       design tokens (@theme), keyframes, base styles
components/
  layout/           Navbar · MobileMenu · Footer
  sections/         Hero · ActionTrio · CargoScene · HowItWorks · SmartLoad · Trust
  three/            the 3D system (see below)
  ui/               Button · Card · Reveal · SectionHeading · Badge · Logo · SocialIcon
lib/
  site.ts           nav, footer, copy and every destination
  motion.ts         shared easing + variants
  useDeviceTier.ts · usePointerParallax.ts · useSettledReducedMotion.ts · cn.ts
```

### The 3D system

Each scene renders one of two ways, chosen at runtime by `useDeviceTier()`:

| | Used when | What renders |
|---|---|---|
| **WebGL** | Capable device, motion allowed | `HeroCanvas` / `CargoCanvas` — real 3D, lighting, reflections, camera parallax |
| **Fallback** | Reduced motion, no WebGL, ≤4GB RAM, or a narrow screen with ≤6 cores | `HeroFallback` / `CargoFallback` — layered SVG in CSS 3D |

`AdaptiveScene` picks between them and crossfades, so the upgrade is never a
visible pop. The fallback is what the server renders, so **three.js is never
downloaded on a low-tier device.**

The truck is a **straight box body on a cab-over chassis** (Fuso Canter / Isuzu
N-series mould) — white cab, yellow box — modelled from primitives in
`TruckModel.tsx`. No external asset, no licence to track. Every dimension lives
in that one file, so it is the only thing to replace if a real `.glb` is ever
commissioned. Its `HAULIOCARGO` livery is painted to a canvas at runtime by
`BoxLivery.tsx`: no image to ship, no font file, no network fetch.

> **`TruckModel.tsx` and `TruckSilhouette.tsx` are two drawings of one vehicle.**
> Change the shape, proportions or colours in one and you must change the other,
> or the crossfade visibly morphs one truck into another — and the SVG is the
> only truck reduced-motion and low-tier devices ever see.
>
> Four proportions make it read as a real vehicle rather than a toy, and each
> has been got wrong at least once: the box **dominates** the length; the box is
> a **plain wall behind the cab** with nothing overhanging forward above it (that
> would be a Luton, a different body type); the cab is a **true cab-over** —
> flat front, no bonnet, windscreen filling that face; and the wheels **tuck
> just under** a body carried on visible chassis, with a dark side skirt running
> the box underside. The last one is the easiest to lose and the most damaging.
>
> One recurring trap: the cab is a `RoundedBox`, so its *flat* front face is
> smaller than its overall size by the corner radius. A windscreen sized to the
> full face pokes out past the rounded corners and reads as a slab floating off
> the front. The same applies to the door glass on the flanks.

Reflections come from an in-scene `<Environment>` built out of `<Lightformer>`s
and baked once, so there is **no runtime network dependency** — no HDRI fetched
from a CDN.

Both canvases stop rendering entirely while scrolled out of view, so only the
visible scene ever costs anything.

## Changing things

- **Copy, nav links, footer links** → `lib/site.ts`
- **Colours, type, spacing, easing** → the `@theme` block in `app/globals.css`
- **Section order** → `app/page.tsx`
- **Where a CTA points** → the `ROUTES` map in `lib/site.ts`

### Two Tailwind gotchas this codebase has already hit

1. **Never pass a `position` utility into a component that sets its own.**
   `cn("relative", "absolute inset-0")` emits both classes; Tailwind's cascade
   makes `relative` win, collapsing the element to zero height.
2. **`hidden` loses to a base `inline-flex`.** `<Button>` sets `inline-flex`
   itself, so `className="hidden sm:inline-flex"` will not hide it — put the
   visibility on a wrapper element instead.

## Not built yet

Deliberately absent, and the page never pretends otherwise:

- **Auth, booking, dashboards, payments, admin.** Every CTA resolves to an
  on-page anchor via `ROUTES` in `lib/site.ts`. Nothing 404s. When the real
  pages land, change the values there — no component needs to be touched.
- **Haulio SmartLoad™.** The section is a labelled concept preview: no upload
  control, no model, `COMING SOON` on the badge and a disclaimer beneath it.
- **Statistics.** There are no driver counts, delivery totals, testimonials or
  partner logos anywhere, because HaulioCargo has not launched. Please keep it
  that way until the numbers are real.
- **Privacy Policy / Terms pages.** Footer links are `#` placeholders.
- **Social accounts.** Footer icons are `#` placeholders.

## Accessibility & responsiveness

Semantic landmarks, one `h1`, a skip link, a focus-trapped mobile menu with
`Esc` to close and scroll lock, visible yellow focus rings, and ≥44px touch
targets. Decorative canvases are `aria-hidden`; the hero's meaning is carried by
real text. Verified with no horizontal overflow from 360px to 1920px.

"use client";

const IMAGE = "/brand/dashboard-fleet.jpg";

/**
 * The dashboard's branded fleet photo — `fixed` to the viewport, mounted
 * once inside `DashboardShell` so every page that uses the shell gets it,
 * same "mount once, sibling to the content" approach as the marketing
 * site's `VideoBackdrop`. Static image, so none of that component's
 * video/poster/reduced-motion branching is needed here — just the image
 * plus a dark scrim + grain treatment, since the dashboard's text assumes a
 * dark backdrop and would lose legibility against the raw photo underneath.
 * Scrim is 80%, noticeably heavier than `VideoBackdrop`'s 55% — this photo's
 * bright sky needs it; confirmed empirically via screenshots at several
 * strengths (55/70/80/88%) before landing here, same approach used to tune
 * the site's topbar transparency earlier.
 *
 * Deliberately no negative z-index, same reasoning as `VideoBackdrop`:
 * Chromium paints the page's own background-color canvas *below* a `fixed`
 * element that has a negative z-index, regardless of the rest of the
 * stacking order — plain `z-index: auto` plus mounting first in the DOM is
 * what actually keeps this above that fill but below later page content.
 */
export function DashboardBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-ink-950" />
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMAGE})` }} />
      <div className="absolute inset-0 bg-ink-950/80" />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 620px at 68% 30%, rgba(255,170,0,0.06), transparent 62%), radial-gradient(760px 520px at 10% 76%, rgba(70,90,130,0.1), transparent 65%)",
        }}
      />
      <div className="grain-layer absolute inset-0 opacity-[0.15]" />
    </div>
  );
}

"use client";

import { useSettledReducedMotion } from "@/lib/useSettledReducedMotion";

const POSTER = "/videos/haulio-bg-poster.jpg";

// Only matters in a portrait viewport, where `cover` crops the 16:9 footage
// down to a narrow slice — keeps the truck (right of centre) in that slice.
const FOCAL = "66% 50%";

/**
 * The site's looping footage, `fixed` to the viewport rather than scoped to
 * one section — deliberately outside any `isolate`d ancestor (e.g. `Hero`),
 * since that would trap it in that ancestor's own stacking context and stop
 * it from painting behind *later* siblings. Mount once per page, as a
 * sibling at the root, not nested inside the content it should sit behind.
 *
 * The scrim is tuned for legibility against arbitrary content further down a
 * page (cards, form fields, body text) — not just a hero headline.
 *
 * Deliberately no negative z-index: `<body>`'s own background color gets
 * propagated to paint the page canvas (a CSS/HTML quirk), and in Chromium
 * that canvas fill sits *below* any `position: fixed` element that has a
 * negative z-index — invisible no matter how the rest of the stack is laid
 * out. Plain `z-index: auto` plus mounting this first in the DOM (see call
 * sites) is what correctly keeps it above that fill but below every other
 * (later, `relative`) section on the page.
 */
export function VideoBackdrop() {
  const reduced = useSettledReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-ink-950" />

      {/*
        A still frame of the footage underneath the video, so the page is never
        a plain dark screen: it shows while the (large) video buffers on mobile
        data, stays put when a phone refuses to autoplay (iOS Low Power Mode),
        and is all a visitor with "Reduce Motion" on gets — a still respects
        that setting where a looping video would not.
      */}
      <div
        className="absolute inset-0 bg-cover"
        style={{ backgroundImage: `url(${POSTER})`, backgroundPosition: FOCAL }}
      />

      {!reduced ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          poster={POSTER}
          className="absolute inset-0 size-full object-cover"
          style={{ objectPosition: FOCAL }}
          src="/videos/haulio-bg.mp4"
        />
      ) : null}

      <div className="absolute inset-0 bg-ink-950/55" />
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

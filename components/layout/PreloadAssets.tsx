"use client";

import ReactDOM from "react-dom";

/**
 * Primes the small images that must never feel slow to appear, before the
 * component that actually renders them has even mounted:
 *
 * - the video's poster photo (`VideoBackdrop`) — the always-visible fallback
 *   while the 13MB video itself is still buffering or blocked;
 * - both navbar mark states (`Logo`) — swapped reactively on scroll, so if
 *   the dark version hasn't been fetched yet the swap visibly lags.
 *
 * `ReactDOM.preload` is the documented App Router way to emit a real
 * `<link rel="preload">` into `<head>` (see `node_modules/next/dist/docs`,
 * generate-metadata.md "Resource hints") — it hoists there even though this
 * renders in `<body>`. Mounted once, in the root layout, so every page gets
 * the same head start regardless of which page a visitor lands on first.
 */
export function PreloadAssets() {
  ReactDOM.preload("/videos/haulio-bg-poster.jpg", { as: "image", fetchPriority: "high" });
  ReactDOM.preload("/brand/nav-mark.png", { as: "image" });
  ReactDOM.preload("/brand/nav-mark-dark.png", { as: "image" });
  return null;
}

"use client";

import dynamic from "next/dynamic";
import type { LocationPoint } from "./MoveMap";

/**
 * `ssr: false` is only legal inside a Client Component, which is the main
 * reason this thin wrapper exists — same reasoning, same shape, as
 * `components/three/HeroScene.tsx` wrapping its WebGL canvas. Keeps
 * `mapbox-gl` (which touches `window`) out of the static-export prerender
 * pass entirely, loaded only once a browser actually renders this panel.
 */
const MoveMap = dynamic(() => import("./MoveMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-full min-h-[22rem] animate-pulse rounded-2xl border"
      style={{ borderColor: "rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.4)" }}
    />
  ),
});

export function MoveMapPanel({
  pickup,
  dropoff,
  livePosition,
  className,
  defaultCenter,
  emptyMessage,
  onRouteDistance,
}: {
  pickup: LocationPoint | null;
  dropoff: LocationPoint | null;
  livePosition?: LocationPoint | null;
  className?: string;
  defaultCenter?: [number, number];
  emptyMessage?: string;
  onRouteDistance?: (km: number | null) => void;
}) {
  return (
    <MoveMap
      pickup={pickup}
      dropoff={dropoff}
      livePosition={livePosition}
      className={className}
      defaultCenter={defaultCenter}
      emptyMessage={emptyMessage}
      onRouteDistance={onRouteDistance}
    />
  );
}

/**
 * A small "Live · updated HH:MM:SS" line to sit above a `MoveMapPanel`
 * showing `livePosition` — so a stale dot (driver closed their tab) doesn't
 * read as currently accurate. An absolute time, not a ticking "Xs ago" —
 * that would mean calling `Date.now()` during render, which React's purity
 * rules (correctly) reject; this only ever formats the fixed `updatedAt` it
 * was given.
 */
export function LiveLocationNote({ updatedAt }: { updatedAt: string | null }) {
  if (!updatedAt) return null;

  const time = new Date(updatedAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <p className="mb-2 flex items-center gap-1.5 text-[0.78rem] font-medium text-muted">
      <span className="size-1.5 rounded-full bg-brand" aria-hidden />
      Live position · updated {time}
    </p>
  );
}

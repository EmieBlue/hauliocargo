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
  className,
  defaultCenter,
  emptyMessage,
  onRouteDistance,
}: {
  pickup: LocationPoint | null;
  dropoff: LocationPoint | null;
  className?: string;
  defaultCenter?: [number, number];
  emptyMessage?: string;
  onRouteDistance?: (km: number | null) => void;
}) {
  return (
    <MoveMap
      pickup={pickup}
      dropoff={dropoff}
      className={className}
      defaultCenter={defaultCenter}
      emptyMessage={emptyMessage}
      onRouteDistance={onRouteDistance}
    />
  );
}

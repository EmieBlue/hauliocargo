"use client";

import dynamic from "next/dynamic";
import { AdaptiveScene } from "./AdaptiveScene";
import HeroFallback from "./HeroFallback";

/**
 * `ssr: false` is only legal inside a Client Component, which is the main
 * reason this thin wrapper exists. It also keeps three.js out of the server
 * payload — and off low-tier devices entirely.
 */
const HeroCanvas = dynamic(() => import("./HeroCanvas"), {
  ssr: false,
  loading: () => null,
});

export function HeroScene({ className }: { className?: string }) {
  return (
    <AdaptiveScene className={className} Canvas={HeroCanvas} Fallback={HeroFallback} />
  );
}

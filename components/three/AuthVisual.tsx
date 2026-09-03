"use client";

import dynamic from "next/dynamic";
import { AdaptiveScene } from "./AdaptiveScene";
import AuthFallback from "./AuthFallback";

const AuthCanvas = dynamic(() => import("./AuthCanvas"), {
  ssr: false,
  loading: () => null,
});

export function AuthVisual({ className }: { className?: string }) {
  return (
    <AdaptiveScene className={className} Canvas={AuthCanvas} Fallback={AuthFallback} />
  );
}

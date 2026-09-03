"use client";

import dynamic from "next/dynamic";
import { AdaptiveScene } from "./AdaptiveScene";
import CargoFallback from "./CargoFallback";

const CargoCanvas = dynamic(() => import("./CargoCanvas"), {
  ssr: false,
  loading: () => null,
});

export function CargoStage({ className }: { className?: string }) {
  return (
    <AdaptiveScene className={className} Canvas={CargoCanvas} Fallback={CargoFallback} />
  );
}

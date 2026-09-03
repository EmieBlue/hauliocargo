"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { cn } from "@/lib/cn";
import { useDeviceTier } from "@/lib/useDeviceTier";

type AdaptiveSceneProps = {
  className?: string;
  /** Lazy WebGL scene. Must be created with `dynamic(..., { ssr: false })`. */
  Canvas: ComponentType<{ onReady?: () => void }>;
  /** Rendered on the server, on weak devices, and while the canvas boots. */
  Fallback: ComponentType;
};

/**
 * Chooses between a WebGL scene and its lightweight stand-in, then crossfades
 * so the upgrade is never a visible pop.
 *
 * The caller supplies positioning via `className`. Do not add a `relative`
 * here: it would collide with an incoming `absolute` and — since Tailwind emits
 * `.relative` after `.absolute` — win, collapsing the box to zero height.
 */
export function AdaptiveScene({
  className,
  Canvas,
  Fallback,
}: AdaptiveSceneProps) {
  const tier = useDeviceTier();
  const [canvasReady, setCanvasReady] = useState(false);
  const [showFallback, setShowFallback] = useState(true);

  const handleReady = useCallback(() => setCanvasReady(true), []);

  useEffect(() => {
    if (!canvasReady) return;
    const timer = window.setTimeout(() => setShowFallback(false), 700);
    return () => window.clearTimeout(timer);
  }, [canvasReady]);

  const useCanvas = tier === "high";

  return (
    <div className={className}>
      {useCanvas ? (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-brand",
            canvasReady ? "opacity-100" : "opacity-0",
          )}
        >
          <Canvas onReady={handleReady} />
        </div>
      ) : null}

      {(!useCanvas || showFallback) && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-700 ease-brand",
            canvasReady ? "opacity-0" : "opacity-100",
          )}
        >
          <Fallback />
        </div>
      )}
    </div>
  );
}

"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type SceneShellProps = {
  children: ReactNode;
  className?: string;
  cameraPosition: [number, number, number];
  fov?: number;
  /** [colour, near, far] */
  fog?: [string, number, number];
  dprMax?: number;
  /** Fires once the GL context exists, so a fallback can be crossfaded out. */
  onReady?: () => void;
};

/**
 * Common wrapper for every WebGL scene on the page.
 *
 * The canvas is transparent so CSS glows behind it show through, and rendering
 * stops entirely while the section is scrolled out of view — with two scenes on
 * one page, only the visible one ever costs anything.
 */
export function SceneShell({
  children,
  className,
  cameraPosition,
  fov = 32,
  fog,
  dprMax = 1.75,
  onReady,
}: SceneShellProps) {
  const holder = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [narrow, setNarrow] = useState(false);

  /*
   * Phones now reach this scene, so cap their pixel ratio harder: a 3x phone
   * screen renders ~9x the fragments of a 1x one, which is where the battery
   * and the frame budget actually go.
   */
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const sync = () => setNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const element = holder.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "120px" },
    );
    observer.observe(element);

    const handleVisibility = () => {
      if (document.hidden) setVisible(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div ref={holder} className={cn("h-full w-full", className)} aria-hidden>
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={[1, narrow ? Math.min(dprMax, 1.4) : dprMax]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{ position: cameraPosition, fov, near: 0.1, far: 140 }}
        onCreated={onReady}
      >
        {fog ? <fog attach="fog" args={fog} /> : null}
        {children}
      </Canvas>
    </div>
  );
}

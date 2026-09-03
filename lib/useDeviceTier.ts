"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "high" | "low";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  const motionQuery = window.matchMedia(MOTION_QUERY);
  motionQuery.addEventListener("change", onChange);
  return () => motionQuery.removeEventListener("change", onChange);
}

/**
 * Thresholds are deliberately generous.
 *
 * These previously read `deviceMemory <= 4` and `narrow && cores <= 6`, which
 * between them excluded almost every phone ever made: iPhones report six cores
 * or fewer, so no iPhone could ever reach the 3D scene, and 4GB covers most
 * mid-range Android. A modern phone drives this scene comfortably. Screen width
 * is no longer part of the decision at all — a small screen is not a slow one.
 */
function getSnapshot(): DeviceTier {
  // A stated motion preference outranks raw capability.
  if (window.matchMedia(MOTION_QUERY).matches) return "low";

  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  if (typeof memory === "number" && memory <= 3) return "low";

  // Absent (Safari never reports it), assume capable rather than assume weak.
  const cores = navigator.hardwareConcurrency ?? 8;
  if (cores <= 4) return "low";

  return supportsWebGL() ? "high" : "low";
}

/**
 * The server renders the cheap scene. Anything else would ship a canvas to a
 * device that may not be able to drive it.
 */
function getServerSnapshot(): DeviceTier {
  return "low";
}

/**
 * Whether this device should get the real WebGL scene or the lightweight
 * stand-in.
 *
 * Returns "low" during SSR and hydration, then settles to the real answer —
 * so the trees match, and a phone never downloads three.js at all.
 */
export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Cached because `getSnapshot` runs on every render: probing with a fresh
 * canvas each time leaks WebGL contexts until the browser starts dropping the
 * oldest one — which is the page's own hero scene.
 */
let webglSupport: boolean | null = null;

function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ?? canvas.getContext("webgl");

    // Hand the probe context straight back; they are a limited resource.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    webglSupport = Boolean(context);
  } catch {
    webglSupport = false;
  }

  return webglSupport;
}

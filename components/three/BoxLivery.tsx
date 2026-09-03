"use client";

import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { MAT } from "./palette";

/**
 * HAULIOCARGO wordmark on the cargo box flanks.
 *
 * Painted to a canvas at runtime rather than loaded as an image or a 3D font:
 * no asset to ship, no network fetch, and it recolours with the palette.
 *
 * It lives on two thin planes standing just proud of the box rather than on the
 * `RoundedBox` itself — that geometry is an extrusion, and its UVs do not map
 * predictably onto the flanks.
 */

const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 425;

/** Matches the plane below: 4.1 / 1.7 ≈ 2.41, so the text is never stretched. */
const PLANE_WIDTH = 4.1;
const PLANE_HEIGHT = 1.7;

function paintLivery(): CanvasTexture | null {
  // The scene is client-only, but this keeps the module import-safe anywhere.
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = MAT.bodyBox;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  /*
   * A system stack, deliberately. `next/font` exposes a generated family name,
   * so asking the canvas for "Sora" would silently fall back to a default.
   */
  const stack = `system-ui, "Segoe UI", Roboto, Arial, sans-serif`;

  ctx.fillStyle = "#0d0d10";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `800 104px ${stack}`;
  ctx.fillText("HAULIOCARGO", 92, 204);

  // Rule and strapline beneath, as fleet liveries carry
  ctx.fillRect(94, 238, 380, 6);

  ctx.font = `600 38px ${stack}`;
  ctx.fillText("CARGO & TRUCK BOOKING", 94, 300);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function BoxLivery({
  position,
  z,
}: {
  /** Centre of the flank panel, in x/y. */
  position: [number, number];
  /** Half-width of the box plus a hair, so the panel sits proud of the paint. */
  z: number;
}) {
  // Inline arrow, not a bare reference: the React Compiler's `use-memo` rule
  // only tracks dependencies through an inline function expression.
  const texture = useMemo(() => paintLivery(), []);

  useEffect(() => () => texture?.dispose(), [texture]);

  if (!texture) return null;

  const [x, y] = position;

  return (
    <>
      {/* Near flank */}
      <mesh position={[x, y, z]}>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
        <meshStandardMaterial map={texture} roughness={0.42} metalness={0.05} />
      </mesh>

      {/* Far flank — rotated so the wordmark reads forwards, not mirrored */}
      <mesh position={[x, y, -z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
        <meshStandardMaterial map={texture} roughness={0.42} metalness={0.05} />
      </mesh>
    </>
  );
}

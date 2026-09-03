"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { MAT } from "./palette";

const DASH_COUNT = 18;
const DASH_SPACING = 2.6;
const SPAN = DASH_COUNT * DASH_SPACING;

type GroundPlaneProps = {
  /** World units per second the road slides backwards. */
  speed?: number;
  /** Reflection resolution. Drop it on weaker hardware. */
  resolution?: number;
};

/**
 * Wet-asphalt floor. The reflection anchors the truck in space; the scrolling
 * lane dashes are what actually sell the movement.
 */
export function GroundPlane({ speed = 13, resolution = 512 }: GroundPlaneProps) {
  const dashes = useRef<Group>(null);

  const offsets = useMemo(
    () => Array.from({ length: DASH_COUNT }, (_, i) => i * DASH_SPACING - SPAN / 2),
    [],
  );

  useFrame((_, delta) => {
    if (!dashes.current) return;
    for (const dash of dashes.current.children) {
      dash.position.x -= speed * delta;
      if (dash.position.x < -SPAN / 2) dash.position.x += SPAN;
    }
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[62, 30]} />
        <MeshReflectorMaterial
          resolution={resolution}
          blur={[420, 110]}
          mixBlur={14}
          mixStrength={7}
          mirror={0.3}
          depthScale={1.1}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.3}
          color={MAT.ink}
          /* Low metalness: a metallic floor mirrors the warm environment map
             and turns the whole lower frame muddy brown. */
          metalness={0.12}
          roughness={0.92}
          envMapIntensity={0.15}
        />
      </mesh>

      {/* Lane dashes */}
      <group ref={dashes}>
        {offsets.map((x) => (
          <mesh key={x} position={[x, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.35, 0.14]} />
            <meshBasicMaterial color={MAT.brand} toneMapped={false} opacity={0.5} transparent />
          </mesh>
        ))}
      </group>

      {/* Static lane edges. Kept short and dim — a long bright rule reads as a
          stray line slashing across the hero. */}
      {[5.6, -5.6].map((z) => (
        <mesh key={z} position={[0, 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[44, 0.05]} />
          <meshBasicMaterial color={MAT.brand} toneMapped={false} opacity={0.1} transparent />
        </mesh>
      ))}
    </group>
  );
}

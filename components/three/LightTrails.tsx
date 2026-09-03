"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { MAT } from "./palette";

type Streak = {
  z: number;
  y: number;
  length: number;
  speed: number;
  offset: number;
  opacity: number;
  warm: boolean;
};

const RANGE = 46;

/**
 * Emissive streaks racing past the truck. Deterministic (no Math.random at
 * module scope) so the server and client agree and the look stays repeatable.
 */
export function LightTrails({ count = 16 }: { count?: number }) {
  const group = useRef<Group>(null);

  const streaks = useMemo<Streak[]>(() => {
    // Cheap deterministic hash — same layout every load.
    const rand = (n: number) => {
      const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return value - Math.floor(value);
    };

    return Array.from({ length: count }, (_, i) => ({
      z: (rand(i) - 0.5) * 22,
      y: 0.35 + rand(i + 40) * 3.6,
      length: 2.4 + rand(i + 80) * 5.5,
      speed: 16 + rand(i + 120) * 22,
      offset: rand(i + 160) * RANGE,
      opacity: 0.12 + rand(i + 200) * 0.3,
      warm: rand(i + 240) > 0.45,
    }));
  }, [count]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((streak, index) => {
      streak.position.x -= streaks[index].speed * delta;
      if (streak.position.x < -RANGE / 2) streak.position.x += RANGE;
    });
  });

  return (
    <group ref={group}>
      {streaks.map((streak, index) => (
        <mesh
          key={index}
          position={[streak.offset - RANGE / 2, streak.y, streak.z]}
        >
          <boxGeometry args={[streak.length, 0.022, 0.022]} />
          <meshBasicMaterial
            color={streak.warm ? MAT.brand : MAT.trail}
            toneMapped={false}
            transparent
            opacity={streak.opacity}
          />
        </mesh>
      ))}
    </group>
  );
}

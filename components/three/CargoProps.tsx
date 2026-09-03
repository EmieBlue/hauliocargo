"use client";

import { Float, RoundedBox } from "@react-three/drei";
import type { ReactNode } from "react";
import { MAT } from "./palette";

/**
 * The things people actually move, modelled from primitives: boxes, a sofa, a
 * refrigerator, a chair and a TV. Each drifts gently so the scene has depth
 * without ever competing with the truck.
 */

type PropProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
};

/** Shared drift wrapper — one place to tune how much everything floats. */
function Drift({
  children,
  speed = 1.1,
  intensity = 0.6,
}: {
  children: ReactNode;
  speed?: number;
  intensity?: number;
}) {
  return (
    <Float speed={speed} rotationIntensity={intensity * 0.35} floatIntensity={intensity}>
      {children}
    </Float>
  );
}

export function CargoBox({ position, rotation, scale = 1 }: PropProps) {
  return (
    <Drift speed={1.3}>
      <group position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[1.25, 1.05, 1.25]} radius={0.05}>
          <meshStandardMaterial color="#8a6a3f" metalness={0.05} roughness={0.85} />
        </RoundedBox>
        {/* Packing tape */}
        <mesh position={[0, 0.53, 0]}>
          <boxGeometry args={[0.22, 0.02, 1.28]} />
          <meshStandardMaterial color="#d8c7a5" roughness={0.7} />
        </mesh>
        {/* Yellow routing label */}
        <mesh position={[0, 0.05, 0.635]}>
          <boxGeometry args={[0.5, 0.32, 0.01]} />
          <meshStandardMaterial
            color={MAT.brand}
            emissive={MAT.brand}
            emissiveIntensity={0.35}
            roughness={0.5}
          />
        </mesh>
      </group>
    </Drift>
  );
}

export function Sofa({ position, rotation, scale = 1 }: PropProps) {
  const upholstery = (
    <meshStandardMaterial color="#3d4354" metalness={0.05} roughness={0.9} />
  );

  return (
    <Drift speed={0.9} intensity={0.5}>
      <group position={position} rotation={rotation} scale={scale}>
        {/* Seat base */}
        <RoundedBox args={[2.6, 0.42, 1.1]} radius={0.14} position={[0, 0, 0]}>
          {upholstery}
        </RoundedBox>
        {/* Backrest */}
        <RoundedBox args={[2.6, 0.9, 0.28]} radius={0.12} position={[0, 0.42, -0.41]}>
          {upholstery}
        </RoundedBox>
        {/* Arms */}
        {[1.31, -1.31].map((x) => (
          <RoundedBox key={x} args={[0.26, 0.62, 1.1]} radius={0.11} position={[x, 0.2, 0]}>
            {upholstery}
          </RoundedBox>
        ))}
        {/* Cushions */}
        {[-0.62, 0.62].map((x) => (
          <RoundedBox key={x} args={[1.14, 0.2, 0.92]} radius={0.08} position={[x, 0.28, 0.05]}>
            <meshStandardMaterial color="#4a5163" roughness={0.88} />
          </RoundedBox>
        ))}
        {/* Legs */}
        {[
          [1.1, -0.36, 0.42],
          [-1.1, -0.36, 0.42],
          [1.1, -0.36, -0.42],
          [-1.1, -0.36, -0.42],
        ].map(([x, y, z]) => (
          <mesh key={`${x}-${z}`} position={[x, y, z]}>
            <cylinderGeometry args={[0.06, 0.05, 0.3, 10]} />
            <meshStandardMaterial color="#2a2118" roughness={0.6} metalness={0.2} />
          </mesh>
        ))}
      </group>
    </Drift>
  );
}

export function Refrigerator({ position, rotation, scale = 1 }: PropProps) {
  return (
    <Drift speed={1} intensity={0.55}>
      <group position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[1.15, 2.35, 1.05]} radius={0.09}>
          <meshStandardMaterial color="#c8ccd4" metalness={0.85} roughness={0.28} />
        </RoundedBox>
        {/* Freezer / fridge split */}
        <mesh position={[0, 0.42, 0.53]}>
          <boxGeometry args={[1.13, 0.03, 0.02]} />
          <meshStandardMaterial color="#7d838f" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Handles */}
        {[0.95, -0.35].map((y) => (
          <mesh key={y} position={[0.42, y, 0.56]}>
            <boxGeometry args={[0.05, 0.55, 0.05]} />
            <meshStandardMaterial color="#5b6069" metalness={0.9} roughness={0.25} />
          </mesh>
        ))}
      </group>
    </Drift>
  );
}

export function Chair({ position, rotation, scale = 1 }: PropProps) {
  const wood = <meshStandardMaterial color="#6b4a2c" roughness={0.75} metalness={0.08} />;

  return (
    <Drift speed={1.5} intensity={0.75}>
      <group position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[0.9, 0.12, 0.9]} radius={0.04} position={[0, 0, 0]}>
          {wood}
        </RoundedBox>
        <RoundedBox args={[0.9, 1.0, 0.11]} radius={0.05} position={[0, 0.55, -0.4]}>
          {wood}
        </RoundedBox>
        {[
          [0.38, -0.45, 0.38],
          [-0.38, -0.45, 0.38],
          [0.38, -0.45, -0.38],
          [-0.38, -0.45, -0.38],
        ].map(([x, y, z]) => (
          <mesh key={`${x}-${z}`} position={[x, y, z]}>
            <boxGeometry args={[0.09, 0.9, 0.09]} />
            {wood}
          </mesh>
        ))}
      </group>
    </Drift>
  );
}

export function Television({ position, rotation, scale = 1 }: PropProps) {
  return (
    <Drift speed={1.2} intensity={0.65}>
      <group position={position} rotation={rotation} scale={scale}>
        <RoundedBox args={[2.1, 1.25, 0.08]} radius={0.03}>
          <meshStandardMaterial color="#1a1a1f" metalness={0.6} roughness={0.35} />
        </RoundedBox>
        {/* Screen */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[1.98, 1.13]} />
          <meshStandardMaterial
            color="#1a2733"
            metalness={0.85}
            roughness={0.14}
            envMapIntensity={3}
          />
        </mesh>
        {/* Stand */}
        <mesh position={[0, -0.78, 0]}>
          <boxGeometry args={[0.16, 0.32, 0.16]} />
          <meshStandardMaterial color="#2a2a31" metalness={0.7} roughness={0.35} />
        </mesh>
        <RoundedBox args={[1.0, 0.07, 0.36]} radius={0.03} position={[0, -0.96, 0]}>
          <meshStandardMaterial color="#2a2a31" metalness={0.7} roughness={0.35} />
        </RoundedBox>
      </group>
    </Drift>
  );
}

"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { BoxLivery } from "./BoxLivery";
import { MAT } from "./palette";

/**
 * HaulioCargo hauler — a straight box body on a cab-over chassis, in the
 * Fuso Canter / Isuzu N-series mould.
 *
 * Deliberately self-contained: every dimension lives in this file, so this is
 * the only thing to replace if a real .glb is commissioned later. Nothing else
 * in the scene reaches inside it.
 *
 * Orientation: the truck faces +X. Length runs along X, height Y, width Z.
 *
 * Four proportions carry the whole thing, and each has been got wrong at least
 * once:
 *   1. The box dominates — roughly two thirds of the length, and by far the
 *      largest mass.
 *   2. The box is a plain wall standing *behind* the cab. Nothing overhangs
 *      forward above it — that would be a Luton, a different body type.
 *   3. The cab is a true cab-over: flat front, no bonnet, and a windscreen
 *      filling most of that front face.
 *   4. The wheels tuck just under a body carried on a visible chassis, with a
 *      dark side skirt running the length of the box underside.
 */

/** Two axles. The front sits under the rear of the cab, as on a Canter. */
const FRONT_AXLE = 2.1;
const REAR_AXLE = -1.75;
const TRACK = 1.0;
const WHEEL_RADIUS = 0.48;

/** Box envelope, shared by the paint, the rails and the livery panels. */
const BOX_HALF_WIDTH = 1.175;
const BOX_FLOOR = 1.05;
const BOX_ROOF = 3.55;
const BOX_REAR = -3.55;

const WHEEL_POSITIONS: Array<[number, number, number]> = [
  [FRONT_AXLE, WHEEL_RADIUS, TRACK],
  [FRONT_AXLE, WHEEL_RADIUS, -TRACK],
  [REAR_AXLE, WHEEL_RADIUS, TRACK],
  [REAR_AXLE, WHEEL_RADIUS, -TRACK],
];

type TruckModelProps = {
  /** Wheel revolutions per second. 0 parks the truck. */
  speed?: number;
  /** Suspension bob and body roll. */
  bob?: boolean;
};

export function TruckModel({ speed = 1.9, bob = true }: TruckModelProps) {
  const root = useRef<Group>(null);
  const wheels = useRef<Array<Group | null>>([]);

  useFrame((state, delta) => {
    const spin = speed * Math.PI * 2 * delta;
    for (const wheel of wheels.current) {
      if (wheel) wheel.rotation.y -= spin;
    }

    if (bob && root.current) {
      const t = state.clock.elapsedTime;
      // Two out-of-phase sines read as road texture rather than a metronome.
      root.current.position.y = Math.sin(t * 1.7) * 0.021 + Math.sin(t * 3.3) * 0.011;
      root.current.rotation.z = Math.sin(t * 1.15) * 0.005;
    }
  });

  return (
    <group ref={root} dispose={null}>
      {/* ---------- Chassis ---------- */}
      <RoundedBox args={[7.0, 0.22, 1.72]} radius={0.05} position={[-0.2, 0.78, 0]}>
        <meshStandardMaterial color={MAT.trim} metalness={0.4} roughness={0.6} />
      </RoundedBox>
      {/* Axle beams */}
      {[FRONT_AXLE, REAR_AXLE].map((x) => (
        <mesh key={x} position={[x, 0.55, 0]}>
          <boxGeometry args={[0.22, 0.16, 1.9]} />
          <meshStandardMaterial color={MAT.trim} metalness={0.4} roughness={0.65} />
        </mesh>
      ))}

      {/* Underglow — dim, and mostly there to catch the wet road */}
      <mesh position={[-0.6, 0.66, 0]}>
        <boxGeometry args={[5.0, 0.03, 1.4]} />
        <meshStandardMaterial
          color={MAT.brand}
          emissive={MAT.brand}
          emissiveIntensity={0.45}
          toneMapped={false}
        />
      </mesh>

      {/* ---------- Cargo box ----------
          A plain wall behind the cab. Nothing overhangs forward above it. */}
      <RoundedBox args={[4.65, 2.5, 2.35]} radius={0.05} position={[-1.225, 2.3, 0]}>
        <meshPhysicalMaterial
          color={MAT.bodyBox}
          metalness={0.1}
          roughness={0.38}
          clearcoat={0.25}
          clearcoatRoughness={0.35}
        />
      </RoundedBox>

      <BoxLivery position={[-1.25, 2.35]} z={BOX_HALF_WIDTH + 0.008} />

      {/* Side skirt: the strongest horizontal line in the reference, and what
          ties the box down onto the chassis. */}
      <RoundedBox args={[4.6, 0.2, 2.2]} radius={0.04} position={[-1.25, 0.95, 0]}>
        <meshStandardMaterial color={MAT.trim} metalness={0.35} roughness={0.62} />
      </RoundedBox>

      {/* ---------- Aluminium rails ----------
          Small parts, but without them the box is just an extruded rectangle. */}
      <mesh position={[-1.225, BOX_FLOOR + 0.06, 0]}>
        <boxGeometry args={[4.7, 0.12, 2.4]} />
        <meshStandardMaterial color={MAT.alu} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[-1.225, BOX_ROOF - 0.05, 0]}>
        <boxGeometry args={[4.7, 0.1, 2.39]} />
        <meshStandardMaterial color={MAT.alu} metalness={0.85} roughness={0.3} />
      </mesh>
      {/*
       * Rear corner post only. A matching post at the front sat flush with the
       * box's front wall and z-fought with it, throwing a hatched band across
       * the body.
       */}
      <mesh position={[BOX_REAR + 0.04, 2.3, 0]}>
        <boxGeometry args={[0.08, 2.46, 2.39]} />
        <meshStandardMaterial color={MAT.alu} metalness={0.85} roughness={0.32} />
      </mesh>

      {/* ---------- Rear ---------- */}
      <mesh position={[BOX_REAR - 0.03, 2.3, 0]}>
        <boxGeometry args={[0.05, 2.3, 2.2]} />
        <meshStandardMaterial color={MAT.brandDeep} metalness={0.1} roughness={0.45} />
      </mesh>
      <mesh position={[BOX_REAR - 0.06, 2.3, 0]}>
        <boxGeometry args={[0.03, 2.3, 0.05]} />
        <meshStandardMaterial color={MAT.alu} metalness={0.8} roughness={0.35} />
      </mesh>
      {[0.85, -0.85].map((z) => (
        <mesh key={z} position={[BOX_REAR - 0.06, 1.35, z]}>
          <boxGeometry args={[0.06, 0.32, 0.2]} />
          <meshStandardMaterial
            color={MAT.brandDeep}
            emissive={MAT.brandDeep}
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Underrun bar on its brackets */}
      {[0.62, -0.62].map((z) => (
        <mesh key={z} position={[BOX_REAR - 0.02, 0.72, z]}>
          <boxGeometry args={[0.08, 0.4, 0.08]} />
          <meshStandardMaterial color={MAT.trim} metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[BOX_REAR - 0.06, 0.5, 0]}>
        <boxGeometry args={[0.12, 0.14, 1.9]} />
        <meshStandardMaterial color={MAT.trim} metalness={0.45} roughness={0.55} />
      </mesh>

      {/* Mud flaps, behind each wheel */}
      {WHEEL_POSITIONS.map(([x, , z]) => (
        <mesh key={`flap-${x}-${z}`} position={[x - 0.62, 0.3, z]}>
          <boxGeometry args={[0.04, 0.46, 0.42]} />
          <meshStandardMaterial color={MAT.trim} roughness={0.92} metalness={0.05} />
        </mesh>
      ))}

      {/* ---------- Cab ----------
          A true cab-over: flat front, no bonnet. */}
      <RoundedBox args={[2.05, 1.95, 2.2]} radius={0.14} position={[2.175, 1.525, 0]}>
        <meshPhysicalMaterial
          color={MAT.bodyCab}
          metalness={0.05}
          roughness={0.35}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
        />
      </RoundedBox>

      {/*
       * Windscreen. The cab's 0.14 radius leaves a flat front face spanning
       * only y 0.69..2.36 and z ±0.96 — a pane any larger pokes out past the
       * rounded corners and reads as a slab floating off the front.
       */}
      <mesh position={[3.16, 1.9, 0]} rotation={[0, 0, -0.2]}>
        <boxGeometry args={[0.09, 0.85, 1.88]} />
        <meshStandardMaterial
          color={MAT.glass}
          metalness={0.45}
          roughness={0.1}
          envMapIntensity={2.6}
          transparent
          opacity={0.82}
        />
      </mesh>

      {/* Door glass */}
      {[1.105, -1.105].map((z) => (
        <mesh key={z} position={[2.32, 1.92, z]}>
          <boxGeometry args={[1.1, 0.72, 0.05]} />
          <meshStandardMaterial
            color={MAT.glass}
            metalness={0.45}
            roughness={0.12}
            envMapIntensity={2.6}
            transparent
            opacity={0.82}
          />
        </mesh>
      ))}

      {/* Door shut line + handle */}
      {[1.098, -1.098].map((z) => (
        <group key={z}>
          <mesh position={[1.42, 1.4, z]}>
            <boxGeometry args={[0.03, 1.4, 0.02]} />
            <meshStandardMaterial color="#c9c9d0" roughness={0.5} />
          </mesh>
          <mesh position={[1.66, 1.44, z]}>
            <boxGeometry args={[0.17, 0.05, 0.03]} />
            <meshStandardMaterial color={MAT.trim} metalness={0.4} roughness={0.5} />
          </mesh>
        </group>
      ))}

      <CabInterior />

      {/* ---------- Front end ---------- */}
      {/* Grille recess with a chrome bar */}
      <RoundedBox args={[0.1, 0.4, 1.5]} radius={0.04} position={[3.22, 1.24, 0]}>
        <meshStandardMaterial color={MAT.trim} metalness={0.5} roughness={0.5} />
      </RoundedBox>
      <mesh position={[3.27, 1.24, 0]}>
        <boxGeometry args={[0.04, 0.09, 1.34]} />
        <meshStandardMaterial color={MAT.chrome} metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Bumper */}
      <RoundedBox args={[0.28, 0.42, 2.15]} radius={0.08} position={[3.3, 0.72, 0]}>
        <meshStandardMaterial color={MAT.trim} metalness={0.3} roughness={0.62} />
      </RoundedBox>
      <mesh position={[3.44, 0.72, 0]}>
        <boxGeometry args={[0.03, 0.16, 0.42]} />
        <meshStandardMaterial color="#e8e8ec" roughness={0.5} />
      </mesh>

      {/* Headlights with an amber indicator outboard */}
      {[0.82, -0.82].map((z) => (
        <group key={z}>
          <mesh position={[3.26, 0.98, z]}>
            <boxGeometry args={[0.05, 0.2, 0.34]} />
            <meshStandardMaterial
              color={MAT.headlight}
              emissive={MAT.headlight}
              emissiveIntensity={3}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[3.26, 0.98, z * 1.26]}>
            <boxGeometry args={[0.05, 0.2, 0.11]} />
            <meshStandardMaterial
              color={MAT.amber}
              emissive={MAT.amber}
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            position={[3.8, 0.98, z]}
            color={MAT.headlight}
            intensity={4}
            distance={5}
            decay={2}
          />
        </group>
      ))}

      {/* Wing mirrors on the cab's front corners */}
      {[1.18, -1.18].map((z) => (
        <group key={z}>
          <mesh position={[3.02, 2.16, z]}>
            <boxGeometry args={[0.05, 0.05, 0.3]} />
            <meshStandardMaterial color={MAT.trim} metalness={0.35} roughness={0.55} />
          </mesh>
          <RoundedBox
            args={[0.07, 0.4, 0.15]}
            radius={0.03}
            position={[3.02, 1.94, z * 1.22]}
          >
            <meshStandardMaterial color={MAT.trim} metalness={0.35} roughness={0.55} />
          </RoundedBox>
        </group>
      ))}

      {/* ---------- Wheels ---------- */}
      {WHEEL_POSITIONS.map((position, index) => (
        <Wheel
          key={position.join(",")}
          position={position}
          register={(group) => {
            wheels.current[index] = group;
          }}
        />
      ))}

      {/* Arch over the front wheels; the rears sit under the skirt */}
      {[TRACK, -TRACK].map((z) => (
        <mesh key={z} position={[FRONT_AXLE, WHEEL_RADIUS, z * 1.09]}>
          {/* A torus arc of 0..PI is already the top half in the XY plane. */}
          <torusGeometry args={[0.58, 0.07, 8, 20, Math.PI]} />
          <meshStandardMaterial color={MAT.trim} metalness={0.3} roughness={0.62} />
        </mesh>
      ))}
    </group>
  );
}

/** Seats, dash and wheel. Only ever read as shapes behind glass — keep it cheap. */
function CabInterior() {
  const upholstery = (
    <meshStandardMaterial color={MAT.cabin} metalness={0.05} roughness={0.85} />
  );

  return (
    <group>
      <mesh position={[2.98, 1.52, 0]}>
        <boxGeometry args={[0.3, 0.12, 1.8]} />
        <meshStandardMaterial color="#2c2f36" roughness={0.8} />
      </mesh>

      {[0.5, -0.5].map((z) => (
        <group key={z}>
          <RoundedBox args={[0.4, 0.12, 0.42]} radius={0.05} position={[2.3, 1.42, z]}>
            {upholstery}
          </RoundedBox>
          <RoundedBox args={[0.12, 0.56, 0.42]} radius={0.05} position={[2.08, 1.72, z]}>
            {upholstery}
          </RoundedBox>
        </group>
      ))}

      <mesh position={[2.84, 1.72, 0.48]} rotation={[0, 0, Math.PI / 2.6]}>
        <torusGeometry args={[0.15, 0.022, 8, 18]} />
        <meshStandardMaterial color="#23262c" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Wheel({
  position,
  register,
}: {
  position: [number, number, number];
  register: (group: Group | null) => void;
}) {
  return (
    /* Outer group lays the axle along Z; the inner group spins on its own axis. */
    <group position={position} rotation={[Math.PI / 2, 0, 0]}>
      <group ref={register}>
        <mesh>
          <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 0.36, 26]} />
          <meshStandardMaterial color={MAT.tyre} roughness={0.9} metalness={0.05} />
        </mesh>

        {/* Alloy face */}
        <mesh>
          <cylinderGeometry args={[0.3, 0.3, 0.38, 24]} />
          <meshStandardMaterial color={MAT.rim} metalness={0.9} roughness={0.25} />
        </mesh>

        {/* Six recessed holes — what makes the rotation legible */}
        {[0.195, -0.195].map((y) =>
          [0, 1, 2, 3, 4, 5].map((i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <mesh
                key={`${y}-${i}`}
                position={[Math.cos(angle) * 0.185, y, Math.sin(angle) * 0.185]}
              >
                <cylinderGeometry args={[0.058, 0.058, 0.03, 12]} />
                <meshStandardMaterial color={MAT.trim} roughness={0.7} metalness={0.2} />
              </mesh>
            );
          }),
        )}

        {/* Centre cap */}
        {[0.202, -0.202].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[0.078, 0.078, 0.03, 16]} />
            <meshStandardMaterial color={MAT.chrome} metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

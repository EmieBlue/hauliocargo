"use client";

import { AdaptiveDpr, ContactShadows } from "@react-three/drei";
import {
  CargoBox,
  Chair,
  Refrigerator,
  Sofa,
  Television,
} from "./CargoProps";
import { MAT } from "./palette";
import { SceneRig } from "./SceneRig";
import { SceneShell } from "./SceneShell";
import { StudioLights } from "./StudioLights";
import { TruckModel } from "./TruckModel";

/**
 * The interactive cargo scene: a parked hauler with the things people move
 * drifting around it. Deliberately sparse — the truck stays the focus.
 */
export default function CargoCanvas({
  className,
  onReady,
}: {
  className?: string;
  onReady?: () => void;
}) {
  return (
    <SceneShell
      className={className}
      cameraPosition={[9.8, 4.1, 15.2]}
      fov={34}
      fog={[MAT.ink, 26, 54]}
      onReady={onReady}
    >
      <SceneRig
        base={[9.8, 4.1, 15.2]}
        lookAt={[0, 2.9, 0]}
        pointerStrength={2.2}
      />

      <StudioLights />

      {/* Truck idling rather than driving — this scene is about the cargo. */}
      <TruckModel speed={0.32} />

      <CargoBox position={[-5.4, 1.4, 2.6]} rotation={[0, 0.5, 0]} scale={1.15} />
      <CargoBox position={[-4.2, 3.3, 3.4]} rotation={[0.15, -0.3, 0.1]} scale={0.85} />
      {/* Kept clear of the truck's nose — closer in, it sits over the bumper. */}
      <CargoBox position={[7.1, 0.9, 4.1]} rotation={[0, -0.6, 0]} />

      <Refrigerator position={[-6.3, 2.4, -1.0]} rotation={[0, 0.7, 0]} scale={0.95} />
      <Sofa position={[5.6, 3.4, -1.8]} rotation={[0, -0.85, 0]} scale={0.95} />
      <Chair position={[6.8, 1.6, 0.9]} rotation={[0, -0.4, 0]} scale={0.9} />
      <Television position={[-1.8, 4.8, 3.4]} rotation={[0, 0.35, 0]} scale={0.8} />

      <ContactShadows
        position={[0, 0.015, 0]}
        opacity={0.6}
        scale={34}
        blur={3}
        far={7}
        resolution={256}
        color="#000000"
        frames={1}
      />

      <AdaptiveDpr />
    </SceneShell>
  );
}

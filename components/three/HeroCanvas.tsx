"use client";

import { AdaptiveDpr, ContactShadows } from "@react-three/drei";
import { GroundPlane } from "./GroundPlane";
import { LightTrails } from "./LightTrails";
import { MAT } from "./palette";
import { SceneRig } from "./SceneRig";
import { SceneShell } from "./SceneShell";
import { StudioLights } from "./StudioLights";
import { TruckModel } from "./TruckModel";

/** The hero scene: a hauler moving through a lit, reflective space. */
export default function HeroCanvas({
  className,
  onReady,
}: {
  className?: string;
  onReady?: () => void;
}) {
  return (
    <SceneShell
      className={className}
      cameraPosition={[13.8, 4.0, 17.2]}
      fov={32}
      fog={[MAT.ink, 28, 58]}
      onReady={onReady}
    >
      {/* Trimmed in slightly: the straight box body tops out at 3.55, lower
          than the Luton it replaced. */}
      <SceneRig
        base={[13.8, 4.0, 17.2]}
        lookAt={[0, 1.85, 0]}
        framingShift={3.0}
        pointerStrength={1}
      />

      <StudioLights />
      <LightTrails count={16} />

      <group position={[0, 0.02, 0]}>
        <TruckModel speed={2.1} />
      </group>

      <ContactShadows
        position={[0, 0.015, 0]}
        opacity={0.7}
        scale={30}
        blur={2.8}
        far={6}
        resolution={256}
        color="#000000"
        frames={1}
      />

      <GroundPlane speed={13} />

      <AdaptiveDpr />
    </SceneShell>
  );
}

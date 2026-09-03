"use client";

import { AdaptiveDpr, ContactShadows } from "@react-three/drei";
import { CargoBox, Refrigerator, Sofa } from "./CargoProps";
import { LightTrails } from "./LightTrails";
import { MAT } from "./palette";
import { SceneRig } from "./SceneRig";
import { SceneShell } from "./SceneShell";
import { StudioLights } from "./StudioLights";
import { TruckModel } from "./TruckModel";

/**
 * The auth-page visual: the same hauler, centred and idling in its own
 * column rather than driving across a full-bleed hero. No `framingShift` —
 * there's no headline overlaid on this one, it's a standalone module next to
 * the form, so the truck is simply centred in its own frame.
 *
 * Deliberately sparser than the cargo section: three props, not five — this
 * sits beside a form someone is trying to fill in, not a section inviting
 * exploration.
 */
export default function AuthCanvas({
  className,
  onReady,
}: {
  className?: string;
  onReady?: () => void;
}) {
  return (
    <SceneShell
      className={className}
      cameraPosition={[8.2, 3.4, 11.4]}
      fov={34}
      fog={[MAT.ink, 22, 46]}
      onReady={onReady}
      dprMax={1.5}
    >
      <SceneRig base={[8.2, 3.4, 11.4]} lookAt={[0, 1.85, 0]} pointerStrength={1.4} />

      <StudioLights />
      <LightTrails count={10} />

      <TruckModel speed={0.4} />

      <CargoBox position={[-5.2, 1.1, 2.4]} rotation={[0, 0.5, 0]} scale={0.85} />
      <Sofa position={[5.1, 1.5, -1.6]} rotation={[0, -0.75, 0]} scale={0.75} />
      <Refrigerator position={[-4.6, 1.9, -2.2]} rotation={[0, 0.6, 0]} scale={0.7} />

      <ContactShadows
        position={[0, 0.015, 0]}
        opacity={0.65}
        scale={26}
        blur={2.8}
        far={6}
        resolution={256}
        color="#000000"
        frames={1}
      />

      <AdaptiveDpr />
    </SceneShell>
  );
}

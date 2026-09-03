"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { MAT } from "./palette";

/**
 * Lighting rig and reflection environment.
 *
 * The environment map is built in-scene from Lightformers and baked once
 * (`frames={1}`) — no HDRI is fetched from a CDN, so the page has no runtime
 * network dependency and the reflections stay on-brand: white key, yellow rim.
 */
export function StudioLights() {
  return (
    <>
      {/* Exposure is set for a bright yellow body. The truck used to be
          near-black; at the old intensities a yellow one clips flat to white. */}
      <ambientLight intensity={0.4} />
      {/* Key: front-right and low, so it rakes across the flank instead of
          flooding the roof. */}
      <directionalLight position={[11, 6, 13]} intensity={1.5} color="#ffffff" />
      {/* Brand rim from behind-left. Kept low — a yellow rim on a yellow body
          adds nothing but clipping. */}
      <directionalLight position={[-9, 5, -7]} intensity={0.5} color={MAT.brand} />
      {/* Cool fill: the shadow side has to go cool or the yellow flattens out */}
      <directionalLight position={[-5, 4, 9]} intensity={0.9} color="#8ea3c8" />

      <Environment resolution={256} frames={1}>
        {/* Key */}
        <Lightformer
          form="rect"
          intensity={1.8}
          color="#ffffff"
          position={[9, 7, 9]}
          scale={[11, 9, 1]}
          target={[0, 0, 0]}
        />
        {/* Brand rim from behind-left — the yellow edge along the body */}
        <Lightformer
          form="rect"
          intensity={1}
          color={MAT.brand}
          position={[-9, 4, -5]}
          scale={[14, 5, 1]}
          target={[0, 0, 0]}
        />
        {/* Cool fill so the blacks do not go flat */}
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#5a6d94"
          position={[0, 5, -14]}
          scale={[18, 8, 1]}
          target={[0, 0, 0]}
        />
        {/* Small hot spot for a highlight to travel across the panels */}
        <Lightformer
          form="circle"
          intensity={1.5}
          color="#ffffff"
          position={[11, 6, -4]}
          scale={4}
          target={[0, 0, 0]}
        />
      </Environment>
    </>
  );
}

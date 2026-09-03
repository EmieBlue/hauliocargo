"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, Vector3 } from "three";

type SceneRigProps = {
  /** Camera home position at desktop width. */
  base?: [number, number, number];
  /** World point the camera holds in frame. */
  lookAt?: [number, number, number];
  /** How far the pointer pulls the camera. 0 disables it. */
  pointerStrength?: number;
  /**
   * Pushes the subject to the right of frame (desktop only), so the hero copy
   * has clear space on the left. Ignored on compact screens, where the subject
   * is centred instead.
   */
  framingShift?: number;
};

const UP = new Vector3(0, 1, 0);

/**
 * Drives the camera: a slow idle drift plus a damped pull toward the pointer.
 * Everything is critically damped and clamped — no seasickness, no snapping.
 *
 * The camera and viewport size are read from the per-frame `state` rather than
 * from `useThree()`. Both are the same objects, but mutating a value returned
 * by a hook trips the React Compiler's immutability rule, and driving the
 * camera imperatively each frame is exactly what this component is for.
 */
export function SceneRig({
  base = [8.6, 3.4, 10.6],
  lookAt = [0, 1.7, 0],
  pointerStrength = 1,
  framingShift = 0,
}: SceneRigProps) {
  const look = useRef(new Vector3());
  const direction = useRef(new Vector3());
  const right = useRef(new Vector3());

  useFrame((state, delta) => {
    const { camera, size, pointer } = state;
    const t = state.clock.elapsedTime;

    // Pull back on narrow viewports so the whole truck still fits the frame.
    const zoom = size.width < 640 ? 1.1 : size.width < 900 ? 1.05 : 1;
    const compact = size.width < 900;
    const shift = compact ? 0 : framingShift;

    const targetX =
      base[0] * zoom + pointer.x * 0.9 * pointerStrength + Math.sin(t * 0.22) * 0.28;
    const targetY = Math.max(
      0.9,
      base[1] * zoom + pointer.y * 0.42 * pointerStrength + Math.sin(t * 0.31) * 0.14,
    );
    const targetZ = base[2] * zoom;

    camera.position.x = MathUtils.damp(camera.position.x, targetX, 2.4, delta);
    camera.position.y = MathUtils.damp(camera.position.y, targetY, 2.4, delta);
    camera.position.z = MathUtils.damp(camera.position.z, targetZ, 2.4, delta);

    look.current.set(lookAt[0], lookAt[1], lookAt[2]);

    if (shift !== 0) {
      // Offset the look target along the camera's right vector: aiming left of
      // the truck puts the truck on the right of the frame.
      direction.current.copy(look.current).sub(camera.position).normalize();
      right.current.crossVectors(direction.current, UP).normalize();
      look.current.addScaledVector(right.current, -shift);
    }

    camera.lookAt(look.current);
  });

  return null;
}

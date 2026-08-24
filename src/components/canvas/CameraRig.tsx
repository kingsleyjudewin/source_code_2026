'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scroll';
import { SCENE_MOODS } from '@/lib/scenes';

/**
 * The camera is the narrator. It dollies per scene, drifts continuously so no
 * frame is ever truly static, and leans toward the pointer for parallax.
 */
export default function CameraRig() {
  const { camera } = useThree();
  const pointer = useRef({ x: 0, y: 0 });
  const target = useRef(new THREE.Vector3(0, 0, 18));
  const roll = useRef(0);

  useFrame((state, delta) => {
    const { scene, sceneProgress, velocity } = scrollStore.get();
    const mood = SCENE_MOODS[scene] ?? SCENE_MOODS.hero;

    // Pointer is already normalised to -1..1 by R3F.
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;

    const t = state.clock.elapsedTime;

    // Base dolly for the scene + a slow push through the section.
    const z = 18 + mood.dolly - sceneProgress * 1.8;

    target.current.set(
      pointer.current.x * 1.1 + Math.sin(t * 0.13) * 0.5,
      pointer.current.y * 0.7 + Math.cos(t * 0.11) * 0.35,
      z,
    );

    const k = 1 - Math.exp(-2.4 * delta);
    camera.position.lerp(target.current, k);

    // lookAt() rewrites the camera's full rotation, so the roll has to be
    // applied *after* it — and smoothed in its own ref, since anything written
    // to rotation.z beforehand is simply discarded.
    camera.lookAt(0, pointer.current.y * 0.2, 0);

    // Roll a touch against scroll velocity — subtle, but it sells momentum.
    const targetRoll = THREE.MathUtils.clamp(velocity * 0.0006, -0.05, 0.05);
    roll.current += (targetRoll - roll.current) * k;
    camera.rotation.z += roll.current;
  });

  return null;
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import Nebula from './Nebula';
import Starfield from './Starfield';
import QuantumWeb from './QuantumWeb';
import InfinityStones from './InfinityStones';
import EnergyField from './EnergyField';
import CameraRig from './CameraRig';
import { getQuality, type QualitySettings } from '@/lib/quality';
import { scrollStore } from '@/lib/scroll';
import { SCENE_MOODS } from '@/lib/scenes';

/** Bloom strength follows the active scene's mood. */
function MoodBloom({ base }: { base: number }) {
  const [intensity, setIntensity] = useState(base);

  useEffect(() => {
    let raf = 0;
    let current = base;
    const tick = () => {
      const { scene } = scrollStore.get();
      const want = base * (SCENE_MOODS[scene]?.bloom ?? 1);
      // Cheap easing off the RAF loop; bloom doesn't need per-frame precision.
      if (Math.abs(want - current) > 0.005) {
        current += (want - current) * 0.06;
        setIntensity(current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [base]);

  return (
    <Bloom
      intensity={intensity}
      luminanceThreshold={0.22}
      luminanceSmoothing={0.7}
      mipmapBlur
      radius={0.72}
    />
  );
}

function Effects({ q }: { q: QualitySettings }) {
  if (!q.bloom) return null;
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <MoodBloom base={1.15} />
      {q.chromaticAberration ? (
        <ChromaticAberration
          offset={new THREE.Vector2(0.0006, 0.0009)}
          radialModulation
          modulationOffset={0.35}
          blendFunction={BlendFunction.NORMAL}
        />
      ) : (
        <></>
      )}
      <Vignette eskil={false} offset={0.22} darkness={0.82} />
    </EffectComposer>
  );
}

/**
 * ONE canvas for the entire site.
 *
 * It is fixed behind the document and never unmounts, which is the whole reason
 * section-to-section transitions can be continuous — the camera and particle
 * systems persist across "universes" instead of being torn down and rebuilt.
 */
export default function SceneRoot() {
  const [q, setQ] = useState<QualitySettings | null>(null);
  const [degraded, setDegraded] = useState(false);

  useEffect(() => setQ(getQuality()), []);

  if (!q) return null;

  const factor = degraded ? 0.55 : 1;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      // The canvas is pure atmosphere; all content is in the DOM above it.
    >
      <Canvas
        dpr={q.dpr}
        gl={{
          antialias: q.antialias,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0, 18], fov: 52, near: 0.1, far: 400 }}
        onCreated={({ gl }) => {
          gl.setClearColor('#050816', 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        {/* Drops resolution before it drops frames. */}
        <PerformanceMonitor
          onDecline={() => setDegraded(true)}
          onIncline={() => setDegraded(false)}
        />
        <AdaptiveDpr pixelated={false} />

        <CameraRig />

        <Suspense fallback={null}>
          <Nebula />
          <Starfield count={Math.round(q.starCount * factor)} />
          <EnergyField count={Math.round(q.fieldParticles * factor)} />
          <QuantumWeb nodes={q.webNodes} />
          <InfinityStones />
        </Suspense>

        <Effects q={q} />
      </Canvas>
    </div>
  );
}

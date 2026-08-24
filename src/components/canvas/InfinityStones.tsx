'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scroll';

/**
 * THE GAUNTLET — six stones, collected one per scroll beat.
 *
 * Each stone flies from a scattered orbit into its knuckle slot as the section
 * scrolls. Once all six are seated, a shockwave ring expands and the whole rig
 * flares. Everything is driven by `sceneProgress`, so scrubbing backwards
 * un-collects them cleanly — no one-shot timelines to get out of sync.
 */
export const STONES = [
  { name: 'Space',   color: '#3d8bff', slot: [-1.55, 0.62, 0] },
  { name: 'Mind',    color: '#ffd93d', slot: [-0.93, 0.95, 0] },
  { name: 'Reality', color: '#ff3b57', slot: [-0.31, 1.08, 0] },
  { name: 'Power',   color: '#a24bff', slot: [0.31, 1.02, 0] },
  { name: 'Time',    color: '#4dff9e', slot: [0.93, 0.82, 0] },
  { name: 'Soul',    color: '#ff8a2b', slot: [1.55, 0.5, 0] },
] as const;

/**
 * Soft radial halo texture, built once and shared by every stone.
 *
 * A <sprite> with no map renders as a solid opaque quad — which is exactly the
 * hard-edged square this used to draw. The gradient gives the additive halo the
 * falloff it needs to read as light rather than geometry.
 */
function makeHaloTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.14)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Facet the gem so bloom catches individual planes as it tumbles. */
function useGemGeometry() {
  return useMemo(() => {
    const g = new THREE.IcosahedronGeometry(0.34, 0);
    g.computeVertexNormals();
    return g;
  }, []);
}

function Stone({
  index,
  color,
  slot,
  gem,
  halo,
}: {
  index: number;
  color: string;
  slot: readonly [number, number, number] | number[];
  gem: THREE.BufferGeometry;
  halo: THREE.Texture;
}) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);

  // Scattered origin — deterministic per stone so it never reshuffles on remount.
  const origin = useMemo(() => {
    const a = (index / STONES.length) * Math.PI * 2 + 0.6;
    const r = 9 + (index % 3) * 3.4;
    return new THREE.Vector3(
      Math.cos(a) * r,
      Math.sin(a * 1.7) * 4.2 + 1.5,
      Math.sin(a) * r * 0.55 - 6,
    );
  }, [index]);

  const target = useMemo(() => new THREE.Vector3(slot[0], slot[1], slot[2]), [slot]);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const emissive = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    const { scene, sceneProgress } = scrollStore.get();
    const active = scene === 'the-gauntlet';

    // Collection window for this stone: staggered, overlapping slightly.
    const start = 0.12 + index * 0.11;
    const end = start + 0.16;
    const raw = active
      ? THREE.MathUtils.clamp((sceneProgress - start) / (end - start), 0, 1)
      : 0;

    // back-out easing: the stone overshoots its slot then settles. Reads as impact.
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const t = raw === 0 || raw === 1 ? raw : 1 + c3 * Math.pow(raw - 1, 3) + c1 * Math.pow(raw - 1, 2);

    scratch.copy(origin).lerp(target, t);

    // Arc the flight path upward so stones don't travel in dead-straight lines.
    scratch.y += Math.sin(raw * Math.PI) * 2.4;

    g.position.copy(scratch);

    // Tumble fast while free, lock to a slow spin once seated.
    const spin = THREE.MathUtils.lerp(2.6, 0.35, t);
    g.rotation.x += delta * spin;
    g.rotation.y += delta * spin * 1.4;

    const seated = t > 0.98;
    const pulse = seated ? 1 + Math.sin(state.clock.elapsedTime * 3 + index) * 0.12 : 1;
    g.scale.setScalar((0.55 + t * 0.45) * pulse);

    if (mat.current) {
      mat.current.emissiveIntensity = (0.9 + t * 2.6) * pulse;
      mat.current.opacity = active ? 1 : Math.max(0, t);
    }
  });

  return (
    <group ref={group}>
      <mesh geometry={gem}>
        <meshStandardMaterial
          ref={mat}
          color={color}
          emissive={emissive}
          emissiveIntensity={1}
          roughness={0.08}
          metalness={0.35}
          transparent
        />
      </mesh>
      {/* Soft halo billboard — gives bloom a wide base to bleed from. */}
      <sprite scale={[2.8, 2.8, 1]}>
        <spriteMaterial
          map={halo}
          color={color}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </sprite>
    </group>
  );
}

/** Expanding energy ring fired the moment the sixth stone seats. */
function Shockwave() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const m = mesh.current;
    if (!m || !mat.current) return;

    const { scene, sceneProgress } = scrollStore.get();
    const active = scene === 'the-gauntlet';

    // Fires across the last 18% of the section.
    const t = active ? THREE.MathUtils.clamp((sceneProgress - 0.82) / 0.18, 0, 1) : 0;

    const s = 0.2 + t * 26;
    m.scale.setScalar(s);
    m.visible = t > 0.001 && t < 0.999;
    mat.current.opacity = Math.sin(t * Math.PI) * 0.8;
  });

  return (
    <mesh ref={mesh} position={[0, 0.85, 0]} visible={false}>
      <ringGeometry args={[0.82, 1, 96]} />
      <meshBasicMaterial
        ref={mat}
        color="#e8d9ff"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function InfinityStones() {
  const gem = useGemGeometry();
  const halo = useMemo(() => makeHaloTexture(), []);
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);

  useEffect(() => () => halo.dispose(), [halo]);

  useFrame((state, delta) => {
    const { scene, sceneProgress } = scrollStore.get();
    const active = scene === 'the-gauntlet';
    const g = group.current;
    if (!g) return;

    // Fade the whole rig in/out rather than mounting it — avoids a shader
    // compile hitch in the middle of the most cinematic scroll on the site.
    const targetOpacity = active ? 1 : 0;
    const k = 1 - Math.exp(-3 * delta);
    g.visible = active || g.scale.x > 0.02;
    const s = THREE.MathUtils.lerp(g.scale.x, active ? 1 : 0, k);
    g.scale.setScalar(Math.max(s, 0.001));

    // Slow parallax tilt keeps the formation from reading as a flat sprite row.
    g.rotation.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.16;
    // Seated below the headline so the formation reads as energy behind the
    // glass panel rather than a stone sitting on top of the event title.
    g.position.y = -2.1;
    g.position.z = THREE.MathUtils.lerp(-2, 1.5, sceneProgress);

    if (light.current) {
      const flare = THREE.MathUtils.clamp((sceneProgress - 0.8) / 0.2, 0, 1);
      light.current.intensity = targetOpacity * (14 + flare * 90);
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.35} />
      <pointLight ref={light} position={[0, 1, 3]} intensity={14} color="#c9a6ff" distance={40} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} color="#ffd9a0" />

      {STONES.map((s, i) => (
        <Stone key={s.name} index={i} color={s.color} slot={s.slot} gem={gem} halo={halo} />
      ))}

      <Shockwave />
    </group>
  );
}

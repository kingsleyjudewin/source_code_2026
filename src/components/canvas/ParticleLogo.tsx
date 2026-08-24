'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scroll';

/**
 * The hero title, assembled from particles.
 *
 * Targets are sampled from text rasterised to an offscreen 2D canvas, so the
 * logo is real live text — change the string and the particle cloud follows,
 * no modelling step. Each particle keeps a chaotic origin and a stable target;
 * `uAssemble` drives the flight between them on the GPU.
 */
const vert = /* glsl */ `
  precision highp float;

  attribute vec3  aTarget;
  attribute vec3  aChaos;
  attribute float aSeed;

  uniform float uAssemble;   // 0 = scattered, 1 = formed
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBurst;

  varying float vGlow;
  varying float vSeed;

  void main() {
    // Stagger: each particle starts its flight at a different moment, so the
    // logo resolves in a sweep rather than snapping all at once.
    float stagger = aSeed * 0.45;
    float t = clamp((uAssemble - stagger) / (1.0 - stagger + 0.0001), 0.0, 1.0);
    // expo-out
    float e = t >= 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t);

    vec3 pos = mix(aChaos, aTarget, e);

    // Residual orbital drift so the formed logo still breathes.
    float breathe = 0.05 + 0.12 * (1.0 - e);
    pos.x += sin(uTime * 0.8 + aSeed * 20.0) * breathe;
    pos.y += cos(uTime * 0.7 + aSeed * 17.0) * breathe;
    pos.z += sin(uTime * 0.5 + aSeed * 11.0) * breathe * 2.0;

    // Arc-reactor pulse pushes the whole cloud outward briefly.
    pos *= 1.0 + uBurst * 0.12 * (0.5 + aSeed);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    vGlow = e;
    vSeed = aSeed;
    gl_PointSize = (2.6 + aSeed * 2.8) * uPixelRatio * (18.0 / max(-mv.z, 1.0)) * (1.0 + uBurst);
  }
`;

const frag = /* glsl */ `
  precision highp float;

  uniform vec3  uColorCore;
  uniform vec3  uColorEdge;
  uniform float uBurst;

  varying float vGlow;
  varying float vSeed;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.05, d);

    // Unformed particles read cold and dim; formed ones ignite to white-hot.
    vec3 col = mix(uColorEdge, uColorCore, vGlow);
    col = mix(col, vec3(1.0), pow(core, 4.0) * (0.35 + vGlow * 0.65));
    col += uColorCore * uBurst * 0.8;

    float a = core * (0.25 + vGlow * 0.75);
    gl_FragColor = vec4(col, a);
  }
`;

/** Rasterise text and return one 3D target per opaque pixel we sample. */
function sampleTextTargets(lines: string[], count: number, width = 1024): Float32Array | null {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const height = Math.round(width * 0.42);
  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineHeight = height / (lines.length + 0.6);
  lines.forEach((line, i) => {
    // Fit each line to ~88% of the canvas width.
    let size = lineHeight * 1.1;
    ctx.font = `900 ${size}px Orbitron, Impact, system-ui, sans-serif`;
    const target = width * 0.88;
    const measured = ctx.measureText(line).width;
    if (measured > 0) {
      size = Math.min(size * (target / measured), lineHeight * 1.15);
      ctx.font = `900 ${size}px Orbitron, Impact, system-ui, sans-serif`;
    }
    const y = lineHeight * (i + 0.9);
    ctx.fillText(line, width / 2, y);
  });

  const { data } = ctx.getImageData(0, 0, width, height);

  // Collect candidate pixels first, then draw `count` at random. Sampling on a
  // fixed stride would alias against the glyph strokes and thin out diagonals.
  const candidates: number[] = [];
  const stride = 2;
  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      if (data[(y * width + x) * 4] > 128) candidates.push(x, y);
    }
  }
  if (candidates.length === 0) return null;

  const pts = candidates.length / 2;
  const out = new Float32Array(count * 3);
  const worldW = 14;
  const worldH = worldW * (height / width);

  for (let i = 0; i < count; i++) {
    const j = ((Math.random() * pts) | 0) * 2;
    const x = candidates[j];
    const y = candidates[j + 1];
    // Jitter within the sampling cell so overlapping draws don't stack.
    out[i * 3] = ((x + Math.random() * stride) / width - 0.5) * worldW;
    out[i * 3 + 1] = -((y + Math.random() * stride) / height - 0.5) * worldH;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.55;
  }
  return out;
}

const DEFAULT_LINES = ['SOURCE CODE', '2026'];

export default function ParticleLogo({
  count = 24000,
  lines = DEFAULT_LINES,
}: {
  count?: number;
  lines?: string[];
}) {
  const [ready, setReady] = useState(false);
  const burst = useRef(0);
  /** Seconds since the targets became available — drives the entrance assembly. */
  const introAge = useRef(0);
  const lastPulse = useRef(0);
  const { viewport } = useThree();

  /**
   * The material is constructed here rather than declared as <shaderMaterial>.
   *
   * Passing `uniforms` as a JSX prop means React owns it: when this component
   * re-renders (and it does — `ready` is state), the reconciler re-applies that
   * prop and the object the render loop mutates stops being the object the
   * compiled program reads. The uniform then silently stays at its initial
   * value. Owning the material outright keeps exactly one uniforms object.
   */
  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uAssemble: { value: 0 },
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uBurst: { value: 0 },
        uColorCore: { value: new THREE.Color('#7fe4ff') },
        uColorEdge: { value: new THREE.Color('#4a3ad8') },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, []);

  const uniforms = material.uniforms;

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const chaos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Chaotic origin on a wide shell — particles arrive from "deep space".
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 18 + Math.random() * 34;
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      chaos[i * 3 + 2] = r * Math.cos(phi) * 0.5 - 10;
      seeds[i] = Math.random();
    }

    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.setAttribute('aChaos', new THREE.BufferAttribute(chaos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aTarget', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
    return g;
  }, [count]);

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  // Sample targets once fonts are ready, so the cloud matches the real display face.
  useEffect(() => {
    let cancelled = false;
    const build = () => {
      if (cancelled) return;
      const targets = sampleTextTargets(lines, count);
      if (!targets) return;
      const attr = geometry.getAttribute('aTarget') as THREE.BufferAttribute;
      attr.array.set(targets);
      attr.needsUpdate = true;
      setReady(true);
    };
    if (document.fonts?.ready) document.fonts.ready.then(build);
    else build();
    return () => {
      cancelled = true;
    };
  }, [count, lines, geometry]);

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    const { scene, sceneProgress } = scrollStore.get();

    // The logo assembles on arrival, not on scroll — at rest the hero has to
    // actually show its title. Scroll then takes it apart again on the way out.
    if (ready) introAge.current += delta;
    const intro = THREE.MathUtils.clamp(introAge.current / 2.4, 0, 1);

    // Disperse across the back third of the hero so the galaxy inherits a clear stage.
    const exit =
      scene === 'hero'
        ? 1 - THREE.MathUtils.clamp((sceneProgress - 0.55) / 0.3, 0, 1)
        : 0;

    const assemble = intro * exit;
    const k = 1 - Math.exp(-4 * delta);
    uniforms.uAssemble.value += (assemble - uniforms.uAssemble.value) * k;

    // Arc-reactor pulse once the logo is formed.
    const t = uniforms.uTime.value;
    if (uniforms.uAssemble.value > 0.9 && t - lastPulse.current > 3.4) {
      lastPulse.current = t;
      burst.current = 1;
    }
    burst.current *= Math.exp(-4.5 * delta);
    uniforms.uBurst.value = burst.current;
  });

  // Keep the logo readable on narrow viewports.
  const scale = Math.min(1, viewport.width / 16);

  return (
    <points
      geometry={geometry}
      material={material}
      frustumCulled={false}
      scale={scale}
      // Lifted above centre so the assembled logo sits in the gap between the
      // institutional lockup and the tagline instead of colliding with it.
      position={[0, 1.7, 0]}
      visible={ready}
    />
  );
}

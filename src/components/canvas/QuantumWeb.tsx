'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scroll';

/**
 * THE DARK QUANTUM WEB — hero background.
 *
 * A living network: nodes seeded across the frame (weighted toward the four
 * corners so strands read as reaching in from off-screen), linked wherever two
 * nodes fall within a proximity radius, with light pulses travelling the
 * strands.
 *
 * Built once on the CPU into two static buffers — one LineSegments, one Points —
 * then animated entirely in the vertex/fragment shaders. Nothing is rebuilt per
 * frame and there is no per-node object graph, so the whole web is two draw
 * calls regardless of node count.
 */

const PALETTE = {
  red: new THREE.Color('#ff3d57'),
  redSoft: new THREE.Color('#ff5c75'),
  crimson: new THREE.Color('#b10032'),
  gold: new THREE.Color('#ffd87a'),
};

/* ---------------------------------------------------------------- strands */
const lineVert = /* glsl */ `
  precision highp float;

  attribute float aT;       // 0 at strand start, 1 at end
  attribute float aSeed;
  attribute float aDepth;   // 0 = far, 1 = near — drives parallax + brightness

  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uReveal;    // 0 → 1 boot-up
  uniform float uExit;      // 0 → 1 scroll-away

  varying float vT;
  varying float vSeed;
  varying float vDepth;
  varying float vFade;

  void main() {
    vec3 pos = position;

    // Slow organic drift so the lattice never reads as a static mesh.
    float w = uTime * 0.16;
    pos.x += sin(w + aSeed * 21.0) * 0.30 * aDepth;
    pos.y += cos(w * 0.86 + aSeed * 13.0) * 0.26 * aDepth;

    // Pointer parallax — nearer strands travel further.
    pos.xy += uPointer * (0.35 + aDepth * 1.25);

    // On scroll the web is pulled upward and the lattice pulls apart.
    pos.y += uExit * (5.0 + aDepth * 9.0);
    pos.xy *= 1.0 + uExit * 0.35;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // Strands light up outward from the centre during the boot sequence.
    float radial = clamp(length(position.xy) / 26.0, 0.0, 1.0);
    float lit = smoothstep(radial - 0.35, radial + 0.12, uReveal * 1.45);

    vT = aT;
    vSeed = aSeed;
    vDepth = aDepth;
    vFade = lit * (1.0 - uExit);
  }
`;

const lineFrag = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform vec3  uColorHot;

  varying float vT;
  varying float vSeed;
  varying float vDepth;
  varying float vFade;

  void main() {
    if (vFade <= 0.001) discard;

    // Baseline strand: barely-there filament, brighter the nearer it sits.
    float base = 0.035 + vDepth * 0.10;

    // A packet of light running the length of the strand.
    float speed = 0.20 + fract(vSeed * 7.31) * 0.28;
    float head  = fract(uTime * speed + vSeed * 11.0);
    float d     = abs(vT - head);
    d = min(d, 1.0 - d);                       // wrap at the ends
    float packet = exp(-d * d * 900.0);

    // Not every strand carries traffic at once.
    // NB: 'active' is a reserved word in GLSL ES; naming it that fails to compile.
    float traffic = step(0.55, fract(vSeed * 3.77 + floor(uTime * speed) * 0.61));

    vec3 col = mix(uColorA, uColorB, vSeed);
    col = mix(col, uColorHot, packet * traffic * 0.85);

    float alpha = (base + packet * traffic * 0.9) * vFade;
    gl_FragColor = vec4(col * (0.85 + packet * traffic * 2.2), alpha);
  }
`;

/* ------------------------------------------------------------------ nodes */
const nodeVert = /* glsl */ `
  precision highp float;

  attribute float aSeed;
  attribute float aSize;
  attribute float aDepth;

  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uPixelRatio;
  uniform float uReveal;
  uniform float uExit;

  varying float vSeed;
  varying float vFade;
  varying float vPulse;

  void main() {
    vec3 pos = position;

    float w = uTime * 0.16;
    pos.x += sin(w + aSeed * 21.0) * 0.30 * aDepth;
    pos.y += cos(w * 0.86 + aSeed * 13.0) * 0.26 * aDepth;
    pos.xy += uPointer * (0.35 + aDepth * 1.25);

    pos.y += uExit * (5.0 + aDepth * 9.0);
    pos.xy *= 1.0 + uExit * 0.35;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float radial = clamp(length(position.xy) / 26.0, 0.0, 1.0);
    float lit = smoothstep(radial - 0.35, radial + 0.12, uReveal * 1.45);

    // Each node breathes on its own clock.
    vPulse = 0.55 + 0.45 * sin(uTime * (0.9 + aSeed * 1.6) + aSeed * 30.0);

    vSeed = aSeed;
    vFade = lit * (1.0 - uExit);

    gl_PointSize = aSize * uPixelRatio * (34.0 / max(-mv.z, 1.0)) * (0.75 + vPulse * 0.5);
  }
`;

const nodeFrag = /* glsl */ `
  precision highp float;

  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;

  varying float vSeed;
  varying float vFade;
  varying float vPulse;

  void main() {
    if (vFade <= 0.001) discard;

    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float hot  = pow(core, 6.0);

    // A rare few burn gold; the rest sit in the red family.
    vec3 col = mix(uColorA, uColorB, fract(vSeed * 5.2));
    col = mix(col, uColorHot, step(0.93, fract(vSeed * 17.0)) * 0.85);
    col = mix(col, vec3(1.0), hot * 0.75);

    gl_FragColor = vec4(col, core * vFade * (0.25 + vPulse * 0.6));
  }
`;

type Built = {
  lineGeo: THREE.BufferGeometry;
  nodeGeo: THREE.BufferGeometry;
  lineMat: THREE.ShaderMaterial;
  nodeMat: THREE.ShaderMaterial;
};

function build(nodeCount: number): Built {
  const W = 34;
  const H = 20;

  const px: number[] = [];
  const py: number[] = [];
  const pz: number[] = [];
  const seed: number[] = [];
  const depth: number[] = [];

  // Four corner anchors, plus a cluster around each, so strands genuinely
  // reach in from the corners rather than fading out at the frame edge.
  const corners = [
    [-W / 2, H / 2],
    [W / 2, H / 2],
    [-W / 2, -H / 2],
    [W / 2, -H / 2],
  ];

  for (const [cx, cy] of corners) {
    for (let i = 0; i < 14; i++) {
      const t = i / 14;
      px.push(cx * (1 - t * 0.55) + (Math.random() - 0.5) * 3.4);
      py.push(cy * (1 - t * 0.55) + (Math.random() - 0.5) * 3.0);
      pz.push((Math.random() - 0.5) * 6);
      seed.push(Math.random());
      depth.push(Math.random());
    }
  }

  while (px.length < nodeCount) {
    px.push((Math.random() - 0.5) * W);
    py.push((Math.random() - 0.5) * H);
    pz.push((Math.random() - 0.5) * 6);
    seed.push(Math.random());
    depth.push(Math.random());
  }

  const n = px.length;

  // --- nodes -------------------------------------------------------------
  const nodePos = new Float32Array(n * 3);
  const nodeSeed = new Float32Array(n);
  const nodeSize = new Float32Array(n);
  const nodeDepth = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    nodePos[i * 3] = px[i];
    nodePos[i * 3 + 1] = py[i];
    nodePos[i * 3 + 2] = pz[i];
    nodeSeed[i] = seed[i];
    nodeDepth[i] = depth[i];
    nodeSize[i] = 1.1 + Math.pow(Math.random(), 2.6) * 3.4;
  }

  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute('aSeed', new THREE.BufferAttribute(nodeSeed, 1));
  nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(nodeSize, 1));
  nodeGeo.setAttribute('aDepth', new THREE.BufferAttribute(nodeDepth, 1));
  nodeGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

  // --- strands -----------------------------------------------------------
  // Proximity linking, capped per node so dense pockets don't explode into a
  // solid sheet of geometry.
  const RADIUS = 4.4;
  const MAX_LINKS = 3;
  const linkCount = new Uint8Array(n);
  const lp: number[] = [];
  const lt: number[] = [];
  const ls: number[] = [];
  const ld: number[] = [];

  for (let i = 0; i < n; i++) {
    if (linkCount[i] >= MAX_LINKS) continue;
    for (let j = i + 1; j < n; j++) {
      if (linkCount[i] >= MAX_LINKS) break;
      if (linkCount[j] >= MAX_LINKS) continue;

      const dx = px[i] - px[j];
      const dy = py[i] - py[j];
      if (dx * dx + dy * dy > RADIUS * RADIUS) continue;

      const s = Math.random();
      const d = (depth[i] + depth[j]) * 0.5;

      lp.push(px[i], py[i], pz[i], px[j], py[j], pz[j]);
      lt.push(0, 1);
      ls.push(s, s);
      ld.push(d, d);

      linkCount[i]++;
      linkCount[j]++;
    }
  }

  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
  lineGeo.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(lt), 1));
  lineGeo.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(ls), 1));
  lineGeo.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(ld), 1));
  lineGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

  const shared = () => ({
    uTime: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uReveal: { value: 0 },
    uExit: { value: 0 },
    uColorA: { value: PALETTE.crimson.clone() },
    uColorB: { value: PALETTE.red.clone() },
    uColorHot: { value: PALETTE.gold.clone() },
  });

  const lineMat = new THREE.ShaderMaterial({
    vertexShader: lineVert,
    fragmentShader: lineFrag,
    uniforms: shared(),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const nodeMat = new THREE.ShaderMaterial({
    vertexShader: nodeVert,
    fragmentShader: nodeFrag,
    uniforms: { ...shared(), uPixelRatio: { value: 1 }, uColorB: { value: PALETTE.redSoft.clone() } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  return { lineGeo, nodeGeo, lineMat, nodeMat };
}

export default function QuantumWeb({ nodes = 220 }: { nodes?: number }) {
  const group = useRef<THREE.Group>(null);
  const reveal = useRef(0);
  const pointer = useRef(new THREE.Vector2());

  const { lineGeo, nodeGeo, lineMat, nodeMat } = useMemo(() => build(nodes), [nodes]);

  useEffect(
    () => () => {
      lineGeo.dispose();
      nodeGeo.dispose();
      lineMat.dispose();
      nodeMat.dispose();
    },
    [lineGeo, nodeGeo, lineMat, nodeMat],
  );

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    const { scene, sceneProgress } = scrollStore.get();
    const active = scene === 'hero';

    // Boot-up runs on its own clock so the web powers on when the page loads,
    // independent of scroll.
    if (active) reveal.current = Math.min(1, reveal.current + delta / 1.8);

    // The web is hero-only: it exits on scroll and is skipped entirely once
    // another section owns the camera.
    const exit = active ? THREE.MathUtils.clamp(sceneProgress / 0.75, 0, 1) : 1;
    g.visible = active || exit < 0.999;
    if (!g.visible) return;

    const k = 1 - Math.exp(-6 * delta);
    pointer.current.x += (state.pointer.x * 0.9 - pointer.current.x) * k;
    pointer.current.y += (state.pointer.y * 0.55 - pointer.current.y) * k;

    for (const m of [lineMat, nodeMat]) {
      m.uniforms.uTime.value += delta;
      m.uniforms.uReveal.value = reveal.current;
      m.uniforms.uExit.value = exit;
      (m.uniforms.uPointer.value as THREE.Vector2).copy(pointer.current);
    }
    nodeMat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
  });

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
      <points geometry={nodeGeo} material={nodeMat} frustumCulled={false} />
    </group>
  );
}

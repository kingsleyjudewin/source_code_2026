'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scroll';
import { SCENE_MOODS } from '@/lib/scenes';

/**
 * Volumetric deep-space backdrop.
 *
 * Drawn as a single full-screen triangle with the matrices bypassed entirely —
 * the vertex shader emits clip-space directly. That means it always covers the
 * viewport no matter where the camera is, costs one draw call, and never needs
 * a resize handler.
 */
const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 1.0, 1.0); // z=1 -> far plane
  }
`;

const frag = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uAspect;
  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uDensity;
  uniform float uVelocity;
  uniform vec3  uVoid;

  // -- value noise + fbm ---------------------------------------------------
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
          dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
          dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.80, 0.60, -0.60, 0.80); // decorrelates the octaves
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);

    float t = uTime * 0.018;

    // Two counter-drifting noise fields, warped by a third. The warp is what
    // stops it reading as "clouds" and starts it reading as "nebula".
    vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 + vec2(5.2, 1.3) - t));
    vec2 r = vec2(
      fbm(p * 2.4 + 3.5 * q + vec2(1.7, 9.2) + t * 1.4),
      fbm(p * 2.4 + 3.5 * q + vec2(8.3, 2.8) - t * 1.1)
    );
    float f = fbm(p * 2.0 + 3.2 * r);

    float cloud = smoothstep(-0.15, 0.85, f);
    cloud *= uDensity;

    // Colour ramp: deep void -> primary -> secondary at the bright cores.
    vec3 col = uVoid;                                        // per-scene base
    col = mix(col, uColorA, clamp(cloud * 0.85, 0.0, 1.0));
    col = mix(col, uColorB, clamp(pow(cloud, 2.4) * 1.15, 0.0, 1.0));

    // Core glow follows the warp field, giving the "energy inside the cloud" look.
    float core = pow(clamp(length(r) * 0.9, 0.0, 1.0), 3.0);
    col += uColorB * core * 0.55 * uDensity;

    // Scroll velocity stretches the field vertically — cheap warp-speed cue.
    float streak = abs(uVelocity) * 0.0025;
    col += uColorA * streak * smoothstep(0.6, 0.0, abs(p.y)) * 0.4;

    // Vignette keeps the type legible over the brightest cores.
    float vig = 1.0 - smoothstep(0.45, 1.25, length(p));
    col *= mix(0.55, 1.0, vig);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function Nebula() {
  // A single oversized triangle beats a quad: no diagonal seam, 1 fewer vertex,
  // and the GPU rasterises it in one pass.
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));
    return g;
  }, []);

/**
 * The material is owned here, not declared as <shaderMaterial>.
 *
 * If `uniforms` is passed as a JSX prop, React re-applies it whenever this component re-renders, and the
 * object mutated in the render loop stops being the one the compiled program
 * reads — the uniform silently freezes at its initial value. Owning the material
 * guarantees a single uniforms object for the lifetime of the mesh.
 */
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: {
          uTime: { value: 0 },
          uAspect: { value: 1 },
          uColorA: { value: new THREE.Color('#1b4fd8') },
          uColorB: { value: new THREE.Color('#7a3cff') },
          uDensity: { value: 0.85 },
          uVelocity: { value: 0 },
          uVoid: { value: new THREE.Color('#050816') },
        },
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );

  const uniforms = material.uniforms;

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  useFrame((state, delta) => {
    const u = uniforms;
    u.uTime.value += delta;
    u.uAspect.value = state.viewport.aspect;

    const { scene, velocity } = scrollStore.get();
    const target = SCENE_MOODS[scene] ?? SCENE_MOODS.hero;

    // Frame-rate independent lerp. 1 - e^(-k·dt) keeps the easing identical at
    // 30fps and 144fps, which a naive `lerp(x, y, 0.05)` does not.
    const k = 1 - Math.exp(-1.8 * delta);
    u.uColorA.value.lerp(target.colorA, k);
    u.uColorB.value.lerp(target.colorB, k);
    (u.uVoid.value as THREE.Color).lerp(target.voidColor, k);
    u.uDensity.value += (target.density - u.uDensity.value) * k;
    u.uVelocity.value += (velocity - u.uVelocity.value) * (1 - Math.exp(-6 * delta));
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={-1000} />;
}

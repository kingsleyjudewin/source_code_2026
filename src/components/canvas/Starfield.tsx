'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scroll';
import { SCENE_MOODS } from '@/lib/scenes';

/**
 * Deep-field starscape the camera travels through.
 *
 * Stars are laid out in a long cylinder around the camera and recycled on the Z
 * axis, so travel is infinite without ever reallocating the buffer. All motion
 * happens on the GPU — the CPU only updates four uniforms per frame.
 */
const vert = /* glsl */ `
  precision highp float;

  attribute float aSize;
  attribute float aSeed;
  attribute vec3  aTint;

  uniform float uTime;
  uniform float uTravel;
  uniform float uVelocity;
  uniform float uPixelRatio;
  uniform float uStars;

  varying float vFade;
  varying vec3  vTint;
  varying float vTwinkle;

  void main() {
    vec3 pos = position;

    // Recycle along Z: modulo the travelled distance into the field depth.
    float depth = 260.0;
    pos.z = mod(pos.z + uTravel, depth) - depth * 0.5;

    // Scroll velocity stretches stars toward the camera -> warp streaks.
    float warp = clamp(abs(uVelocity) * 0.02, 0.0, 6.0);
    pos.xy *= 1.0 + warp * 0.02;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = -mv.z;
    // Fade in from the far plane and out as they pass the camera.
    vFade = smoothstep(130.0, 60.0, dist) * smoothstep(0.5, 8.0, dist) * uStars;

    vTwinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 24.0);
    vTint = aTint;

    gl_PointSize = aSize * uPixelRatio * (1.0 + warp * 0.5) * (60.0 / max(dist, 1.0));
  }
`;

const frag = /* glsl */ `
  precision highp float;

  varying float vFade;
  varying vec3  vTint;
  varying float vTwinkle;

  void main() {
    // Round sprite with a soft core — cheaper and sharper than a texture fetch.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float halo = pow(core, 3.0);

    float a = vFade * vTwinkle * core;
    vec3 col = mix(vTint, vec3(1.0), halo * 0.8);

    gl_FragColor = vec4(col * (0.6 + halo * 1.6), a);
  }
`;

const STAR_TINTS = ['#ffffff', '#bcd8ff', '#ffe9c4', '#9fd5ff', '#e4c9ff'].map(
  (c) => new THREE.Color(c),
);

/**
 * The material is owned here, not declared as <shaderMaterial>.
 *
 * If `uniforms` is passed as a JSX prop, React re-applies it whenever this
 * component re-renders (the quality tier can change `count` at runtime), and the
 * object mutated in the render loop stops being the one the compiled program
 * reads — the uniform silently freezes at its initial value. Owning the material
 * guarantees a single uniforms object for the lifetime of the mesh.
 */
export default function Starfield({ count = 6000 }: { count?: number }) {
  const travel = useRef(0);

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    const tints = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Cylindrical shell: dense enough near the axis to read as a corridor,
      // sparse at the edges so it never looks like a wall of dots.
      const angle = Math.random() * Math.PI * 2;
      const radius = 8 + Math.pow(Math.random(), 0.55) * 70;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.sin(angle) * radius * 0.75;
      positions[i * 3 + 2] = Math.random() * 260 - 130;

      sizes[i] = 0.6 + Math.pow(Math.random(), 3) * 3.2;
      seeds[i] = Math.random();

      const tint = STAR_TINTS[(Math.random() * STAR_TINTS.length) | 0];
      tints[i * 3] = tint.r;
      tints[i * 3 + 1] = tint.g;
      tints[i * 3 + 2] = tint.b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aTint', new THREE.BufferAttribute(tints, 3));
    // Manual bounds: computing them from a recycled field is meaningless and
    // frustum culling a field that surrounds the camera only causes pop-out.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 200);

    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },
        uTravel: { value: 0 },
        uVelocity: { value: 0 },
        uPixelRatio: { value: 1 },
        uStars: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: g, material };
  }, [count]);

  const uniforms = material.uniforms;

  useEffect(
    () => () => {
      material.dispose();
      geometry.dispose();
    },
    [material, geometry],
  );

  useFrame((state, delta) => {
    const { scene, velocity } = scrollStore.get();
    const mood = SCENE_MOODS[scene] ?? SCENE_MOODS.hero;

    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    // Base drift + a push proportional to scroll speed.
    travel.current += delta * (2.2 * mood.drift + Math.abs(velocity) * 0.35);
    uniforms.uTravel.value = travel.current;

    const k = 1 - Math.exp(-7 * delta);
    uniforms.uVelocity.value += (velocity - uniforms.uVelocity.value) * k;
    uniforms.uStars.value += (mood.stars - uniforms.uStars.value) * (1 - Math.exp(-2 * delta));
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

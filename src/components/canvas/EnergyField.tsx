'use client';

import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollStore } from '@/lib/scroll';
import { SCENE_MOODS } from '@/lib/scenes';

/**
 * Ambient energy motes that hang in front of the nebula and take on each
 * section's accent colour. This is the layer doing most of the "the whole page
 * is alive" work between the hero and the finale.
 */
const vert = /* glsl */ `
  precision highp float;

  attribute float aSeed;
  attribute float aSize;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uSpread;

  varying float vSeed;
  varying float vDepth;

  void main() {
    vec3 pos = position;

    // Lissajous drift — non-repeating over any sane session length.
    float t = uTime * (0.12 + aSeed * 0.22);
    pos.x += sin(t * 1.3 + aSeed * 31.0) * 2.4;
    pos.y += cos(t * 1.1 + aSeed * 17.0) * 1.9;
    pos.z += sin(t * 0.7 + aSeed * 23.0) * 2.2;

    pos.xy *= uSpread;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    vSeed = aSeed;
    vDepth = smoothstep(70.0, 8.0, -mv.z);
    gl_PointSize = aSize * uPixelRatio * (36.0 / max(-mv.z, 1.0));
  }
`;

const frag = /* glsl */ `
  precision highp float;

  uniform vec3  uColorA;
  uniform vec3  uColorB;
  uniform float uTime;
  uniform float uOpacity;

  varying float vSeed;
  varying float vDepth;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float flicker = 0.6 + 0.4 * sin(uTime * 2.0 + vSeed * 40.0);

    vec3 col = mix(uColorA, uColorB, vSeed);
    col = mix(col, vec3(1.0), pow(core, 5.0) * 0.6);

    gl_FragColor = vec4(col, core * vDepth * flicker * uOpacity);
  }
`;

/**
 * The material is owned here, not declared as <shaderMaterial>.
 *
 * If `uniforms` is passed as a JSX prop, React re-applies it whenever this
 * component re-renders (the quality tier can change `count` at runtime), and the
 * object mutated in the render loop stops being the one the compiled program
 * reads — the uniform silently freezes at its initial value. Owning the material
 * guarantees a single uniforms object for the lifetime of the mesh.
 */
export default function EnergyField({ count = 3000 }: { count?: number }) {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 46;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 44 - 4;
      seeds[i] = Math.random();
      sizes[i] = 0.5 + Math.pow(Math.random(), 2.5) * 2.6;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

    const material = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
        uSpread: { value: 1 },
        uOpacity: { value: 0.7 },
        uColorA: { value: new THREE.Color('#4cc9ff') },
        uColorB: { value: new THREE.Color('#a06bff') },
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
    uniforms.uTime.value += delta;
    uniforms.uPixelRatio.value = state.gl.getPixelRatio();

    const { scene, sceneProgress } = scrollStore.get();
    const mood = SCENE_MOODS[scene] ?? SCENE_MOODS.hero;

    const k = 1 - Math.exp(-2.2 * delta);
    uniforms.uColorA.value.lerp(mood.colorA, k);
    uniforms.uColorB.value.lerp(mood.colorB, k);

    // Motes crowd in toward the centre of a section and disperse at its edges,
    // so each transition breathes rather than cutting.
    const centre = 1 - Math.abs(sceneProgress - 0.5) * 2;
    const spread = 1.15 - centre * 0.25;
    uniforms.uSpread.value += (spread - uniforms.uSpread.value) * k;
    uniforms.uOpacity.value += (0.35 + centre * 0.5 - uniforms.uOpacity.value) * k;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

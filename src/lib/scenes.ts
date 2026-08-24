import type { SceneId } from './scroll';
import * as THREE from 'three';

/**
 * Per-scene atmosphere. The global canvas lerps between these as the user
 * scrolls, which is what makes every section feel like a different universe
 * without ever unmounting and remounting the renderer.
 */
export type SceneMood = {
  /** Dominant nebula hue. */
  colorA: THREE.Color;
  /** Secondary / rim hue. */
  colorB: THREE.Color;
  /** Nebula density 0..1. */
  density: number;
  /** Star field drift speed multiplier. */
  drift: number;
  /** Bloom intensity. */
  bloom: number;
  /** Camera dolly z offset. */
  dolly: number;
  /** Starfield opacity multiplier. The hero is a dark web, not a space scene. */
  stars: number;
  /** Base void colour behind the nebula. */
  voidColor: THREE.Color;
};

const mood = (
  a: string,
  b: string,
  density: number,
  drift: number,
  bloom: number,
  dolly: number,
  stars = 1,
  voidHex = '#050816',
): SceneMood => ({
  colorA: new THREE.Color(a),
  colorB: new THREE.Color(b),
  density,
  drift,
  bloom,
  dolly,
  stars,
  voidColor: new THREE.Color(voidHex),
});

export const SCENE_MOODS: Record<SceneId, SceneMood> = {
  //                    primary    secondary  dens  drift bloom dolly stars
  hero:                mood('#160309', '#24060f', 0.06, 0.25, 0.55, 0, 0.12, '#060406'),
  'brand-new-circuit': mood('#1f6dff', '#35d0ff', 0.42, 0.35, 0.85, -2.5),
  'daily-bugle':       mood('#c8102e', '#e8e2d4', 0.30, 0.30, 0.70, -2.0),
  brainverse:          mood('#1f7dff', '#00e0ff', 0.55, 0.55, 0.95, -2.2),
  'the-gauntlet':      mood('#7b2fff', '#ff2f9c', 1.00, 1.20, 1.45, 0.5),
  'stark-forge':       mood('#00b894', '#12e6c4', 0.38, 0.85, 0.90, -3.0),
  team:                mood('#2f5fd8', '#8f6bff', 0.45, 0.4, 0.80, -2.0),
  finale:              mood('#4c7bff', '#ffb43c', 1.00, 1.6, 1.60, 1.2),
};

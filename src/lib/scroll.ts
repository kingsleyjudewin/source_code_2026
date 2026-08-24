'use client';

import { create } from './store';

/**
 * Global scroll state shared between the DOM sections and the single persistent
 * WebGL canvas. The canvas never reads the DOM directly — it subscribes here —
 * which keeps layout reads out of the render loop.
 */
export type ScrollState = {
  /** 0..1 across the whole document. */
  progress: number;
  velocity: number;
  /** Which narrative section owns the camera right now. */
  scene: SceneId;
  /** 0..1 within the active section. */
  sceneProgress: number;
};

export type SceneId =
  | 'hero'
  | 'brand-new-circuit'
  | 'daily-bugle'
  | 'brainverse'
  | 'the-gauntlet'
  | 'stark-forge'
  | 'team'
  | 'finale';

export const scrollStore = create<ScrollState>({
  progress: 0,
  velocity: 0,
  scene: 'hero',
  sceneProgress: 0,
});

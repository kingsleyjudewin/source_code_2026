'use client';

import dynamic from 'next/dynamic';

/**
 * The WebGL layer is loaded browser-only and lazily.
 *
 * three + postprocessing is by far the heaviest thing on the page; keeping it
 * out of the server bundle and off the critical path is what lets the hero text
 * paint immediately while the scene streams in behind the preloader.
 */
const SceneRoot = dynamic(() => import('./SceneRoot'), {
  ssr: false,
  loading: () => null,
});

export default function CanvasLayer() {
  return <SceneRoot />;
}

'use client';

import { useSyncExternalStore } from 'react';

/**
 * A ~40-line external store.
 *
 * Deliberately not Zustand: the only cross-tree state here is scroll, and it
 * updates every frame. This lets the WebGL layer read `.get()` inside the render
 * loop with zero React involvement, while DOM components can still subscribe
 * through `useStore` when they genuinely need to re-render.
 */
export type Store<T> = {
  get: () => T;
  set: (patch: Partial<T>) => void;
  subscribe: (fn: () => void) => () => void;
};

export function create<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => state,
    set(patch) {
      let changed = false;
      for (const k in patch) {
        if (!Object.is(state[k as keyof T], patch[k as keyof T])) {
          changed = true;
          break;
        }
      }
      if (!changed) return;
      state = { ...state, ...patch };
      listeners.forEach((fn) => fn());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** Subscribe a React component to a slice. Re-renders only when the slice changes. */
export function useStore<T extends object, S>(store: Store<T>, selector: (s: T) => S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get()),
  );
}

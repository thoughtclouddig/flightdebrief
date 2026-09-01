"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A localStorage value as a React store.
 *
 * useSyncExternalStore rather than useState + useEffect. Reading storage in an
 * effect and calling setState means one wrong render on every mount (React
 * flags it, and the user sees the default flash before the stored value lands).
 * This subscribes properly, so the first client render already has the real
 * value and every component sharing a key stays in step.
 *
 * The server snapshot is always null: there is no storage during SSR, and
 * pretending otherwise is what produces hydration mismatches.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Same-tab writes don't fire `storage`, so components are notified directly. */
function emit() {
  listeners.forEach((l) => l());
}

export function useStored(key: string): [string | null, (value: string | null) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key),
    () => null,
  );

  const set = useCallback(
    (next: string | null) => {
      try {
        if (next === null) window.localStorage.removeItem(key);
        else window.localStorage.setItem(key, next);
      } catch {
        // Quota exceeded (a large photo) or storage disabled. Not worth
        // failing the interaction over -- the write is a convenience.
      }
      emit();
    },
    [key],
  );

  return [value, set];
}

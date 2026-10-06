"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

// False during server rendering and the hydration pass, true afterwards.
// Components that hydrate late (e.g. inside a Suspense boundary) use it to
// avoid rendering client-only data — like a query cache filled by another
// component — into markup the server didn't produce.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false
  );
}

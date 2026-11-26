"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * React 19 SSR-safe hydration check without synchronous setState inside useEffect.
 * Returns `false` on the server and during initial hydration, then `true` on the client.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

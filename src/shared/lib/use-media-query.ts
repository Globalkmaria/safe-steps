"use client";

import { useSyncExternalStore } from "react";

/**
 * SSR 안전한 matchMedia 훅.
 * 서버에서는 판단이 불가능하므로 null 을 반환한다 — hydration mismatch 방지.
 * 호출부는 null 을 "아직 모름"으로 다뤄야 한다.
 */
export function useMediaQuery(query: string): boolean | null {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

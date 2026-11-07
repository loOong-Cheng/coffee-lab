import { useSyncExternalStore } from 'react';

/** Live CSS media query match (false when matchMedia is unavailable, e.g. some test envs). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener?.('change', onChange);
      return () => mql.removeEventListener?.('change', onChange);
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

/** Phone-sized layout breakpoint used by feature pages (matches the shell's bottom-nav layout). */
export const PHONE_QUERY = '(max-width: 640px)';

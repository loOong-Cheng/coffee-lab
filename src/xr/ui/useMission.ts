import { useEffect, useRef, useState } from 'react';
import type { CoreState, Store } from '../mission/core';

export function shallowEqual<T>(a: T, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (!Object.is((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  return true;
}

/**
 * Subscribe to a slice of mission state. The scene dispatches a TICK every
 * frame, so components only re-render when their (rounded) slice changes.
 */
export function useMissionSelector<S extends CoreState, T>(
  store: Pick<Store<S, never>, 'getState' | 'subscribe'>,
  selector: (s: S) => T,
  isEqual: (a: T, b: T) => boolean = shallowEqual,
): T {
  const [value, setValue] = useState(() => selector(store.getState()));
  const selRef = useRef(selector);
  const eqRef = useRef(isEqual);
  const valRef = useRef(value);
  selRef.current = selector;
  eqRef.current = isEqual;
  useEffect(() => {
    const check = () => {
      const next = selRef.current(store.getState());
      if (!eqRef.current(valRef.current, next)) {
        valRef.current = next;
        setValue(next);
      }
    };
    check();
    return store.subscribe(check);
  }, [store]);
  return value;
}

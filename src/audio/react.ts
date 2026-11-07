/** Optional React helpers. The engine itself (./index) stays framework-agnostic. */
import { useCallback } from 'react';
import { audio } from './index';
import type { SfxName } from './index';

/** Stable `play` callback for components: `const sfx = useSfx(); sfx('correct')`. */
export function useSfx(): (name: SfxName, opts?: { volume?: number; pan?: number }) => void {
  return useCallback((name, opts) => audio.play(name, opts), []);
}

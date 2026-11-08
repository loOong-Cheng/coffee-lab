import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { audio } from '../audio';
import { getLearnerState, learnerActions, useLearner } from '../state';
import { applyDocumentAttributes } from './document';

/** prefs.locale / reducedMotion → <html lang>, data-reduced-motion (and data-theme when a theme pref exists). */
export function useDocumentSync(): void {
  const locale = useLearner((s) => s.prefs.locale);
  const reducedMotion = useLearner((s) => s.prefs.reducedMotion);
  const theme = useLearner((s) => s.prefs.theme);
  useEffect(() => {
    applyDocumentAttributes({ locale, reducedMotion }, theme);
    if (reducedMotion !== 'system' || typeof window === 'undefined' || !window.matchMedia) return;
    // Follow live OS changes while the pref is 'system'.
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => applyDocumentAttributes({ locale, reducedMotion }, theme);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, [locale, reducedMotion, theme]);
}

function safely(fn: () => unknown): void {
  try {
    const r = fn();
    if (r && typeof (r as Promise<unknown>).catch === 'function') (r as Promise<unknown>).catch(() => {});
  } catch {
    /* audio must never break the app */
  }
}

/** prefs.sfx / music / volume → audio engine; unlock audio on the first user gesture (autoplay policy). */
export function useAudioSync(): void {
  const sfx = useLearner((s) => s.prefs.sfx);
  const music = useLearner((s) => s.prefs.music);
  const volume = useLearner((s) => s.prefs.volume);
  const musicMood = useLearner((s) => s.prefs.musicMood);
  useEffect(() => safely(() => audio.setSfxEnabled(sfx)), [sfx]);
  useEffect(() => safely(() => audio.setMusicMood(musicMood)), [musicMood]);
  useEffect(() => safely(() => audio.setMusicEnabled(music)), [music]);
  useEffect(() => safely(() => audio.setVolume(volume)), [volume]);
  useEffect(() => {
    const events = ['pointerdown', 'keydown', 'touchend'] as const;
    const unlock = () => {
      safely(() => audio.unlock());
      for (const e of events) window.removeEventListener(e, unlock, true);
    };
    for (const e of events) window.addEventListener(e, unlock, { capture: true, passive: true });
    return () => {
      for (const e of events) window.removeEventListener(e, unlock, true);
    };
  }, []);
}

/** Routes worth resuming from the home screen's "continue" affordance. */
const RESUMABLE = /^\/(learn|practice)\/[^/]+$|^\/xr$|^\/atlas\/[^/]+$/;

/**
 * On navigation: remember resumable locations, scroll to top and move focus to <main>
 * (so screen-reader/keyboard users land on the new page, not on the clicked nav link).
 */
export function useRouteEffects(mainId: string): void {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    // Keep a more precise saved place for the same screen (e.g. the lesson player's `?step=4&g=…`).
    const saved = getLearnerState().lastLocation?.route;
    if (RESUMABLE.test(pathname) && !saved?.startsWith(`${pathname}?`)) learnerActions.setLastLocation(pathname);
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo?.({ top: 0 });
    const main = document.getElementById(mainId);
    main?.focus({ preventScroll: true });
  }, [pathname, mainId]);
}

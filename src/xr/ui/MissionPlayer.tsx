/**
 * Runs one mission store in 3D (Babylon, lazy) or action-list-only mode.
 * The same store drives the scene, the HUD, the keyboard action list, sounds
 * and the learner-progress record — so every input path is equivalent.
 */
import { useEffect, useRef, useState } from 'react';
import type { Guidance } from '../../domain/contracts';
import { audio } from '../../audio';
import { otherLocale, useI18n } from '../../i18n';
import { learnerActions, useLearner } from '../../state';
import { Button } from '../../ui/primitives/Button';
import { GuidanceSelector } from '../../ui/primitives/Guidance';
import { Kbd } from '../../ui/primitives/misc';
import { announce } from '../../ui/primitives/announcer';
import type { InspectableId } from '../mission/types';
import type { MissionStore } from '../mission/store';
import { buildCompletionEvent, buildSummary, type MissionSummary } from '../mission/summary';
import type { CoffeeLabHandle } from '../scene/CoffeeLabScene';
import { S } from '../strings';
import { ActionPanel } from './ActionPanel';
import { MissionHud, ShotReadout, StationStatus } from './MissionHud';
import { SummaryView } from './SummaryView';
import { useMissionSelector } from './useMission';

/** Attempts already written to learner progress (per store), so remounts never double-record. */
const recorded = new WeakMap<MissionStore, Set<number>>();

function useReducedMotion(): boolean {
  const pref = useLearner((s) => s.prefs.reducedMotion);
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  try {
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export interface MissionPlayerProps {
  store: MissionStore;
  mode: '3d' | 'list';
  xrSupported: boolean;
  touch: boolean;
  onExit(): void;
}

export function MissionPlayer({ store, mode: initialMode, xrSupported, touch, onExit }: MissionPlayerProps) {
  const { t, locale, setLocale } = useI18n();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState(initialMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lab, setLab] = useState<CoffeeLabHandle | null>(null);
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'failed'>(initialMode === '3d' ? 'loading' : 'ready');
  const [inXr, setInXr] = useState(false);
  const [vrError, setVrError] = useState(false);
  const [hover, setHover] = useState<InspectableId | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [summary, setSummary] = useState<MissionSummary | null>(null);
  const [saved, setSaved] = useState(false);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  // ── 3D scene lifecycle (lazy Babylon chunk; disposed on unmount) ──
  useEffect(() => {
    if (mode !== '3d' || !canvasRef.current) return;
    let handle: CoffeeLabHandle | null = null;
    let cancelled = false;
    setSceneState('loading');
    import('../scene/CoffeeLabScene')
      .then(({ createCoffeeLab }) =>
        createCoffeeLab({
          canvas: canvasRef.current!,
          store,
          locale: localeRef.current,
          reducedMotion,
          xrSupported,
          onXrChange: (v) => setInXr(v),
          onHover: (id) => setHover(id),
          onLocaleToggle: () => setLocale(otherLocale(localeRef.current)),
        }),
      )
      .then((h) => {
        if (cancelled) {
          h.dispose();
          return;
        }
        handle = h;
        setLab(h);
        setSceneState('ready');
      })
      .catch(() => {
        if (!cancelled) setSceneState('failed');
      });
    return () => {
      cancelled = true;
      handle?.dispose();
      setLab(null);
    };
    // reducedMotion/xrSupported are read once per scene; locale is pushed below.
  }, [mode, store]);

  useEffect(() => lab?.setLocale(locale), [lab, locale]);

  // Test hook (dev server or ?xrtest): lets browser tests project 3D targets and drag with a real mouse.
  useEffect(() => {
    if (!lab) return;
    const enabled = import.meta.env.DEV || new URLSearchParams(window.location.search).has('xrtest');
    if (!enabled) return;
    const w = window as unknown as { __coffeeLabXr?: CoffeeLabHandle };
    w.__coffeeLabXr = lab;
    return () => {
      if (w.__coffeeLabXr === lab) delete w.__coffeeLabXr;
    };
  }, [lab]);

  // ── sounds (any input path) ──
  useEffect(
    () =>
      store.onEffects((effects) => {
        for (const e of effects) if (e.type === 'sound') audio.play(e.name);
      }),
    [store],
  );

  // ── screen-reader announcements of feedback ──
  const fb = useMissionSelector(store, (s) => s.feedback);
  useEffect(() => {
    if (fb && fb.code !== 'guidance-changed') announce(t(fb.text), fb.kind === 'mistake' ? 'assertive' : 'polite');
    // announce once per feedback seq
  }, [fb?.seq]);

  // ── completion → summary + learner progress (simulated evidence) ──
  const status = useMissionSelector(store, (s) => s.status);
  const attempt = useMissionSelector(store, (s) => s.attempt);
  const guidance = useMissionSelector(store, (s) => s.guidance);
  useEffect(() => {
    if (status !== 'complete') {
      setSummary(null);
      setSaved(false);
      return;
    }
    const sum = buildSummary(store.getState());
    setSummary(sum);
    const done = recorded.get(store) ?? new Set<number>();
    if (done.has(attempt)) {
      setSaved(true);
      return;
    }
    done.add(attempt);
    recorded.set(store, done);
    try {
      learnerActions.recordEvent(buildCompletionEvent(sum, { immersive: lab?.inXR() ?? false, touch }));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [status, attempt, store, lab, touch]);

  // ── keyboard shortcuts: H = hint, P = pause/resume ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const s = store.getState();
      if (e.key === 'h' || e.key === 'H') store.dispatch({ type: 'REQUEST_HINT', source: 'panel' });
      else if (e.key === 'p' || e.key === 'P') store.dispatch({ type: s.status === 'paused' ? 'RESUME' : 'PAUSE' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  // ── simulated time without a 3D render loop (action-list mode or scene failure) ──
  const needsTicker = !(mode === '3d' && sceneState !== 'failed');
  useEffect(() => {
    if (!needsTicker) return;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      if (dt > 0) store.dispatch({ type: 'TICK', dtSec: dt });
    }, 100);
    return () => clearInterval(id);
  }, [needsTicker, store]);

  const exit = async () => {
    await lab?.exitVR();
    onExit();
  };
  const setTier = (g: Guidance) => store.dispatch({ type: 'SET_GUIDANCE', guidance: g });
  const show3d = mode === '3d' && sceneState !== 'failed';

  return (
    <section className="xr-player" data-mode={show3d ? '3d' : 'list'} aria-label={t(S.missionTitle)}>
      <div className="xr-stage" data-testid="xr-stage">
        {show3d ? (
          <canvas ref={canvasRef} className="xr-canvas" data-testid="xr-canvas" aria-label={t(S.controlsHelpPointer)} />
        ) : (
          <StationStatus store={store} />
        )}
        {show3d && sceneState === 'loading' ? <p className="xr-stage__note">{t(S.loading3d)}</p> : null}
        {mode === '3d' && sceneState === 'failed' ? (
          <p className="xr-stage__note" role="alert">
            {t(S.sceneFailed)}
          </p>
        ) : null}

        {summary ? (
          <div className="xr-stage__summary">
            <SummaryView
              summary={summary}
              saved={saved}
              onAgain={() => store.dispatch({ type: 'RESET' })}
              onTier={(g) => {
                store.dispatch({ type: 'RESET' });
                setTier(g);
              }}
            />
          </div>
        ) : (
          <div className="xr-stage__hud">
            <MissionHud store={store} hover={hover} />
            <ShotReadout store={store} />
          </div>
        )}

        {status === 'paused' ? (
          <div className="xr-stage__paused">
            <Button size="lg" icon="play" onClick={() => store.dispatch({ type: 'RESUME' })}>
              {t(S.resume)}
            </Button>
          </div>
        ) : null}

        {xrSupported && lab?.xrReady && !inXr ? (
          <div className="xr-stage__vr">
            <Button
              size="lg"
              icon="headset"
              onClick={async () => {
                setVrError(false);
                const r = await lab.enterVR();
                if (!r.ok) setVrError(true);
              }}
            >
              {t(S.enterVR)}
            </Button>
            {vrError ? (
              <p className="xr-stage__note" role="alert">
                {t(S.vrFailed)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <aside className="xr-side">
        <div className="xr-toolbar" role="toolbar" aria-label={t(S.missionShort)}>
          <Button size="sm" variant="secondary" icon="lightbulb" onClick={() => store.dispatch({ type: 'REQUEST_HINT', source: 'panel' })} disabled={status === 'complete'}>
            {t(S.hint)} <Kbd>H</Kbd>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={status === 'paused' ? 'play' : 'pause'}
            onClick={() => store.dispatch({ type: status === 'paused' ? 'RESUME' : 'PAUSE' })}
            disabled={status === 'complete'}
          >
            {status === 'paused' ? t(S.resume) : t(S.pause)} <Kbd>P</Kbd>
          </Button>
          {confirmReset ? (
            <span className="xr-confirm" role="group" aria-label={t(S.resetConfirm)}>
              <span className="xr-small">{t(S.resetConfirm)}</span>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  store.dispatch({ type: 'RESET' });
                  setConfirmReset(false);
                }}
              >
                {t(S.reset)}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
                ✕
              </Button>
            </span>
          ) : (
            <Button size="sm" variant="secondary" icon="repeat" onClick={() => setConfirmReset(true)}>
              {t(S.reset)}
            </Button>
          )}
          {show3d && lab && !inXr ? (
            <Button size="sm" variant="ghost" icon="eye" onClick={() => lab.resetView()}>
              {t(S.resetView)}
            </Button>
          ) : null}
          {inXr ? (
            <Button size="sm" variant="secondary" icon="headset" onClick={() => void lab?.exitVR()}>
              {t(S.exitVR)}
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" icon="back" onClick={() => void exit()}>
            {t(S.exit)}
          </Button>
        </div>

        <div className="xr-side__block">
          <GuidanceSelector value={guidance} onChange={setTier} locale={locale} label={t(S.guidanceHeading)} />
        </div>

        <ActionPanel store={store} headingId="xr-actions-h" />

        {mode === '3d' ? (
          <p className="xr-small xr-muted">
            {t(S.controlsHelpPointer)} {xrSupported ? t(S.controlsHelpXr) : ''}
          </p>
        ) : null}
        {mode === '3d' && sceneState === 'failed' ? (
          <Button size="sm" variant="ghost" onClick={() => setMode('list')}>
            {t(S.playList)}
          </Button>
        ) : null}
      </aside>
    </section>
  );
}

/**
 * Runs one mission (any MissionDef) in 3D (Babylon, lazy) or action-list-only
 * mode. The same store drives the scene, HUD, keyboard action list, sounds and
 * the learner-progress record — every input path is equivalent.
 */
import { useEffect, useRef, useState } from 'react';
import type { Guidance, LocalizedText } from '../../domain/contracts';
import { audio } from '../../audio';
import { otherLocale, useI18n } from '../../i18n';
import { learnerActions, useLearner } from '../../state';
import { Button } from '../../ui/primitives/Button';
import { GuidanceSelector } from '../../ui/primitives/Guidance';
import { Kbd } from '../../ui/primitives/misc';
import { announce } from '../../ui/primitives/announcer';
import { completionEvent, type AnyMission, type AnyStore, type MissionResult, type SceneHandle } from '../mission/core';
import { S } from '../strings';
import { ActionPanel } from './ActionPanel';
import { MissionHud, ReadoutView, StationStatus } from './MissionHud';
import { PourControls } from './PourControls';
import { SummaryView } from './SummaryView';
import { useMissionSelector } from './useMission';

/** Attempts already written to learner progress (per store), so remounts never double-record. */
const recorded = new WeakMap<AnyStore, Set<number>>();

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
  def: AnyMission;
  store: AnyStore;
  mode: '3d' | 'list';
  xrSupported: boolean;
  /** Phone/tablet-class screen → the simulated result is recorded under the `mobile` mode (else `desktop`). */
  mobile: boolean;
  onExit(): void;
}

export function MissionPlayer({ def, store, mode: initialMode, xrSupported, mobile, onExit }: MissionPlayerProps) {
  const { t, locale, setLocale } = useI18n();
  const reducedMotion = useReducedMotion();
  const [mode, setMode] = useState(initialMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lab, setLab] = useState<SceneHandle | null>(null);
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'failed'>(initialMode === '3d' ? 'loading' : 'ready');
  const [inXr, setInXr] = useState(false);
  const [vrError, setVrError] = useState(false);
  const [hover, setHover] = useState<{ name: LocalizedText; purpose: LocalizedText } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [result, setResult] = useState<MissionResult | null>(null);
  const [saved, setSaved] = useState(false);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  // ── 3D scene lifecycle (lazy Babylon chunk; disposed on unmount) ──
  useEffect(() => {
    if (mode !== '3d' || !canvasRef.current) return;
    let handle: SceneHandle | null = null;
    let cancelled = false;
    setSceneState('loading');
    def
      .loadScene()
      .then((factory) =>
        factory({
          canvas: canvasRef.current!,
          store,
          def,
          locale: localeRef.current,
          reducedMotion,
          xrSupported,
          onXrChange: (v) => setInXr(v),
          onHover: (info) => setHover(info),
          onLocaleToggle: () => setLocale(otherLocale(localeRef.current)),
        }),
      )
      .then((h) => {
        if (cancelled) return h.dispose();
        handle = h;
        setLab(h);
        setSceneState('ready');
      })
      .catch((err: unknown) => {
        if (import.meta.env.DEV) console.error('[xr] 3D scene failed to start', err);
        if (!cancelled) setSceneState('failed');
      });
    return () => {
      cancelled = true;
      handle?.dispose();
      setLab(null);
    };
    // reducedMotion/xrSupported are read once per scene; locale is pushed below.
  }, [mode, store, def]);

  useEffect(() => lab?.setLocale(locale), [lab, locale]);

  // Test hook (dev server or ?xrtest): lets browser tests project 3D targets and drag with a real mouse.
  useEffect(() => {
    if (!lab) return;
    const enabled = import.meta.env.DEV || /[?&]xrtest\b/.test(window.location.search + window.location.hash);
    if (!enabled) return;
    const w = window as unknown as { __coffeeLabXr?: SceneHandle };
    w.__coffeeLabXr = lab;
    return () => {
      if (w.__coffeeLabXr === lab) delete w.__coffeeLabXr;
    };
  }, [lab]);

  // ── sounds (any input path) ──
  useEffect(
    () =>
      store.onEffects((effects) => {
        for (const e of effects) if (e.type === 'sound' && e.name) audio.play(e.name);
      }),
    [store],
  );

  // ── screen-reader announcements of feedback ──
  const fb = useMissionSelector(store, (s) => s.feedback);
  useEffect(() => {
    if (fb && fb.code !== 'guidance-changed') announce(t(fb.text), fb.kind === 'mistake' ? 'assertive' : 'polite');
    // announce once per feedback seq
  }, [fb?.seq]);

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

  // ── completion → summary + learner progress (simulated evidence) ──
  const status = useMissionSelector(store, (s) => s.status);
  const attempt = useMissionSelector(store, (s) => s.attempt);
  const guidance = useMissionSelector(store, (s) => s.guidance);
  useEffect(() => {
    if (status !== 'complete') {
      setResult(null);
      setSaved(false);
      return;
    }
    const r = def.result(store.getState());
    setResult(r);
    const done = recorded.get(store) ?? new Set<number>();
    if (done.has(attempt)) {
      setSaved(true);
      return;
    }
    done.add(attempt);
    recorded.set(store, done);
    try {
      learnerActions.recordEvent(completionEvent(def, r, { immersive: lab?.inXR() ?? false, touch: mobile }));
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [status, attempt, store, lab, mobile, def]);

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

  const exit = async () => {
    await lab?.exitVR();
    onExit();
  };
  const setTier = (g: Guidance) => store.dispatch({ type: 'SET_GUIDANCE', guidance: g });
  const show3d = mode === '3d' && sceneState !== 'failed';

  return (
    <section className="xr-player" data-mode={show3d ? '3d' : 'list'} data-mission={def.id} aria-label={t(def.title)}>
      <div className="xr-stage" data-testid="xr-stage">
        {show3d ? (
          <canvas ref={canvasRef} className="xr-canvas" data-testid="xr-canvas" aria-label={t(def.controlsHelp.pointer)} />
        ) : (
          <StationStatus def={def} store={store} />
        )}
        {show3d && sceneState === 'loading' ? <p className="xr-stage__note">{t(S.loading3d)}</p> : null}
        {mode === '3d' && sceneState === 'failed' ? (
          <p className="xr-stage__note" role="alert">
            {t(S.sceneFailed)}
          </p>
        ) : null}

        {result ? (
          <div className="xr-stage__summary">
            <SummaryView
              def={def}
              result={result}
              saved={saved}
              onAgain={() => store.dispatch({ type: 'RESET' })}
              onTier={(g) => {
                store.dispatch({ type: 'RESET' });
                setTier(g);
              }}
            />
          </div>
        ) : (
          <>
            <div className="xr-stage__hud">
              <MissionHud def={def} store={store} hover={hover} />
            </div>
            <ReadoutView def={def} store={store} />
          </>
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
        <div className="xr-toolbar" role="toolbar" aria-label={t(def.short)}>
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

        {def.id === 'pourover-bloom' ? <PourControls store={store} /> : null}
        <ActionPanel def={def} store={store} headingId="xr-actions-h" />

        {mode === '3d' ? (
          <p className="xr-small xr-muted">
            {t(def.controlsHelp.pointer)} {xrSupported ? t(def.controlsHelp.xr) : ''}
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

/**
 * Café Rush UI: lobby → shift (action list and/or 3D) → results. Every input path dispatches the
 * same reducer actions; the action list adds a small game-time handling cost (Standard mode).
 * Best stars come from the learner's `simulated` events (activityId 'rush:<level>').
 */
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import type { Guidance } from '../../../domain/contracts';
import { audio, type SfxName } from '../../../audio';
import { useI18n } from '../../../i18n';
import { learnerActions, useLearner } from '../../../state';
import { Button } from '../../../ui/primitives/Button';
import { Callout } from '../../../ui/primitives/Callout';
import { GuidanceSelector } from '../../../ui/primitives/Guidance';
import { announce } from '../../../ui/primitives/announcer';
import { shallowEqual } from '../../ui/useMission';
import { LEVELS, RELAXED, RUSH_LEVELS, type RushLevelNo } from '../config';
import { drinkName, recipeWall } from '../drinks';
import { explain } from '../judge';
import { coachSuggest, createCoach, createRushStore, listActions, listKey, processProgress, whileBrewsHint, type RushStore } from '../play';
import { bestStarsFromEvents, rushCompletionEvent, rushResult, unlockedLevels, type RushResult } from '../record';
import { createShift, itemIn, listAct, reduce, slotLocked, tick, type PlayerAction, type RushState, type SlotId } from '../sim';
import { R, SLOT_TEXT, customerName, fmtR, itemText } from '../strings';
import './rush.css';

const RushScene = lazy(() => import('./RushScene'));

function useReducedMotion(): boolean {
  const pref = useLearner((s) => s.prefs.reducedMotion);
  if (pref === 'on') return true;
  if (pref === 'off') return false;
  try {
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function useRush<T>(store: RushStore, sel: (s: RushState) => T, eq: (a: T, b: T) => boolean = shallowEqual): T {
  const [v, setV] = useState(() => sel(store.get()));
  const ref = useRef({ sel, eq, v });
  ref.current.sel = sel;
  ref.current.eq = eq;
  useEffect(() => {
    const check = () => {
      const next = ref.current.sel(store.get());
      if (!ref.current.eq(ref.current.v, next)) {
        ref.current.v = next;
        setV(next);
      }
    };
    check();
    return store.subscribe(check);
  }, [store]);
  return v;
}

const SFX: Record<string, SfxName> = {
  'serve-correct': 'correct',
  'serve-partly': 'serve',
  'serve-wrong': 'incorrect',
  'order-timeout': 'whoosh',
  'order-in': 'orderBell',
  'shot-start': 'espresso',
  'steam-start': 'milkSteam',
  'grind-start': 'grind',
  'pour-milk': 'milkPour',
  knock: 'knock',
  'bloom-start': 'bloom',
  'pour-water': 'pour',
  'shift-over': 'complete',
};

/** Test-only fast clock (?xrtest&speed=N, or window.__coffeeLabRushSpeed) so browser tests can finish a shift. */
function testSpeed(): number {
  try {
    const g = (window as unknown as { __coffeeLabRushSpeed?: number }).__coffeeLabRushSpeed;
    if (typeof g === 'number' && g > 0) return Math.min(20, g);
    const q = window.location.search + window.location.hash;
    if (!/[?&]xrtest\b/.test(q)) return 1;
    const m = /[?&]speed=(\d+(?:\.\d+)?)/.exec(q);
    return m ? Math.min(20, Math.max(1, Number(m[1]))) : 1;
  } catch {
    return 1;
  }
}

export interface RushSetup {
  level: RushLevelNo;
  relaxed: boolean;
  guidance: Guidance;
  mode: '3d' | 'list';
}

export function RushGame({ can3d, canVR, mobile }: { can3d: boolean; canVR: boolean; mobile: boolean }) {
  const defaultGuidance = useLearner((s) => s.prefs.defaultGuidance);
  const [setup, setSetup] = useState<RushSetup>({ level: 1, relaxed: false, guidance: defaultGuidance ?? 'guided', mode: 'list' });
  const [playing, setPlaying] = useState<{ setup: RushSetup; seed: number } | null>(null);
  if (playing)
    return (
      <RushPlayer
        key={playing.seed}
        setup={playing.setup}
        seed={playing.seed}
        canVR={canVR}
        mobile={mobile}
        onExit={() => setPlaying(null)}
        onNext={(level) => {
          const next = { ...playing.setup, level };
          setSetup(next);
          setPlaying({ setup: next, seed: Date.now() >>> 0 });
        }}
      />
    );
  return <RushLobby setup={setup} onChange={setSetup} can3d={can3d} onStart={(s) => setPlaying({ setup: s, seed: Date.now() >>> 0 })} />;
}

// ───────────────────────────── lobby ─────────────────────────────
function RushLobby({ setup, onChange, onStart, can3d }: { setup: RushSetup; onChange(s: RushSetup): void; onStart(s: RushSetup): void; can3d: boolean }) {
  const { t, locale } = useI18n();
  const events = useLearner((s) => s.events);
  const best = useMemo(() => bestStarsFromEvents(events), [events]);
  const open = unlockedLevels(best);
  const level = open.includes(setup.level) ? setup.level : 1;
  return (
    <section className="xr-route xr-brief rush-lobby" aria-labelledby="rush-title" data-testid="rush-lobby">
      <p className="xr-eyebrow">
        <Link to="/xr">XR Lab</Link> · {t(R.gameCard)}
      </p>
      <h1 id="rush-title">{t(R.title)}</h1>
      <p className="xr-lead">{t(R.tagline)}</p>
      <Callout kind="info" locale={locale}>
        {t(R.honesty)}
      </Callout>
      <h2 className="xr-section-h">{t(R.levelsHeading)}</h2>
      <ul className="rush-levels">
        {RUSH_LEVELS.map((l) => {
          const locked = !open.includes(l);
          const stars = best[l] ?? 0;
          const cfg = LEVELS[l];
          return (
            <li key={l}>
              <button
                type="button"
                className="rush-level"
                data-testid={`rush-level-${l}`}
                aria-pressed={level === l}
                disabled={locked}
                data-locked={locked || undefined}
                onClick={() => onChange({ ...setup, level: l })}
              >
                <span className="rush-level__name">
                  {t(fmtR(R.level, { n: l }))} · {t(cfg.title)}
                </span>
                <span className="rush-level__stars" aria-label={t(fmtR(R.best, { n: stars }))}>
                  {'★'.repeat(stars)}
                  {'☆'.repeat(3 - stars)}
                </span>
                <span className="xr-small">
                  {locked ? t(R.locked) : best[l] === undefined ? t(R.notPlayed) : t(fmtR(R.best, { n: stars }))}
                </span>
                {cfg.unlocks.length ? (
                  <span className="xr-small xr-muted">
                    {t(R.newDrinks)}: {cfg.unlocks.map((d) => t(drinkName(d))).join(' · ')}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="xr-card">
        <h2>{t(R.options)}</h2>
        <label className="rush-check">
          <input type="checkbox" checked={setup.relaxed} onChange={(e) => onChange({ ...setup, relaxed: e.target.checked })} data-testid="rush-relaxed" />
          <span>{t(R.relaxed)}</span>
        </label>
        <p className="xr-small xr-muted">{t(fmtR(R.relaxedNote, { n: RELAXED.orders }))}</p>
        <GuidanceSelector value={setup.guidance} onChange={(g) => onChange({ ...setup, guidance: g })} locale={locale} variant="full" label={t(R.options)} />
        <div className="xr-row">
          {can3d ? (
            <Button icon="cube" onClick={() => onStart({ ...setup, level, mode: '3d' })} data-testid="rush-play-3d">
              {t(R.play3d)}
            </Button>
          ) : null}
          <Button icon="menu" variant={can3d ? 'secondary' : 'primary'} onClick={() => onStart({ ...setup, level, mode: 'list' })} data-testid="rush-play-list">
            {t(R.playList)}
          </Button>
        </div>
      </div>
      <Callout kind="info" locale={locale}>
        {t(R.hardware)}
      </Callout>
    </section>
  );
}

// ───────────────────────────── player ─────────────────────────────
function RushPlayer({ setup, seed, canVR, mobile, onExit, onNext }: { setup: RushSetup; seed: number; canVR: boolean; mobile: boolean; onExit(): void; onNext(l: RushLevelNo): void }) {
  const { t } = useI18n();
  const store = useMemo(
    () => createRushStore(createShift({ level: setup.level, seed, mode: setup.relaxed ? 'relaxed' : 'standard', guidance: setup.guidance })),
    [setup, seed],
  );
  const coach = useMemo(() => createCoach(setup.level), [setup.level, seed]);
  const [mode, setMode] = useState(setup.mode);
  const reducedMotion = useReducedMotion();
  const status = useRush(store, (s) => s.status);
  const speed = useMemo(testSpeed, []);

  // clock
  useEffect(() => {
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.25) * speed;
      last = now;
      store.set(tick(store.get(), dt));
    }, 100);
    return () => clearInterval(id);
  }, [store, speed]);

  // sounds + announcements
  useEffect(
    () =>
      store.onEffects((effects, s) => {
        for (const e of effects) {
          const n = SFX[e];
          if (n) audio.play(n);
        }
        const f = s.feedback.at(-1);
        if (f && f.atMs === s.tMs && (effects.some((e) => e.startsWith('serve') || e === 'order-timeout' || e === 'shift-over') || f.kind === 'mistake'))
          announce(t(f.text), f.kind === 'mistake' || f.kind === 'warn' ? 'assertive' : 'polite');
      }),
    [store, t],
  );

  // keyboard: P = pause
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.ctrlKey || e.metaKey || e.altKey || (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (e.key === 'p' || e.key === 'P') {
        const s = store.get();
        store.set(reduce(s, { type: s.status === 'paused' ? 'resume' : 'pause' }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [store]);

  // record the finished shift once (simulated evidence)
  const [result, setResult] = useState<RushResult | null>(null);
  useEffect(() => {
    if (status !== 'over' || result) return;
    const r = rushResult(store.get());
    setResult(r);
    try {
      learnerActions.recordEvent(rushCompletionEvent(r, { immersive: false, touch: mobile }));
    } catch {
      /* storage unavailable: the result still shows */
    }
  }, [status, result, store, mobile]);

  const act = (a: PlayerAction, viaList: boolean) => store.set(viaList ? listAct(store.get(), a) : reduce(store.get(), a));

  if (result) return <Results store={store} result={result} setup={setup} onAgain={() => onNext(setup.level)} onNext={onNext} onExit={onExit} />;

  return (
    <section className="rush" data-testid="rush-player" data-mode={mode} data-vr={canVR || undefined} data-status={status} aria-label={t(R.title)}>
      <Hud store={store} onExit={onExit} />
      <div className="rush-main">
        <div className="rush-col">
          {mode === '3d' ? (
            <Suspense fallback={<p className="xr-stage__note">{t(R.loading3d)}</p>}>
              <RushScene
                store={store}
                coach={setup.guidance === 'guided' ? coach : null}
                level={setup.level}
                canVR={canVR}
                reducedMotion={reducedMotion}
                onAct={(a) => act(a, false)}
                onFail={() => {
                  setMode('list');
                  announce(t(R.sceneFailed), 'assertive');
                }}
              />
            </Suspense>
          ) : null}
          <Tickets store={store} guidance={setup.guidance} />
          <Bench store={store} />
          <Feedback store={store} />
        </div>
        <aside className="rush-col">
          <ActionList store={store} coach={setup.guidance === 'guided' ? coach : null} onAct={(a) => act(a, true)} />
          <Wall level={setup.level} />
        </aside>
      </div>
      {status === 'paused' ? (
        <div className="rush-paused" role="dialog" aria-label={t(R.paused)}>
          <p>{t(R.paused)}</p>
          <Button size="lg" icon="play" onClick={() => store.set(reduce(store.get(), { type: 'resume' }))}>
            {t(R.resume)}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function Hud({ store, onExit }: { store: RushStore; onExit(): void }) {
  const { t } = useI18n();
  const h = useRush(store, (s) => ({
    points: s.stats.points,
    tips: s.stats.tips,
    streak: s.stats.streak,
    left: Math.max(0, Math.ceil((s.shiftMs - s.tMs) / 1000)),
    relaxed: s.mode === 'relaxed',
    served: s.stats.correct + s.stats.partly,
    status: s.status,
    level: s.level,
  }));
  return (
    <header className="rush-hud" data-testid="rush-hud">
      <div className="rush-hud__title">
        <strong>
          {t(R.title)} · {t(fmtR(R.level, { n: h.level }))}
        </strong>
        <span className="rush-badge">{t(R.simulated)}</span>
        <span className="rush-badge rush-badge--muted">{t(R.gameTimeShot)}</span>
      </div>
      <dl className="rush-stats">
        <div>
          <dt>{t(R.score)}</dt>
          <dd data-testid="rush-score">{h.points}</dd>
        </div>
        <div>
          <dt>{t(R.tips)}</dt>
          <dd>{h.tips}</dd>
        </div>
        <div>
          <dt>{t(R.streak)}</dt>
          <dd>{h.streak}</dd>
        </div>
        <div>
          <dt>{h.relaxed ? t(R.waitsForever) : t(R.timeLeft)}</dt>
          <dd data-testid="rush-time">{h.relaxed ? t(fmtR(R.served, { n: h.served, m: RELAXED.orders })) : `${Math.floor(h.left / 60)}:${String(h.left % 60).padStart(2, '0')}`}</dd>
        </div>
      </dl>
      <div className="xr-row rush-hud__buttons">
        <Button
          size="sm"
          variant="secondary"
          icon={h.status === 'paused' ? 'play' : 'pause'}
          onClick={() => store.set(reduce(store.get(), { type: h.status === 'paused' ? 'resume' : 'pause' }))}
          data-testid="rush-pause"
        >
          {h.status === 'paused' ? t(R.resume) : t(R.pause)}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => store.set(reduce(store.get(), { type: 'endShift' }))} data-testid="rush-end">
          {t(R.endShift)}
        </Button>
        <Button size="sm" variant="ghost" icon="back" onClick={onExit}>
          {t(R.exit)}
        </Button>
      </div>
    </header>
  );
}

function Tickets({ store, guidance }: { store: RushStore; guidance: Guidance }) {
  const { t } = useI18n();
  const orders = useRush(
    store,
    (s) => s.orders.map((o) => ({ id: o.id, drinkId: o.drinkId, customerId: o.customerId, left: o.remainingMs === null ? null : Math.round((o.remainingMs / (o.patienceMs ?? 1)) * 20) / 20, sec: o.remainingMs === null ? null : Math.ceil(o.remainingMs / 1000) })),
    (a, b) => JSON.stringify(a) === JSON.stringify(b),
  );
  return (
    <section className="rush-tickets" aria-labelledby="rush-orders-h" data-testid="rush-tickets">
      <h2 id="rush-orders-h" className="xr-side__h">
        {t(R.orders)}
      </h2>
      {orders.length === 0 ? <p className="xr-small xr-muted">{t(R.noOrders)}</p> : null}
      <ul>
        {orders.map((o) => {
          const leaving = o.left !== null && o.left <= 0.3;
          return (
            <li key={o.id} className="rush-ticket" data-leaving={leaving || undefined} data-testid="rush-ticket">
              <strong>{t(drinkName(o.drinkId))}</strong>
              <span className="xr-small">{t(customerName(o.customerId))}</span>
              {o.left === null ? (
                <span className="xr-small xr-muted">{t(R.waitsForever)}</span>
              ) : (
                <>
                  <progress className="rush-patience" max={1} value={o.left} aria-label={`${t(R.patience)}: ${t(drinkName(o.drinkId))}`} />
                  {leaving && guidance !== 'independent' ? <span className="rush-leaving">{t(R.leaving)}</span> : <span className="xr-small xr-muted">{o.sec} s</span>}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const BENCH: SlotId[] = ['grinder', 'group1', 'tray1', 'group2', 'tray2', 'wand', 'hotwater', 'kettleBase', 'dripper', 'phin'];

function Bench({ store }: { store: RushStore }) {
  const { t } = useI18n();
  const v = useRush(
    store,
    (s) => ({
      hand: s.hand ? itemText(s.items[s.hand]!) : null,
      rows: BENCH.map((slot) => {
        const it = itemIn(s, slot);
        const p = processProgress(s, slot);
        return { slot, item: it ? itemText(it) : null, busy: slotLocked(s, slot), p: p === null ? null : Math.round(p * 10) / 10 };
      }).filter((r) => r.item || r.busy),
      counter: Object.entries(s.slots)
        .filter(([k, id]) => k.startsWith('counter') && id)
        .map(([, id]) => itemText(s.items[id!]!)),
    }),
    (a, b) => JSON.stringify(a) === JSON.stringify(b),
  );
  return (
    <section className="rush-bench" aria-labelledby="rush-bench-h">
      <p className="rush-hands" data-testid="rush-hands">
        <strong>{t(R.hands)}:</strong> {v.hand ? t(v.hand) : t(R.handsEmpty)}
      </p>
      <h2 id="rush-bench-h" className="xr-side__h">
        {t(R.stations)}
      </h2>
      <ul className="rush-bench__list">
        {v.rows.map((r) => (
          <li key={r.slot}>
            <span>{t(SLOT_TEXT[r.slot])}</span>: {r.item ? t(r.item) : ''} {r.busy ? <em className="xr-muted">({t(R.working)})</em> : null}
            {r.p !== null ? <progress className="rush-proc" max={1} value={r.p} aria-label={t(SLOT_TEXT[r.slot])} /> : null}
          </li>
        ))}
        {v.counter.map((c, i) => (
          <li key={`c${i}`} className="xr-muted">
            {t(c)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Feedback({ store }: { store: RushStore }) {
  const { t } = useI18n();
  const fb = useRush(store, (s) => s.feedback.slice(-3), (a, b) => a.at(-1)?.seq === b.at(-1)?.seq);
  if (!fb.length) return null;
  return (
    <section className="rush-feedback" aria-labelledby="rush-fb-h">
      <h2 id="rush-fb-h" className="xr-side__h">
        {t(R.feedback)}
      </h2>
      <ul>
        {[...fb].reverse().map((f) => (
          <li key={f.seq} data-kind={f.kind}>
            {t(f.text)}
            {f.details?.length ? (
              <ul>
                {f.details.map((d, i) => (
                  <li key={i}>
                    <strong>{t(d.what)}</strong> {t(d.why)}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionList({ store, coach, onAct }: { store: RushStore; coach: ReturnType<typeof createCoach> | null; onAct(a: PlayerAction): void }) {
  const { t } = useI18n();
  const key = useRush(store, listKey, Object.is);
  const { list, hint } = useMemo(() => {
    const s = store.get();
    const sug = coach ? coachSuggest(coach, s) : null;
    return { list: listActions(s, sug), hint: coach ? whileBrewsHint(s, sug) : null };
  }, [key, store, coach]);
  const ref = useRef<HTMLUListElement>(null);
  const refocus = useRef(false);
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    ref.current?.querySelector<HTMLButtonElement>('.xr-action[data-recommended]')?.focus() ?? ref.current?.querySelector<HTMLButtonElement>('.xr-action')?.focus();
  }, [list]);
  return (
    <section className="xr-actions" aria-labelledby="rush-actions-h" data-testid="rush-actions">
      <h2 id="rush-actions-h" className="xr-side__h">
        {t(R.actions)}
      </h2>
      {hint ? (
        <p className="rush-hint" data-testid="rush-hint">
          {t(hint)}
        </p>
      ) : null}
      <p className="xr-muted xr-small">{t(R.actionsNote)}</p>
      <ul className="xr-actions__list" ref={ref}>
        {list.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className="xr-action"
              data-action-id={a.id}
              data-recommended={a.recommended || undefined}
              onClick={() => {
                refocus.current = true;
                onAct(a.action);
              }}
            >
              <span>{t(a.label)}</span>
              {a.recommended ? <span className="xr-action__badge">{t(R.nextStep)}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Wall({ level }: { level: RushLevelNo }) {
  const { t } = useI18n();
  const wall = useMemo(() => recipeWall(level), [level]);
  return (
    <details className="rush-wall" data-testid="rush-wall">
      <summary>{t(R.wall)}</summary>
      <p className="xr-small xr-muted">{t(R.wallNote)}</p>
      <ul>
        {wall.map((w) => (
          <li key={w.drinkId} data-new={w.isNew || undefined}>
            <strong>{t(w.name)}</strong>
            {w.ratio ? ` · ${w.doseG} g → ${w.outG} g (${w.ratio})` : ''}
            {w.milkMl ? ` · ${t({ zh: '奶', en: 'milk' })} ≈${w.milkMl} ml${w.pitcherMark ? ` → ${t({ zh: '奶缸刻度', en: 'pitcher mark' })} ${w.pitcherMark}` : ''}` : ''}
            <br />
            <span className="xr-small">{t(w.keyPoint)}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Results({ store, result: r, setup, onAgain, onNext, onExit }: { store: RushStore; result: RushResult; setup: RushSetup; onAgain(): void; onNext(l: RushLevelNo): void; onExit(): void }) {
  const { t } = useI18n();
  const events = useLearner((s) => s.events);
  const open = unlockedLevels(bestStarsFromEvents(events));
  const next = (setup.level + 1) as RushLevelNo;
  const canNext = RUSH_LEVELS.includes(next) && open.includes(next);
  const records = store.get().records;
  const h = useRef<HTMLHeadingElement>(null);
  useEffect(() => h.current?.focus(), []);
  return (
    <section className="xr-route xr-brief rush-results" aria-labelledby="rush-results-h" data-testid="rush-results" data-stars={r.stars}>
      <h1 id="rush-results-h" ref={h} tabIndex={-1}>
        {t(R.results)} · {t(fmtR(R.level, { n: r.level }))}
      </h1>
      <p className="rush-results__stars" aria-label={t(fmtR(R.stars, { n: r.stars }))}>
        <span aria-hidden="true">
          {'★'.repeat(r.stars)}
          {'☆'.repeat(3 - r.stars)}
        </span>{' '}
        {t(fmtR(R.stars, { n: r.stars }))}
      </p>
      <p>{r.mode === 'relaxed' ? t(R.starRuleRelaxed) : t(R.starRule)}</p>
      <p>
        {t(fmtR(R.points, { p: r.points, m: r.potential }))} · {t(fmtR(R.counts, { c: r.correct, p: r.partly, w: r.wrongServes, t: r.timeouts }))}
      </p>
      {canNext && r.stars >= 1 ? <p role="status">{t(fmtR(R.unlockedNext, { n: next }))}</p> : null}
      <p className="xr-small xr-muted">
        {t(R.savedNote)} {t(R.honesty)}
      </p>
      <div className="xr-row">
        <Button icon="repeat" onClick={onAgain} data-testid="rush-again">
          {t(R.again)}
        </Button>
        {canNext ? (
          <Button variant="secondary" onClick={() => onNext(next)} data-testid="rush-next">
            {t(R.nextLevel)}
          </Button>
        ) : null}
        <Button variant="ghost" icon="back" onClick={onExit} data-testid="rush-lobby-back">
          {t(R.exit)}
        </Button>
      </div>
      <div className="xr-card">
        <h2>{t(R.perOrder)}</h2>
        <ol className="rush-orders">
          {records.map((rec) => (
            <li key={rec.orderId} data-outcome={rec.outcome}>
              <strong>{t(drinkName(rec.drinkId))}</strong> — {t(R.outcome[rec.outcome])}
              {rec.points ? ` · +${rec.points}` : ''}
              {rec.diffs.length ? (
                <ul>
                  {rec.diffs.map((d, i) => {
                    const e = explain(rec.drinkId, d);
                    return (
                      <li key={i}>
                        <strong>{t(e.what)}</strong> {t(e.why)}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
      <div className="xr-card">
        <h2>{t(R.practised)}</h2>
        <ul>
          {r.practiced.map((p) => (
            <li key={p.en}>{t(p)}</li>
          ))}
        </ul>
        <h2>{t(R.notPractised)}</h2>
        <ul>
          {r.notTrained.map((p) => (
            <li key={p.en}>{t(p)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}


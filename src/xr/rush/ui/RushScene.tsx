/** Lazy 3D counter for Café Rush: canvas + a choice bar for stations with several options. */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LocalizedText } from '../../../domain/contracts';
import { useI18n } from '../../../i18n';
import { Button } from '../../../ui/primitives/Button';
import type { RushLevelNo } from '../config';
import { recipeWall } from '../drinks';
import { actionsForTarget, coachSuggest, listKey, targetOf, type Coach, type ListAction, type RushStore, type Target } from '../play';
import type { PlayerAction } from '../sim';
import { R, SLOT_TEXT, actionText } from '../strings';
import type { RushSceneHandle } from '../scene/rushScene';
import { useRush } from './RushGame';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });
export const TARGET_TEXT: Record<Target, LocalizedText> = {
  ...SLOT_TEXT,
  shelf: L('杯架', 'cups'),
  ice: L('冰桶', 'ice'),
  extras: L('配料', 'extras'),
  fridge: L('冰箱（牛奶）', 'fridge (milk)'),
  knock: L('敲渣盒', 'knock box'),
  bin: L('垃圾桶', 'bin'),
  pass: L('出品台', 'pass (serve)'),
};

export default function RushScene({
  store,
  coach,
  level,
  canVR,
  reducedMotion,
  onAct,
  onFail,
  onXrChange,
  onReplay,
  onLobby,
}: {
  store: RushStore;
  coach: Coach | null;
  level: RushLevelNo;
  canVR: boolean;
  reducedMotion: boolean;
  onAct(a: PlayerAction): void;
  onFail(): void;
  onXrChange(inXr: boolean): void;
  onReplay(): void;
  onLobby(): void;
}) {
  const { t, locale } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lab, setLab] = useState<RushSceneHandle | null>(null);
  const [choices, setChoices] = useState<{ target: Target; list: ListAction[] } | null>(null);
  const [note, setNote] = useState<LocalizedText | null>(null);
  const [seated, setSeated] = useState(false);
  const [inXr, setInXr] = useState(false);
  const [vrError, setVrError] = useState(false);
  const highlight = useRef<Target[]>([]);
  const hint = useRef<LocalizedText | null>(null);
  const cb = useRef({ onAct, onXrChange, onReplay, onLobby });
  cb.current = { onAct, onXrChange, onReplay, onLobby };
  const selected = useRef<Target | null>(null);
  const tr = useRef(t);
  tr.current = t;

  const labels = () => Object.fromEntries(Object.entries(TARGET_TEXT).map(([k, x]) => [k, tr.current(x)])) as Record<Target, string>;
  const wall = () => ({
    title: tr.current(R.wall),
    lines: recipeWall(level).map((w) => `${tr.current(w.name)}${w.ratio ? ` · ${w.doseG}→${w.outG} g (${w.ratio})` : ''}${w.pitcherMark ? ` · ${tr.current({ zh: '奶', en: 'milk' })} ${w.pitcherMark} ml` : ''}`),
  });

  // guided highlight follows the coach's suggestion
  const key = useRush(store, listKey, Object.is);
  useMemo(() => {
    const sug = coach ? coachSuggest(coach, store.get()) : null;
    highlight.current = sug ? [targetOf(sug)] : [];
    hint.current = sug ? actionText(store.get(), sug) : null;
  }, [key, coach, store]);

  useEffect(() => {
    let handle: RushSceneHandle | null = null;
    let cancelled = false;
    import('../scene/rushScene')
      .then(({ createRushScene }) =>
        createRushScene({
          canvas: canvasRef.current!,
          store,
          reducedMotion,
          xrSupported: canVR,
          labels: labels(),
          wall: wall(),
          highlight: () => highlight.current,
          selected: () => selected.current,
          onPick: (target) => {
            const list = actionsForTarget(store.get(), target);
            setNote(null);
            if (list.length === 1) {
              selected.current = null;
              setChoices(null);
              cb.current.onAct(list[0]!.action);
            } else if (list.length > 1) {
              selected.current = target;
              setChoices({ target, list });
            } else {
              selected.current = null;
              setChoices(null);
              setNote(TARGET_TEXT[target]);
            }
          },
          onXrChange: (now) => {
            setInXr(now);
            cb.current.onXrChange(now);
          },
          tr: (x) => tr.current(x),
          targetText: (x) => TARGET_TEXT[x],
          hint: () => hint.current,
          onAct: (a) => cb.current.onAct(a),
          onReplay: () => cb.current.onReplay(),
          onLobby: () => cb.current.onLobby(),
        }),
      )
      .then((h) => {
        if (cancelled) return h.dispose();
        handle = h;
        setLab(h);
      })
      .catch((err: unknown) => {
        if (import.meta.env.DEV) console.error('[rush] 3D scene failed', err);
        if (!cancelled) onFail();
      });
    return () => {
      cancelled = true;
      handle?.dispose();
    };
    // the scene is created once per store
  }, [store]);

  useEffect(() => lab?.setLabels(labels(), wall()), [lab, locale]);
  useEffect(() => lab?.setSeated(seated), [lab, seated]);

  // choices go stale when the world changes
  useEffect(() => {
    if (!choices) return;
    const list = actionsForTarget(store.get(), choices.target);
    if (list.map((a) => a.id).join() !== choices.list.map((a) => a.id).join()) {
      setChoices(list.length ? { target: choices.target, list } : null);
      if (!list.length) selected.current = null;
    }
  }, [key]);

  // test hook (dev or ?xrtest)
  useEffect(() => {
    if (!lab) return;
    if (!import.meta.env.DEV && !/[?&]xrtest\b/.test(window.location.search + window.location.hash) && !(window as unknown as { __coffeeLabRushSpeed?: number }).__coffeeLabRushSpeed) return;
    const w = window as unknown as { __coffeeLabRush?: RushSceneHandle };
    w.__coffeeLabRush = lab;
    return () => {
      if (w.__coffeeLabRush === lab) delete w.__coffeeLabRush;
    };
  }, [lab]);

  return (
    <div className="rush-scene">
      <div className="rush-stage" data-testid="rush-stage">
        <canvas ref={canvasRef} data-testid="rush-canvas" aria-label={t(R.sceneHelp)} />
        {!lab ? <p className="xr-stage__note">{t(R.loading3d)}</p> : null}
      </div>
      <p className="xr-small xr-muted">{t(R.sceneHelp)}</p>
      {choices ? (
        <div className="rush-choices" role="group" aria-label={t({ zh: `${TARGET_TEXT[choices.target].zh}：选择`, en: `At the ${TARGET_TEXT[choices.target].en}: choose` })} data-testid="rush-choices">
          {choices.list.map((a) => (
            <Button
              key={a.id}
              size="sm"
              variant={a.recommended ? 'primary' : 'secondary'}
              onClick={() => {
                selected.current = null;
                setChoices(null);
                onAct(a.action);
              }}
            >
              {t(a.label)}
            </Button>
          ))}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              selected.current = null;
              setChoices(null);
            }}
          >
            ✕
          </Button>
        </div>
      ) : null}
      {note ? (
        <p className="xr-small" role="status">
          {t({ zh: `${note.zh}：现在没有可做的操作。`, en: `Nothing to do at the ${note.en} right now.` })}
        </p>
      ) : null}
      <div className="xr-row">
        <Button size="sm" variant="ghost" icon="eye" onClick={() => lab?.resetView()} disabled={!lab}>
          {t({ zh: '重置视角', en: 'Reset view' })}
        </Button>
        <Button size="sm" variant="ghost" aria-pressed={seated} onClick={() => setSeated((x) => !x)} disabled={!lab}>
          {t(R.seated)}
        </Button>
        {canVR && lab?.xrReady && !inXr ? (
          <Button
            size="sm"
            icon="headset"
            onClick={async () => {
              setVrError(false);
              const r = await lab.enterVR();
              if (!r.ok) setVrError(true);
            }}
          >
            {t(R.enterVR)}
          </Button>
        ) : null}
        {inXr ? (
          <Button size="sm" variant="secondary" onClick={() => void lab?.exitVR()}>
            {t({ zh: '退出 VR', en: 'Exit VR' })}
          </Button>
        ) : null}
      </div>
      {canVR && lab?.xrReady ? (
        <p className="xr-small xr-muted" data-testid="rush-vr-note">
          {t(R.vrControls)} {t(R.hardware)}
        </p>
      ) : null}
      {vrError ? (
        <p className="xr-small" role="alert">
          {t(R.vrFailed)}
        </p>
      ) : null}
    </div>
  );
}

/** 2D heads-up text for the 3D fallback and action-list modes (mirrors the in-headset panel). */
import type { InspectableId } from '../mission/types';
import type { MissionStore } from '../mission/store';
import { useI18n } from '../../i18n';
import { GUIDANCE_LABEL, ITEM_NAME, STEPS, STEP_ORDER, TOOL_INFO, ZONE_NAME } from '../mission/content';
import { cuesFor, currentStepIndex, isAt, scaleReadingG } from '../mission/reducer';
import { RECIPE } from '../mission/extraction';
import { S } from '../strings';
import { useMissionSelector } from './useMission';

const KIND_ICON = { success: '✓', info: 'i', warn: '!', mistake: '!' } as const;

export function MissionHud({ store, hover }: { store: MissionStore; hover: InspectableId | null }) {
  const { t } = useI18n();
  const v = useMissionSelector(store, (s) => {
    const c = cuesFor(s);
    return {
      status: s.status,
      idx: currentStepIndex(s),
      guidance: s.guidance,
      stepLabel: c.stepLabel,
      nextStepText: c.nextStepText,
      fb: s.feedback,
    };
  });
  const step = STEP_ORDER[v.idx];
  return (
    <div className="xr-hud" data-testid="xr-hud">
      <p className="xr-hud__meta">
        {v.stepLabel && step ? `${t(S.step)} ${v.idx + 1}${t(S.of)}${STEP_ORDER.length}` : t(S.missionShort)}
        <span aria-hidden="true"> · </span>
        {t(GUIDANCE_LABEL[v.guidance])}
      </p>
      {step ? (
        v.stepLabel ? (
          <h2 className="xr-hud__title" data-testid="xr-step-title">
            {t(STEPS[step].title)}
          </h2>
        ) : (
          <p className="xr-hud__hidden">{t(S.hiddenStep)}</p>
        )
      ) : null}
      {step && v.nextStepText ? <p className="xr-hud__do">{t(STEPS[step].doScreen)}</p> : null}
      {v.status === 'paused' ? <p className="xr-hud__fb" data-kind="warn">{t(S.pausedOverlay)}</p> : null}
      {v.fb && v.status !== 'paused' ? (
        <p className="xr-hud__fb" data-kind={v.fb.kind} data-code={v.fb.code} data-testid="xr-feedback">
          <span className="xr-hud__icon" aria-hidden="true">
            {KIND_ICON[v.fb.kind]}
          </span>
          <span>
            {t(v.fb.text)}
            {v.fb.detail && (v.fb.kind === 'mistake' || v.fb.code === 'hint') ? <span className="xr-hud__why"> {t(v.fb.detail)}</span> : null}
          </span>
        </p>
      ) : null}
      {hover ? (
        <p className="xr-hud__tool">
          <strong>{t(TOOL_INFO[hover].name)}</strong> — {t(TOOL_INFO[hover].purpose)}
        </p>
      ) : null}
    </div>
  );
}

/** Live scale/shot numbers (not announced every tick: aria-live off). */
export function ShotReadout({ store }: { store: MissionStore }) {
  const { t } = useI18n();
  const v = useMissionSelector(store, (s) => ({
    show: s.shot.status !== 'idle' || isAt(s, 'cup', 'scale'),
    reading: Math.round(scaleReadingG(s) * 10) / 10,
    time: Math.floor(s.shot.elapsedSec),
    running: s.shot.status === 'running',
  }));
  if (!v.show) return null;
  return (
    <div className="xr-readout" aria-live="off" data-testid="xr-readout">
      <span className="xr-readout__big">
        {v.reading.toFixed(1)} {t(S.grams)}
      </span>
      <span className="xr-readout__small">
        {t(S.target)} {RECIPE.targetYieldG} {t(S.grams)} · {t(S.shotTime)} {v.time}
        {t(S.seconds)} · {t(S.illustrative)}
      </span>
    </div>
  );
}

/** Text description of the station for the action-list-only mode (no 3D). */
export function StationStatus({ store }: { store: MissionStore }) {
  const { t } = useI18n();
  const v = useMissionSelector(store, (s) => ({
    pf: s.items.portafilter.heldBy ? 'held' : s.items.portafilter.zone,
    cup: s.items.cup.heldBy ? 'held' : s.items.cup.zone,
    tamper: s.items.tamper.heldBy ? 'held' : s.items.tamper.zone,
    basket: s.basket,
    reading: Math.round(scaleReadingG(s) * 10) / 10,
    shot: s.shot.status,
  }));
  const where = (z: string) => (z === 'held' ? t(S.holding) : t(ZONE_NAME[z as keyof typeof ZONE_NAME]));
  const BASKET = {
    empty: { en: 'empty', zh: '空' },
    dosed: { en: 'loose grounds (not tamped)', zh: '松散的粉（未压粉）' },
    tamped: { en: 'tamped grounds', zh: '已压好的粉' },
    spent: { en: 'used puck', zh: '用过的粉饼' },
  } as const;
  return (
    <div className="xr-status" data-testid="xr-station-status">
      <ul>
        <li>
          {t(ITEM_NAME.portafilter)}: {where(v.pf)} · {t(BASKET[v.basket])}
        </li>
        <li>
          {t(ITEM_NAME.cup)}: {where(v.cup)}
        </li>
        <li>
          {t(ITEM_NAME.tamper)}: {where(v.tamper)}
        </li>
        <li>
          {t(S.scale)}: {v.reading.toFixed(1)} {t(S.grams)}
        </li>
      </ul>
    </div>
  );
}

/** 2D heads-up text for the 3D fallback and action-list modes (mirrors the in-headset panel). Mission-generic. */
import type { LocalizedText } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import type { AnyMission, AnyStore } from '../mission/core';
import { GUIDANCE_LABEL } from '../mission/content';
import { S } from '../strings';
import { useMissionSelector } from './useMission';

const KIND_ICON = { success: '✓', info: 'i', warn: '!', mistake: '!' } as const;

export function MissionHud({
  def,
  store,
  hover,
}: {
  def: AnyMission;
  store: AnyStore;
  hover: { name: LocalizedText; purpose: LocalizedText } | null;
}) {
  const { t } = useI18n();
  const v = useMissionSelector(store, (s) => def.hud(s), (a, b) => JSON.stringify(a) === JSON.stringify(b));
  // Hovering the tool you just inspected would repeat the same sentence — show it once.
  const showHover = !!hover && !(v.feedback && t(v.feedback.text).startsWith(t(hover.name)));
  return (
    <div className="xr-hud" data-testid="xr-hud">
      <p className="xr-hud__meta">
        {v.showStepLabel ? `${t(S.step)} ${v.stepIndex + 1}${t(S.of)}${v.stepCount}` : t(def.short)}
        <span aria-hidden="true"> · </span>
        {t(GUIDANCE_LABEL[v.guidance])}
      </p>
      {v.stepTitle ? (
        v.showStepLabel ? (
          <h2 className="xr-hud__title" data-testid="xr-step-title">
            {t(v.stepTitle)}
          </h2>
        ) : (
          <p className="xr-hud__hidden">{t(S.hiddenStep)}</p>
        )
      ) : null}
      {v.showInstruction && v.doScreen ? <p className="xr-hud__do">{t(v.doScreen)}</p> : null}
      {v.progress ? (
        <p className="xr-hud__progress" data-testid="xr-progress">
          {t(v.progress)}
        </p>
      ) : null}
      {v.status === 'paused' ? (
        <p className="xr-hud__fb" data-kind="warn">
          {t(S.pausedOverlay)}
        </p>
      ) : null}
      {v.feedback && v.status !== 'paused' ? (
        <p className="xr-hud__fb" data-kind={v.feedback.kind} data-code={v.feedback.code} data-testid="xr-feedback">
          <span className="xr-hud__icon" aria-hidden="true">
            {KIND_ICON[v.feedback.kind]}
          </span>
          <span>
            {t(v.feedback.text)}
            {v.feedback.detail && (v.feedback.kind === 'mistake' || v.feedback.code === 'hint' || v.feedback.code === 'inspect') ? (
              <span className="xr-hud__why"> {t(v.feedback.detail)}</span>
            ) : null}
          </span>
        </p>
      ) : null}
      {hover && showHover ? (
        <p className="xr-hud__tool">
          <strong>{t(hover.name)}</strong> — {t(hover.purpose)}
        </p>
      ) : null}
    </div>
  );
}

/** Live scale numbers (aria-live off — not announced every tick). */
export function ReadoutView({ def, store }: { def: AnyMission; store: AnyStore }) {
  const { t } = useI18n();
  const r = useMissionSelector(store, (s) => {
    const x = def.readout(s);
    return x ? { big: x.big, small: x.small.en + '|' + x.small.zh, tone: x.tone } : null;
  });
  if (!r) return null;
  const [en, zh] = r.small.split('|');
  return (
    <div className="xr-readout" aria-live="off" data-testid="xr-readout" data-tone={r.tone}>
      <span className="xr-readout__big">{r.big}</span>
      <span className="xr-readout__small">{t({ en: en ?? '', zh: zh ?? '' })}</span>
    </div>
  );
}

/** Text description of the station for the action-list-only mode (no 3D). */
export function StationStatus({ def, store }: { def: AnyMission; store: AnyStore }) {
  const { t } = useI18n();
  const lines = useMissionSelector(
    store,
    (s) => def.status(s),
    (a, b) => a.length === b.length && a.every((x, i) => x.en === b[i]!.en),
  );
  return (
    <div className="xr-status" data-testid="xr-station-status">
      <ul>
        {lines.map((l, i) => (
          <li key={i}>{t(l)}</li>
        ))}
      </ul>
    </div>
  );
}

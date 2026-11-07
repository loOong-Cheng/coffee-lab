/**
 * The counter's stations. Single choices are radio groups (SegmentedControl: one tab stop, arrow
 * keys); extras are toggle chips. No drag anywhere; every target is ≥44px on touch.
 */
import type { LocalizedText } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Chip, SegmentedControl } from '../../ui';
import {
  CUPS,
  EXTRAS,
  METHODS,
  MILK_ML,
  MILK_TEXTURES,
  SHOT_COUNTS,
  SHOT_STYLES,
  STATIONS,
  WATER_ML,
  WATER_ORDERS,
  toggleExtra,
  visibleStations,
  type Build,
  type Component,
  type StationId,
} from './model';
import type { BuildSpec } from './specs';
import {
  CUP_SUB,
  CUP_TEXT,
  EXTRA_SUB,
  EXTRA_TEXT,
  ICE_TEXT,
  METHOD_TEXT,
  MILK_TEXT,
  S,
  SHOTS_TEXT,
  SHOT_STYLE_TEXT,
  STATION_TEXT,
  WATER_TEXT,
  milkMlText,
  waterMlText,
} from './strings';

export const stationDomId = (s: StationId) => `cafe-station-${s}`;

/** Move focus into a station (its selected option, or its first control). */
export function focusStation(s: StationId): boolean {
  const root = document.getElementById(stationDomId(s));
  if (!root) return false;
  const target =
    root.querySelector<HTMLElement>('[role="radio"][tabindex="0"]') ?? root.querySelector<HTMLElement>('button:not([disabled])');
  target?.focus();
  return !!target;
}

const STATION_COMPONENTS: Record<StationId, Component[]> = {
  method: ['method'],
  shots: ['shotStyle', 'shots'],
  water: ['water', 'waterMl'],
  milk: ['milk', 'milkMl'],
  ice: ['ice'],
  extras: ['extras'],
  cup: ['cup'],
};

function Opt({ label, sub }: { label: string; sub?: string }) {
  return (
    <span className="cafe-opt">
      <span className="cafe-opt__label">{label}</span>
      {sub && <span className="cafe-opt__sub">{sub}</span>}
    </span>
  );
}

export interface StationsProps {
  build: Build;
  onChange(patch: Partial<Build>, station: StationId): void;
  /** Guided tier: per-station hints for this order. */
  hints: boolean;
  spec: BuildSpec;
  large: boolean;
  /** Stations flagged in the last feedback (outlined so retry is quick). */
  flagged?: ReadonlySet<StationId>;
}

export function Stations({ build, onChange, hints, spec, large, flagged }: StationsProps) {
  const { t } = useI18n();
  const visible = new Set(visibleStations(build));
  const size = large ? 'lg' : 'md';

  const hintFor = (s: StationId): LocalizedText => {
    for (const c of STATION_COMPONENTS[s]) {
      const w = spec.why[c];
      if (w) return w;
    }
    return STATION_TEXT[s].tip;
  };

  const body = (s: StationId) => {
    switch (s) {
      case 'method':
        return (
          <SegmentedControl
            size={size}
            label={t(STATION_TEXT.method.name)}
            value={build.method}
            onChange={(v) => onChange({ method: v }, s)}
            options={METHODS.map((m) => ({ value: m, label: <Opt label={t(METHOD_TEXT[m])} /> }))}
          />
        );
      case 'shots':
        return (
          <>
            <SegmentedControl
              size={size}
              label={t({ zh: '浓缩份数', en: 'Number of shots' })}
              value={String(build.shots)}
              onChange={(v) => onChange({ shots: Number(v) === 1 ? 1 : 2 }, s)}
              options={SHOT_COUNTS.map((n) => ({ value: String(n), label: <Opt label={t(SHOTS_TEXT[n])} /> }))}
            />
            <SegmentedControl
              size={size}
              label={t({ zh: '萃取长短', en: 'Shot length' })}
              value={build.shotStyle}
              onChange={(v) => onChange({ shotStyle: v }, s)}
              options={SHOT_STYLES.map((st) => ({
                value: st,
                label: <Opt label={t(SHOT_STYLE_TEXT[st].label)} sub={t(SHOT_STYLE_TEXT[st].sub)} />,
              }))}
            />
          </>
        );
      case 'water':
        return (
          <>
            <SegmentedControl
              size={size}
              label={t(STATION_TEXT.water.name)}
              value={build.water}
              onChange={(v) => onChange({ water: v }, s)}
              options={WATER_ORDERS.map((w) => ({ value: w, label: <Opt label={t(WATER_TEXT[w])} /> }))}
            />
            {build.water !== 'none' && (
              <SegmentedControl
                size={size}
                label={t({ zh: '水量', en: 'Water amount' })}
                value={String(build.waterMl)}
                onChange={(v) => {
                  const ml = WATER_ML.find((x) => String(x) === v);
                  if (ml) onChange({ waterMl: ml }, s);
                }}
                options={WATER_ML.map((ml) => ({ value: String(ml), label: <Opt label={t(waterMlText(ml))} /> }))}
              />
            )}
          </>
        );
      case 'milk':
        return (
          <>
            <SegmentedControl
              size={size}
              label={t({ zh: '牛奶质地', en: 'Milk texture' })}
              value={build.milk}
              onChange={(v) => onChange({ milk: v }, s)}
              options={MILK_TEXTURES.map((m) => ({
                value: m,
                label: <Opt label={t(MILK_TEXT[m].label)} sub={MILK_TEXT[m].sub ? t(MILK_TEXT[m].sub) : undefined} />,
              }))}
            />
            {build.milk !== 'none' && (
              <SegmentedControl
                size={size}
                label={t({ zh: '奶量', en: 'Milk amount' })}
                value={String(build.milkMl)}
                onChange={(v) => {
                  const ml = MILK_ML.find((x) => String(x) === v);
                  if (ml) onChange({ milkMl: ml }, s);
                }}
                options={MILK_ML.map((ml) => ({ value: String(ml), label: <Opt label={t(milkMlText(ml))} /> }))}
              />
            )}
          </>
        );
      case 'ice':
        return (
          <SegmentedControl
            size={size}
            label={t(STATION_TEXT.ice.name)}
            value={build.ice ? 'yes' : 'no'}
            onChange={(v) => onChange({ ice: v === 'yes' }, s)}
            options={[
              { value: 'no', label: <Opt label={t(ICE_TEXT.no)} /> },
              { value: 'yes', label: <Opt label={t(ICE_TEXT.yes)} /> },
            ]}
          />
        );
      case 'extras':
        return (
          <div className="cafe-chips" role="group" aria-label={t(STATION_TEXT.extras.name)}>
            {EXTRAS.map((e) => (
              <Chip key={e} selected={build.extras.includes(e)} onChange={() => onChange({ extras: toggleExtra(build.extras, e) }, s)} data-extra={e}>
                <Opt label={t(EXTRA_TEXT[e])} sub={EXTRA_SUB[e] ? t(EXTRA_SUB[e]) : undefined} />
              </Chip>
            ))}
          </div>
        );
      case 'cup':
        return (
          <SegmentedControl
            size={size}
            label={t(STATION_TEXT.cup.name)}
            value={build.cup}
            onChange={(v) => onChange({ cup: v }, s)}
            options={CUPS.map((c) => ({ value: c, label: <Opt label={t(CUP_TEXT[c])} sub={t(CUP_SUB[c])} /> }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="cafe-stations" data-testid="cafe-stations">
      {STATIONS.map((s, i) => {
        const headId = `${stationDomId(s)}-h`;
        if (!visible.has(s)) {
          return (
            <section key={s} className="cafe-station cafe-station--off" aria-labelledby={headId} data-testid={`station-${s}`}>
              <h3 id={headId} className="cafe-station__name">
                <span className="cafe-station__n" aria-hidden="true">
                  {i + 1}
                </span>
                {t(STATION_TEXT[s].name)}
              </h3>
              <p className="cafe-station__tip">{t(S.shotsHidden)}</p>
            </section>
          );
        }
        return (
          <section
            key={s}
            id={stationDomId(s)}
            className="cafe-station"
            aria-labelledby={headId}
            data-testid={`station-${s}`}
            data-flagged={flagged?.has(s) || undefined}
          >
            <h3 id={headId} className="cafe-station__name">
              <span className="cafe-station__n" aria-hidden="true">
                {i + 1}
              </span>
              {t(STATION_TEXT[s].name)}
            </h3>
            {hints && <p className="cafe-station__tip">{t(hintFor(s))}</p>}
            <div className="cafe-station__controls">{body(s)}</div>
          </section>
        );
      })}
    </div>
  );
}

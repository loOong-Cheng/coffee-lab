/**
 * Tilt controls for the pour-over kettle (touch + keyboard friendly). They
 * dispatch the same KETTLE action the mouse wheel and XR wrist tilt produce.
 */
import { useI18n } from '../../i18n';
import type { AnyStore } from '../mission/core';
import { POUR, tiltForFlow } from '../missions/pourover/model';
import { P } from '../missions/pourover/content';
import type { PourState } from '../missions/pourover/reducer';
import { useMissionSelector } from './useMission';

export function PourControls({ store }: { store: AnyStore }) {
  const { t } = useI18n();
  const v = useMissionSelector(store, (s) => {
    const p = s as unknown as PourState;
    return { held: p.items?.kettle?.heldBy === 'pointer', tilt: Math.round(p.tiltDeg ?? 0), fill: Math.round(((p.kettleG ?? 0) / POUR.kettleCapacityG) * 20) / 20 };
  });
  if (!v.held) return null;
  const set = (tiltDeg: number) => store.dispatch({ type: 'KETTLE', tiltDeg, source: 'pointer' } as never);
  return (
    <div className="xr-pour" data-testid="xr-pour-controls">
      <label className="xr-pour__label">
        {t(P.tiltLabel)}: {v.tilt}°
        <input
          type="range"
          min={0}
          max={90}
          step={1}
          value={v.tilt}
          onChange={(e) => set(Number(e.currentTarget.value))}
          aria-valuetext={`${v.tilt}°`}
        />
      </label>
      <button
        type="button"
        className="xr-action"
        onPointerDown={() => set(tiltForFlow(4, v.fill))}
        onPointerUp={() => set(0)}
        onPointerLeave={() => set(0)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') set(tiltForFlow(4, v.fill));
        }}
        onKeyUp={() => set(0)}
      >
        {t(P.holdPour)}
      </button>
    </div>
  );
}

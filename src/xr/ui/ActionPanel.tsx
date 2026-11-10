/** Keyboard-operable action list — dispatches the same mission actions as the 3D/XR hands. Mission-generic. */
import { useMemo } from 'react';
import { useI18n } from '../../i18n';
import type { AnyMission, AnyStore } from '../mission/core';
import { S } from '../strings';
import { useMissionSelector } from './useMission';

export function ActionPanel({ def, store, headingId }: { def: AnyMission; store: AnyStore; headingId: string }) {
  const { t } = useI18n();
  const key = useMissionSelector(store, (s) => def.actionsKey(s));
  // Recompute only when the key changes (3D scenes dispatch a TICK every frame).
  const list = useMemo(() => def.actions(store.getState()), [key, store, def]);
  return (
    <section className="xr-actions" aria-labelledby={headingId}>
      <h2 id={headingId} className="xr-side__h">
        {t(S.actionsHeading)}
      </h2>
      <p className="xr-muted xr-small">{t(S.actionsNote)}</p>
      {list.length === 0 ? null : (
        <ul className="xr-actions__list">
          {list.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="xr-action"
                data-recommended={a.recommended || undefined}
                data-action-id={a.id}
                onClick={() => {
                  for (const act of a.actions) store.dispatch(act as never);
                }}
              >
                <span>{t(a.label)}</span>
                {a.recommended ? <span className="xr-action__badge">{t(S.recommended)}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

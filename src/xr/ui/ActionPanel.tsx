/** Keyboard-operable action list — dispatches the same mission actions as the 3D/XR hands. */
import { useMemo } from 'react';
import { useI18n } from '../../i18n';
import type { MissionState } from '../mission/types';
import type { MissionStore } from '../mission/store';
import { availableActions } from '../mission/actions';
import { ITEM_NAME } from '../mission/content';
import { cuesFor, heldItem } from '../mission/reducer';
import { S } from '../strings';
import { useMissionSelector } from './useMission';

/** Everything availableActions() depends on — cheap to compute every frame, unlike the list itself. */
function actionsKey(s: MissionState): string {
  const it = s.items;
  return [
    s.status,
    s.flags.located,
    it.portafilter.zone,
    it.portafilter.heldBy,
    it.cup.zone,
    it.cup.heldBy,
    it.tamper.zone,
    it.tamper.heldBy,
    s.basket,
    s.shot.status,
    s.grinder.running,
    s.flush.running,
    s.flags.knocked,
    s.flags.flushed,
    s.tareG,
    s.guidance,
    cuesFor(s).cues,
  ].join('|');
}

export function ActionPanel({ store, headingId }: { store: MissionStore; headingId: string }) {
  const { t } = useI18n();
  const key = useMissionSelector(store, actionsKey);
  // Recompute only when the key changes (the scene dispatches a TICK every frame).
  const list = useMemo(() => availableActions(store.getState()), [key, store]);
  const held = useMissionSelector(store, (s) => heldItem(s, 'pointer'));
  const waiting = useMissionSelector(store, (s) => s.grinder.running || s.flush.running || s.shot.status === 'settling');

  return (
    <section className="xr-actions" aria-labelledby={headingId}>
      <h2 id={headingId} className="xr-side__h">
        {t(S.actionsHeading)}
      </h2>
      <p className="xr-muted xr-small">{t(S.actionsNote)}</p>
      <p className="xr-holding" aria-live="polite">
        {held ? `${t(S.holding)}: ${t(ITEM_NAME[held])}` : t(S.nothingHeld)}
        {waiting ? ` · ${t(S.waiting)}` : ''}
      </p>
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
                  for (const act of a.actions) store.dispatch(act);
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

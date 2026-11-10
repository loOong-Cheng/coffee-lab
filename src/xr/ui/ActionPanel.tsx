/** Keyboard-operable action list — dispatches the same mission actions as the 3D/XR hands. Mission-generic. */
import { useEffect, useMemo, useRef } from 'react';
import { useI18n } from '../../i18n';
import type { AnyMission, AnyStore } from '../mission/core';
import { S } from '../strings';
import { useMissionSelector } from './useMission';

export function ActionPanel({ def, store, headingId }: { def: AnyMission; store: AnyStore; headingId: string }) {
  const { t } = useI18n();
  const key = useMissionSelector(store, (s) => def.actionsKey(s));
  // Recompute only when the key changes (3D scenes dispatch a TICK every frame).
  const list = useMemo(() => def.actions(store.getState()), [key, store, def]);
  const listRef = useRef<HTMLUListElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const refocus = useRef(false);

  // The button a keyboard user just pressed may disappear with the new state: keep focus in the list
  // (next suggested action, else the first action, else the heading) instead of dropping it to <body>.
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const root = listRef.current;
    const next =
      root?.querySelector<HTMLButtonElement>('.xr-action[data-recommended]') ?? root?.querySelector<HTMLButtonElement>('.xr-action') ?? headingRef.current;
    next?.focus();
  }, [list]);

  return (
    <section className="xr-actions" aria-labelledby={headingId} data-testid="xr-actions">
      <h2 id={headingId} className="xr-side__h" ref={headingRef} tabIndex={-1}>
        {t(S.actionsHeading)}
      </h2>
      <p className="xr-muted xr-small">{t(S.actionsNote)}</p>
      {list.length === 0 ? null : (
        <ul className="xr-actions__list" ref={listRef}>
          {list.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="xr-action"
                data-recommended={a.recommended || undefined}
                data-action-id={a.id}
                onClick={() => {
                  refocus.current = true;
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

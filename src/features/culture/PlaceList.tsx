/** List alternative to the map (mandatory for screen readers; often nicer on phones). */
import type { CulturePlace } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui';
import { KindMark } from './KindMark';
import { groupPlacesByKind } from './model';
import { PLACE_KIND_TEXT, S } from './strings';

export function PlaceList({ places, selectedId, onSelect }: { places: CulturePlace[]; selectedId: string | null; onSelect(id: string): void }) {
  const { t } = useI18n();
  const groups = groupPlacesByKind(places);
  return (
    <div className="cu-list" data-testid="culture-list">
      {groups.map((g) => (
        <section key={g.kind} className="cu-list__group" aria-labelledby={`cu-list-${g.kind}`}>
          <h3 id={`cu-list-${g.kind}`} className="cu-list__h">
            <KindMark kind={g.kind} size={18} /> {t(PLACE_KIND_TEXT[g.kind].many)} <span className="cu-count">({g.places.length})</span>
          </h3>
          <p className="cu-small cl-muted">{t(PLACE_KIND_TEXT[g.kind].blurb)}</p>
          <ul className="cu-list__items">
            {g.places.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  className="cu-list__item"
                  aria-pressed={p.id === selectedId}
                  data-place-id={p.id}
                  data-testid={`list-place-${p.id}`}
                  onClick={() => onSelect(p.id)}
                >
                  <span className="cu-list__name">{t(p.name)}</span>
                  {p.producing && (
                    <span className="cu-list__grows">
                      <Icon name="leaf" size={14} /> {t(S.grows)}
                    </span>
                  )}
                  <Icon name="next" size={16} className="cu-list__chev" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

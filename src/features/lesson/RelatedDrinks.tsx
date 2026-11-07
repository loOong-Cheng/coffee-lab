import { Link } from 'react-router';
import { drinks } from '../../content';
import type { DrinkRecipe } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/icons';
import { S } from './strings';

/** Drinks whose `relatedLessonIds` mention this lesson (reverse lookup), easiest first. */
export function relatedDrinks(lessonId: string, max = 6): DrinkRecipe[] {
  return drinks
    .filter((d) => d.relatedLessonIds.includes(lessonId))
    .sort((a, b) => a.difficulty - b.difficulty)
    .slice(0, max);
}

/** "Try it in the Drink Atlas" links. Renders nothing when no drink relates to the lesson. */
export function RelatedDrinks({ lessonId, max, compact }: { lessonId: string; max?: number; compact?: boolean }) {
  const { t } = useI18n();
  const list = relatedDrinks(lessonId, max);
  if (list.length === 0) return null;
  const headingId = `ls-drinks-${compact ? 'c' : 'f'}`;
  return (
    <section className={compact ? 'ls-drinks ls-drinks--compact' : 'ls-drinks ls-card'} aria-labelledby={headingId}>
      <h2 id={headingId} className="ls-h2">
        <Icon name="globe" size={18} /> {t(S.tryInAtlas)}
      </h2>
      <ul className="ls-drinks__list" role="list">
        {list.map((d) => (
          <li key={d.id}>
            <Link to={`/atlas/${encodeURIComponent(d.id)}`} className="ls-drink" data-drink={d.id}>
              <Icon name="cup" size={18} />
              <span className="ls-drink__text">
                <span className="ls-drink__name">{t(d.name)}</span>
                {!compact && <span className="ls-drink__tag">{t(d.tagline)}</span>}
              </span>
              <Icon name="next" size={16} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

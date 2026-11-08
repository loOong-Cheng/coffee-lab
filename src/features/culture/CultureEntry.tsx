/** Light entry link to /culture for the home course map and the Drink Atlas (no content imports). */
import { Link } from 'react-router';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/icons';
import './cultureEntry.css';

const S = {
  title: { zh: '咖啡文化探索', en: 'Explore coffee culture' },
  body: {
    zh: '在世界地图和时间线上漫游：咖啡从哪里来、在哪里生长、各地怎样喝。',
    en: 'Wander a world map and timeline: where coffee came from, where it grows, how the world drinks it.',
  },
};

export function CultureEntryLink({ variant = 'card', testId = 'culture-entry' }: { variant?: 'card' | 'inline'; testId?: string }) {
  const { t } = useI18n();
  if (variant === 'inline') {
    return (
      <Link to="/culture" className="cu-entry-inline" data-testid={testId}>
        <Icon name="map" size={18} />
        <span>{t(S.title)}</span>
        <Icon name="next" size={16} />
      </Link>
    );
  }
  return (
    <Link to="/culture" className="cu-entry" data-testid={testId}>
      <span className="cu-entry__icon" aria-hidden="true">
        <Icon name="globe" size={28} />
      </span>
      <span className="cu-entry__body">
        <span className="cu-entry__title">{t(S.title)}</span>
        <span className="cu-entry__text">{t(S.body)}</span>
      </span>
      <Icon name="next" size={20} />
    </Link>
  );
}

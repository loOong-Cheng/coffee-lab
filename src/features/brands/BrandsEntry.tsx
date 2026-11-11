/** Light entry link to /brands for the Drink Atlas and Culture Explorer headers (no content imports). */
import { Link } from 'react-router';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/icons';
import { S } from './strings';
import './brandsEntry.css';

export function BrandsEntryLink({ testId = 'brands-entry' }: { testId?: string }) {
  const { t } = useI18n();
  return (
    <Link to="/brands" className="br-entry" data-testid={testId}>
      <Icon name="star" size={18} />
      <span>{t(S.entry)}</span>
      <Icon name="next" size={16} />
    </Link>
  );
}

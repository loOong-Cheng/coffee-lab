/**
 * /culture — Coffee Culture Explorer (咖啡文化探索): a 2D world map of origins, producing regions,
 * drink cultures and coffeehouses + an interactive history timeline, tied into the Drink Atlas,
 * the culture lessons and (on request) a matching music mood. Real data from src/content.
 */
import { Link } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { getTrackLessons, places, timeline } from '../../content';
import { useI18n } from '../../i18n';
import { Button, Icon } from '../../ui';
import { CultureExplorer } from './CultureExplorer';
import { S } from './strings';
import './culture.css';

export default function CulturePage() {
  const { t } = useI18n();
  useDocumentTitle(S.title);
  const lessons = getTrackLessons('culture');
  const jumpToTimeline = () => {
    const h = document.getElementById('cu-tl-h');
    h?.scrollIntoView?.({ block: 'start' });
    h?.focus({ preventScroll: true });
  };
  return (
    <div className="cu-page" data-testid="culture-page">
      <header className="cu-head">
        <p className="cl-eyebrow">
          <Icon name="globe" size={16} /> {t(S.eyebrow)}
        </p>
        <h1 id="page-title" className="cu-title">
          {t(S.title)}
        </h1>
        <p className="cu-lead">{t(S.lead)}</p>
        <div className="cu-headactions">
          <Button variant="ghost" size="sm" icon="clock" onClick={jumpToTimeline} data-testid="culture-jump-timeline">
            {t(S.jumpTimeline)}
          </Button>
        </div>
      </header>
      <CultureExplorer
        places={places}
        timeline={timeline}
        afterMap={
          <nav className="cu-deeper" aria-labelledby="cu-deeper-h">
            <h2 id="cu-deeper-h" className="cu-h3">
              {t(S.deeperH)}
            </h2>
            <ul>
              {lessons.map((l) => (
                <li key={l.id}>
                  <Link className="cu-pill" to={`/learn/${encodeURIComponent(l.id)}`}>
                    <Icon name="book" size={14} /> {t(l.title)}
                  </Link>
                </li>
              ))}
              <li>
                <Link className="cu-pill" to="/atlas">
                  <Icon name="cup" size={14} /> {t(S.atlasLink)}
                </Link>
              </li>
            </ul>
          </nav>
        }
      />
    </div>
  );
}

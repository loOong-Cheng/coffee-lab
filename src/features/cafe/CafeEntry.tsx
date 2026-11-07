/**
 * Small entry card for the home page. Deliberately light: no specs/content imports, so the home
 * chunk stays small; the mastered count is derived from the shared event transcript.
 */
import { Link } from 'react-router';
import { useI18n } from '../../i18n';
import { useLearner } from '../../state';
import { Icon } from '../../ui/icons';
import { Illustration } from '../../ui/illustrations/Illustration';
import './cafeEntry.css';

const S = {
  title: { zh: '咖啡馆吧台', en: 'Café Counter' },
  body: {
    zh: '客人点单，你来做：几份浓缩、多少奶、多厚的奶泡、用什么杯。弄清楚澳白和卡布奇诺到底差在哪儿。',
    en: 'Customers order, you build it: shots, milk, foam, cup. Find out what really separates a flat white from a cappuccino.',
  },
  open: { zh: '去吧台', en: 'Open the counter' },
  mastered: (n: number) => ({ zh: `已掌握 ${n} 款饮品`, en: `${n} drink${n === 1 ? '' : 's'} mastered` }),
  fresh: { zh: '三个班次：意式吧台、经典奶咖、世界咖啡馆', en: 'Three shifts: espresso bar, milk classics, world café' },
};

export function CafeEntryCard() {
  const { t } = useI18n();
  const mastered = useLearner((s) => {
    const ids = new Set<string>();
    for (const e of s.events) if (e.activityId.startsWith('cafe:') && e.evidence === 'assessed_answer' && e.score === 1) ids.add(e.activityId);
    return ids.size;
  });
  return (
    <Link to="/cafe" className="home-cafe" data-testid="home-cafe">
      <Illustration name="latte" className="home-cafe__art" />
      <span className="home-cafe__body">
        <span className="home-cafe__title">{t(S.title)}</span>
        <span className="home-cafe__text">{t(S.body)}</span>
        <span className="home-cafe__meta">{mastered > 0 ? t(S.mastered(mastered)) : t(S.fresh)}</span>
        <span className="home-cafe__cta">
          {t(S.open)} <Icon name="next" size={18} />
        </span>
      </span>
    </Link>
  );
}

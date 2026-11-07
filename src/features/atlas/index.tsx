/** TEMPORARY PLACEHOLDER (platform-architect) — web-product-engineer replaces this with the Drink Atlas (/atlas and /atlas/:drinkId). */
import { Link, useParams } from 'react-router';
import { Placeholder } from '../../app/Placeholder';
import { useI18n } from '../../i18n';

const S = {
  title: { zh: '咖啡饮品图鉴', en: 'Drink Atlas' },
  drink: { zh: '饮品编号', en: 'Drink id' },
  all: { zh: '查看全部饮品', en: 'All drinks' },
};

export default function AtlasPage() {
  const { t } = useI18n();
  const { drinkId } = useParams();
  return (
    <Placeholder title={S.title}>
      {drinkId && (
        <p>
          {t(S.drink)}: <code>{drinkId}</code> · <Link to="/atlas">{t(S.all)}</Link>
        </p>
      )}
    </Placeholder>
  );
}

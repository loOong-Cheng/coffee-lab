/** TEMPORARY PLACEHOLDER (platform-architect) — web-product-engineer replaces this with the real-world guide (kitchen mode). */
import { Link, useParams } from 'react-router';
import { Placeholder } from '../../app/Placeholder';
import { useI18n } from '../../i18n';

const S = {
  title: { zh: '真实练习指导', en: 'Real-world practice guide' },
  id: { zh: '练习编号', en: 'Activity id' },
  back: { zh: '返回练习', en: 'Back to practice' },
};

export default function PracticePage() {
  const { t } = useI18n();
  const { activityId = '' } = useParams();
  return (
    <Placeholder title={S.title}>
      <p>
        {t(S.id)}: <code>{activityId}</code>
      </p>
      <Link to="/journal">{t(S.back)}</Link>
    </Placeholder>
  );
}

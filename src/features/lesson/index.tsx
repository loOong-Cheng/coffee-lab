/** TEMPORARY PLACEHOLDER (platform-architect) — web-product-engineer replaces this with the lesson player. */
import { Link, useParams } from 'react-router';
import { Placeholder } from '../../app/Placeholder';
import { useI18n } from '../../i18n';

const S = {
  title: { zh: '课程', en: 'Lesson' },
  id: { zh: '课程编号', en: 'Lesson id' },
  back: { zh: '返回课程地图', en: 'Back to the course map' },
};

export default function LessonPage() {
  const { t } = useI18n();
  const { lessonId = '' } = useParams();
  return (
    <Placeholder title={S.title}>
      <p>
        {t(S.id)}: <code>{lessonId}</code>
      </p>
      <Link to="/">{t(S.back)}</Link>
    </Placeholder>
  );
}

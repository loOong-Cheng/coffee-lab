/** TEMPORARY PLACEHOLDER (platform-architect) — web-product-engineer replaces this with practice + brew journal. */
import { Placeholder } from '../../app/Placeholder';
import { useI18n } from '../../i18n';
import { useLearner } from '../../state';

const S = {
  title: { zh: '练习与冲煮日志', en: 'Practice & brew journal' },
  count: { zh: '已记录（自我报告）的冲煮次数', en: 'Brews logged (self-reported)' },
};

export default function JournalPage() {
  const { t } = useI18n();
  const count = useLearner((s) => s.journal.length);
  return (
    <Placeholder title={S.title}>
      <p>
        {t(S.count)}: {count}
      </p>
    </Placeholder>
  );
}

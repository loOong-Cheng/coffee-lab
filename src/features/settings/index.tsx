/** TEMPORARY PLACEHOLDER (platform-architect) — web-product-engineer replaces this with full settings. */
import { Placeholder } from '../../app/Placeholder';
import { useI18n } from '../../i18n';

const S = {
  title: { zh: '设置', en: 'Settings' },
  body: {
    zh: '语言、音效和音乐可在页眉中切换。更多设置即将上线。',
    en: 'Language, sound effects and music can be toggled in the header. More settings are coming.',
  },
};

export default function SettingsPage() {
  const { t } = useI18n();
  return (
    <Placeholder title={S.title}>
      <p>{t(S.body)}</p>
    </Placeholder>
  );
}

/**
 * TEMPORARY PLACEHOLDER (platform-architect) — web-product-engineer replaces this with the real,
 * skip-friendly onboarding (goal, experience, devices, equipment, preferred mode).
 * It already lets a learner continue with sensible defaults so no screen is a dead end.
 */
import { useNavigate } from 'react-router';
import { Placeholder } from '../../app/Placeholder';
import type { DeviceKind, LearnerProfile } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { suggestMode, useCapabilities } from '../../platform';
import { learnerActions } from '../../state';

const S = {
  title: { zh: '欢迎来到咖啡实验室', en: 'Welcome to Coffee Lab' },
  body: {
    zh: '完整的入门设置即将上线。现在可以先用默认设置开始（目标：意式浓缩，新手）。',
    en: 'Full setup is coming. For now you can start with defaults (goal: espresso, beginner).',
  },
  start: { zh: '使用默认设置开始', en: 'Start with defaults' },
};

export default function OnboardingPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const caps = useCapabilities();

  const startWithDefaults = () => {
    const device: DeviceKind = caps?.screen === 'mobile' ? 'phone' : caps?.screen === 'headset' ? 'headset' : 'pc';
    const profile: LearnerProfile = {
      goal: 'espresso',
      experience: 'new',
      devices: [device],
      equipment: [],
      wishlist: [],
      preferredMode: caps ? suggestMode(caps) : 'desktop',
      onboardedAt: new Date().toISOString(),
    };
    learnerActions.setProfile(profile);
    navigate('/', { replace: true });
  };

  return (
    <Placeholder title={S.title}>
      <p>{t(S.body)}</p>
      <button type="button" onClick={startWithDefaults} data-testid="onboarding-defaults">
        {t(S.start)}
      </button>
    </Placeholder>
  );
}

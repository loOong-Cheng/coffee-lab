/**
 * TEMPORARY PLACEHOLDER (platform-architect) — web-product-engineer replaces this with the course map.
 * Only reachable with a profile (the router redirects first-time learners to /onboarding).
 */
import { Link } from 'react-router';
import { Placeholder } from '../../app/Placeholder';
import { useI18n } from '../../i18n';
import { useLearner } from '../../state';

const S = {
  title: { zh: '你的咖啡课程', en: 'Your coffee course' },
  body: { zh: '课程地图将显示在这里。', en: 'The course map will appear here.' },
  sample: { zh: '示例课程：认识咖啡机', en: 'Sample lesson: meet the machine' },
  xr: { zh: '打开 XR 实验室', en: 'Open the XR Lab' },
  cont: { zh: '继续上次的位置', en: 'Continue where you left off' },
};

export default function HomePage() {
  const { t } = useI18n();
  const last = useLearner((s) => s.lastLocation?.route);
  return (
    <Placeholder title={S.title}>
      <p>{t(S.body)}</p>
      <ul>
        {last && (
          <li>
            <Link to={last}>{t(S.cont)}</Link>
          </li>
        )}
        <li>
          <Link to="/learn/esp-meet-the-machine">{t(S.sample)}</Link>
        </li>
        <li>
          <Link to="/xr">{t(S.xr)}</Link>
        </li>
      </ul>
    </Placeholder>
  );
}

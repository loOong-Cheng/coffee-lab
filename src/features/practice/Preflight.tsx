/** Kitchen-mode pre-flight: gear checklist, illustrative recipe, safety, tips, guidance tier and hands-free options. */
import { useState } from 'react';
import { Link } from 'react-router';
import type { Guidance, LocalizedText, PracticeSession } from '../../domain/contracts';
import { formatBrewRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { Button, Callout, GuidanceSelector, Switch, Tag } from '../../ui';
import { gearStatus } from '../atlas/filters';
import { equipmentName } from './catalog';
import type { WakeLockStatus } from './hooks';
import type { PracticePlan } from './plan';

const S = {
  eyebrow: { zh: '厨房模式 · 真实操作指导', en: 'Kitchen mode · real-world guide' },
  honesty: {
    zh: '应用看不到你的厨房，也感知不到你的器具。每一步都由你自己点“完成”确认——记录为“自我报告”。',
    en: 'The app can’t see your kitchen or sense your tools. You confirm each step yourself with “Done” — it’s recorded as self-reported.',
  },
  other: { zh: '你还有一个进行中的指导：', en: 'You have another guide in progress:' },
  goOther: { zh: '去继续那个', en: 'Continue that one' },
  before: { zh: '开始之前', en: 'Before you start' },
  gear: { zh: '器具清单', en: 'Gear checklist' },
  gearReady: (n: number, m: number) => ({ zh: `已准备 ${n}/${m}`, en: `${n} of ${m} ready` }),
  gearTip: { zh: '勾选只是帮你自己核对，不影响开始。', en: 'Ticking items is just for you — it doesn’t block starting.' },
  own: { zh: '你有', en: 'You have it' },
  covered: { zh: '随机器附带', en: 'Comes with your gear' },
  basic: { zh: '家用常备', en: 'Household basic' },
  missing: { zh: '不在你的器具里', en: 'Not in your setup' },
  missingNote: {
    zh: '缺少的器具可以先找替代品，或者先跟着读一遍。',
    en: 'Missing something? Use a substitute, or just read along this time.',
  },
  noProfile: { zh: '告诉我们你有哪些器具，就能看到哪些已经齐了。', en: 'Tell us what gear you have to see what’s ready.' },
  editSetup: { zh: '设置我的器具', en: 'Set up my gear' },
  recipe: { zh: '示例配方', en: 'Illustrative recipe' },
  recipeNote: { zh: '这是一个起点，不是“正确答案”。你的豆子、器具和口味可能需要别的数值。', en: 'A starting point, not “the correct” recipe. Your beans, gear and taste may call for other numbers.' },
  dose: { zh: '粉量', en: 'Coffee' },
  out: { zh: '出液', en: 'Out' },
  water: { zh: '水', en: 'Water' },
  milk: { zh: '牛奶', en: 'Milk' },
  ratio: { zh: '比例', en: 'Ratio' },
  refTime: (a: number, b: number) => ({ zh: `参考时间约 ${a}–${b} 秒（用来比较，不是及格线）`, en: `Reference time ≈ ${a}–${b} s (to compare, not a pass mark)` }),
  safety: { zh: '安全', en: 'Safety' },
  tips: { zh: '秤和计时小贴士', en: 'Scale & timer tips' },
  tip1: { zh: '秤放在平稳干燥的地方；先放杯子或滤杯，按“去皮/归零”，再加咖啡或水。', en: 'Put the scale on a flat, dry spot; place the cup or brewer on it and press tare (zero) before adding coffee or water.' },
  tip2: { zh: '每一步都有秒表，由你自己开始；它不会自动跳到下一步——什么时候完成由你决定。', en: 'Every step has a stopwatch you start yourself; it never moves you on — you decide when a step is done.' },
  tip3: { zh: '把手机放在远离水和蒸汽的地方；手湿时可以用干的指节点按。', en: 'Prop your phone away from water and steam; tap with a dry knuckle if your hands are wet.' },
  guidance: { zh: '需要多少引导？', en: 'How much guidance?' },
  guidanceHint: { zh: '随时可以在步骤中切换。', en: 'You can switch any time during the steps.' },
  handsFree: { zh: '解放双手', en: 'Hands-free options' },
  speak: { zh: '朗读步骤', en: 'Read steps aloud' },
  speakDesc: { zh: '使用浏览器的语音朗读，不会使用麦克风。', en: 'Uses your browser’s text-to-speech. Never uses the microphone.' },
  speakNo: { zh: '这个浏览器不支持朗读——步骤会一直显示在屏幕上。', en: 'Not available in this browser — steps stay on screen.' },
  awake: { zh: '保持屏幕常亮', en: 'Keep screen awake' },
  awakeDesc: { zh: '冲煮时屏幕不会自动熄灭。', en: 'Stops the screen from dimming while you brew.' },
  wake: {
    off: { zh: '', en: '' },
    requesting: { zh: '正在请求……', en: 'Requesting…' },
    active: { zh: '屏幕会保持常亮。', en: 'The screen will stay on.' },
    released: { zh: '系统释放了常亮（例如切到了其他应用），回到这里会再次尝试。', en: 'The system released it (e.g. you switched apps); it retries when you come back.' },
    unsupported: { zh: '这个浏览器不支持保持常亮。可以临时把手机的自动锁屏时间调长。', en: 'This browser can’t keep the screen on. Try setting your phone’s auto-lock longer for now.' },
    insecure: {
      zh: '保持常亮需要安全连接（HTTPS 或 localhost）。通过局域网 http 地址打开时浏览器会阻止它；可以临时调长自动锁屏。',
      en: 'Keeping the screen on needs a secure connection (HTTPS or localhost). Over a plain http LAN address the browser blocks it — set auto-lock longer for now.',
    },
    error: { zh: '没能保持常亮（可能开启了省电模式）。', en: 'Couldn’t keep the screen on (battery saver may block it).' },
  } satisfies Record<WakeLockStatus, LocalizedText>,
  start: { zh: '开始第 1 步', en: 'Start step 1' },
  steps: (n: number) => ({ zh: `共 ${n} 步`, en: `${n} steps` }),
};

export interface PreflightProps {
  plan: PracticePlan;
  owned: string[] | null;
  guidance: Guidance;
  onGuidance(g: Guidance): void;
  speakOn: boolean;
  speakSupported: boolean;
  onSpeak(on: boolean): void;
  keepAwake: boolean;
  wakeStatus: WakeLockStatus;
  onKeepAwake(on: boolean): void;
  otherSession: PracticeSession | null;
  otherTitle: LocalizedText | null;
  onStart(): void;
}

export function Preflight(p: PreflightProps) {
  const { t, locale } = useI18n();
  const { plan } = p;
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const status = gearStatus(plan.equipment, p.owned ?? []);
  const readyCount = status.items.filter((i) => ready[i.id]).length;
  const r = plan.recipe;
  const outWord = plan.brewKind === 'brew' ? S.water : S.out;

  return (
    <div className="kp-preflight">
      <header className="kp-head">
        <p className="cl-eyebrow">{t(S.eyebrow)}</p>
        <h1 id="page-title" className="kp-title">
          {t(plan.title)}
        </h1>
        {plan.intro && <p className="kp-lead">{t(plan.intro)}</p>}
        <p className="cl-muted">{t(S.steps(plan.steps.length))}</p>
      </header>

      <Callout kind="info" locale={locale}>
        {t(S.honesty)}
      </Callout>

      {p.otherSession && (
        <Callout kind="tip" locale={locale}>
          {t(S.other)} <strong>{p.otherTitle ? t(p.otherTitle) : p.otherSession.activityId}</strong>.{' '}
          <Link to={`/practice/${encodeURIComponent(p.otherSession.activityId)}`}>{t(S.goOther)}</Link>
        </Callout>
      )}

      <section className="kp-section" aria-labelledby="kp-before">
        <h2 id="kp-before">{t(S.before)}</h2>

        <div className="kp-grid">
          <div className="kp-panel">
            <h3>{t(S.gear)}</h3>
            <p className="cl-muted kp-small">
              {t(S.gearReady(readyCount, status.items.length))} · {t(S.gearTip)}
            </p>
            <ul className="kp-gear" data-testid="gear-checklist">
              {status.items.map((it) => (
                <li key={it.id}>
                  <label className="kp-gear__item">
                    <input
                      type="checkbox"
                      checked={!!ready[it.id]}
                      onChange={(e) => setReady((cur) => ({ ...cur, [it.id]: e.target.checked }))}
                    />
                    <span className="kp-gear__name">{t(equipmentName(it.id))}</span>
                    {p.owned && (
                      <Tag
                        tone={it.state === 'missing' ? 'warning' : it.state === 'basic' ? 'neutral' : 'success'}
                        icon={it.state === 'missing' ? 'warning' : 'check'}
                      >
                        {t(it.state === 'owned' ? S.own : it.state === 'covered' ? S.covered : it.state === 'basic' ? S.basic : S.missing)}
                      </Tag>
                    )}
                  </label>
                </li>
              ))}
            </ul>
            {p.owned && status.missing.length > 0 && <p className="kp-small">{t(S.missingNote)}</p>}
            {!p.owned && (
              <p className="kp-small">
                {t(S.noProfile)} <Link to="/onboarding?edit=1">{t(S.editSetup)}</Link>
              </p>
            )}
          </div>

          {r && (
            <div className="kp-panel">
              <h3>{t(S.recipe)}</h3>
              <dl className="kp-recipe">
                {r.doseG != null && (
                  <div>
                    <dt>{t(S.dose)}</dt>
                    <dd className="cl-num">{r.doseG} g</dd>
                  </div>
                )}
                {r.outG != null && (
                  <div>
                    <dt>{t(outWord)}</dt>
                    <dd className="cl-num">{r.outG} g</dd>
                  </div>
                )}
                {r.milkMl != null && (
                  <div>
                    <dt>{t(S.milk)}</dt>
                    <dd className="cl-num">{r.milkMl} ml</dd>
                  </div>
                )}
                {r.doseG != null && r.outG != null && (
                  <div>
                    <dt>{t(S.ratio)}</dt>
                    <dd className="cl-num">{formatBrewRatio(r.doseG, r.outG)}</dd>
                  </div>
                )}
              </dl>
              {r.ratioLabel && <p className="kp-small cl-muted">{t(r.ratioLabel)}</p>}
              {r.targetTimeSec && <p className="kp-small">{t(S.refTime(r.targetTimeSec[0], r.targetTimeSec[1]))}</p>}
              <p className="kp-small">{t(r.summary)}</p>
              {r.notes.map((n, i) => (
                <p key={i} className="kp-small cl-muted">
                  {t(n)}
                </p>
              ))}
              <Callout kind="illustrative" locale={locale}>
                {t(S.recipeNote)}
              </Callout>
            </div>
          )}
        </div>

        {plan.safetyNotes.length > 0 && (
          <Callout kind="safety" locale={locale} title={t(S.safety)}>
            <ul className="kp-list">
              {plan.safetyNotes.map((n, i) => (
                <li key={i}>{t(n)}</li>
              ))}
            </ul>
          </Callout>
        )}

        <details className="kp-details">
          <summary>{t(S.tips)}</summary>
          <ul className="kp-list">
            <li>{t(S.tip1)}</li>
            <li>{t(S.tip2)}</li>
            <li>{t(S.tip3)}</li>
          </ul>
        </details>
      </section>

      <section className="kp-section" aria-labelledby="kp-guidance">
        <h2 id="kp-guidance">{t(S.guidance)}</h2>
        <p className="cl-muted kp-small">{t(S.guidanceHint)}</p>
        <GuidanceSelector value={p.guidance} onChange={p.onGuidance} locale={locale} variant="full" label={t(S.guidance)} />
      </section>

      <section className="kp-section" aria-labelledby="kp-hands">
        <h2 id="kp-hands">{t(S.handsFree)}</h2>
        <div className="kp-switches">
          <Switch
            checked={p.speakOn && p.speakSupported}
            disabled={!p.speakSupported}
            onChange={p.onSpeak}
            label={t(S.speak)}
            description={p.speakSupported ? t(S.speakDesc) : t(S.speakNo)}
          />
          <Switch
            checked={p.keepAwake}
            onChange={p.onKeepAwake}
            label={t(S.awake)}
            description={p.keepAwake && p.wakeStatus !== 'off' ? t(S.wake[p.wakeStatus]) : t(S.awakeDesc)}
          />
        </div>
      </section>

      <div className="kp-start">
        <Button size="kitchen" block icon="play" onClick={p.onStart} data-testid="practice-start">
          {t(S.start)}
        </Button>
      </div>
    </div>
  );
}

export { S as PREFLIGHT_STRINGS };

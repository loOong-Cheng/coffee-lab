/**
 * One big step at a time. Guidance tiers change what is shown:
 *  - guided: step + detail + tip + illustration, help one tap away;
 *  - assisted: concise step, details on demand;
 *  - independent: compact checklist of all steps (tap any to jump), current one highlighted.
 * Safety notes are shown in EVERY tier. Done/Back/Repeat/Help are ≥64px (KitchenActionBar).
 */
import { useEffect, useRef, useState } from 'react';
import type { Guidance } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import {
  Button,
  Callout,
  GuidanceBadge,
  GuidanceSelector,
  hasIllustration,
  IconButton,
  Illustration,
  KitchenActionBar,
  Sheet,
  StepProgress,
  Switch,
  type StepState,
} from '../../ui';
import { companionGroupForStep, shotSlot } from './companion';
import type { WakeLockStatus } from './hooks';
import type { PracticePlan } from './plan';
import { PourSchedule } from './PourSchedule';
import type { PracticeAction, SessionPatch } from './session';
import { ShotTimer } from './ShotTimer';
import { CountdownCard, Stopwatch } from './Timers';

const S = {
  eyebrow: { zh: '厨房模式', en: 'Kitchen mode' },
  stepOf: (i: number, n: number) => ({ zh: `第 ${i} 步，共 ${n} 步`, en: `Step ${i} of ${n}` }),
  more: { zh: '更多说明', en: 'More detail' },
  less: { zh: '收起说明', en: 'Less detail' },
  tip: { zh: '提示', en: 'Tip' },
  help: { zh: '需要帮助？', en: 'Need help?' },
  skip: { zh: '跳过这一步', en: 'Skip this step' },
  skipNote: { zh: '跳过会被记录为“已跳过”，不算完成。', en: 'Skipping is recorded as skipped, not done.' },
  stepDown: { zh: '切换到“引导”模式（显示全部说明）', en: 'Switch to Guided (show all detail)' },
  close: { zh: '回到步骤', en: 'Back to the step' },
  settings: { zh: '厨房模式设置', en: 'Kitchen mode settings' },
  exit: { zh: '退出', en: 'Exit' },
  speakOn: { zh: '朗读已开启（点按静音）', en: 'Reading aloud — tap to mute' },
  speakOff: { zh: '朗读已关闭（点按开启）', en: 'Read aloud is off — tap to turn on' },
  speak: { zh: '朗读步骤', en: 'Read steps aloud' },
  speakNo: { zh: '这个浏览器不支持朗读。', en: 'Not available in this browser.' },
  awake: { zh: '保持屏幕常亮', en: 'Keep screen awake' },
  awakeOn: { zh: '屏幕常亮中', en: 'Screen kept awake' },
  checklist: { zh: '全部步骤', en: 'All steps' },
  jump: { zh: '跳到这一步', en: 'Jump to this step' },
  doneLast: { zh: '完成，去记录', en: 'Done — log it' },
  statusDone: { zh: '已完成', en: 'done' },
  statusSkipped: { zh: '已跳过', en: 'skipped' },
  statusHelp: { zh: '看过帮助', en: 'help opened' },
  current: { zh: '当前', en: 'current' },
  safetyLabel: { zh: '这一步的安全提示', en: 'Safety for this step' },
};

export interface StepRunnerProps {
  plan: PracticePlan;
  session: SessionPatch;
  onAction(a: PracticeAction): void;
  onRepeat(): void;
  onExit(): void;
  speakOn: boolean;
  speakSupported: boolean;
  onSpeak(on: boolean): void;
  keepAwake: boolean;
  wakeStatus: WakeLockStatus;
  onKeepAwake(on: boolean): void;
  /** Bumped by "Repeat" so the step card can flash. */
  repeatTick: number;
}

export function StepRunner(p: StepRunnerProps) {
  const { t, locale } = useI18n();
  const { plan, session } = p;
  const total = plan.steps.length;
  const idx = Math.min(session.stepIndex, total - 1);
  const step = plan.steps[idx]!;
  const guidance: Guidance = session.guidance;
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => setShowMore(false), [idx]);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!p.repeatTick) return;
    setFlash(true);
    headingRef.current?.scrollIntoView?.({ block: 'nearest' });
    const id = setTimeout(() => setFlash(false), 900);
    return () => clearTimeout(id);
  }, [p.repeatTick]);

  const states: StepState[] = plan.steps.map((s, i) => {
    if (i === idx) return 'current';
    const st = session.stepStatus[s.id];
    return st === 'done' ? 'done' : st === 'skipped' ? 'skipped' : 'todo';
  });

  const openHelp = () => {
    setHelpOpen(true);
    p.onAction({ type: 'help' });
  };

  const showDetail = guidance === 'guided' || (guidance === 'assisted' && showMore);
  const illustration = step.illustration && hasIllustration(step.illustration) ? step.illustration : null;
  const isLast = idx === total - 1;
  // Espresso shot timer / pour-over schedule replace this step's generic timers (one clock at a time).
  const companionGroup = companionGroupForStep(plan.companion, step.id);
  const companion =
    companionGroup && plan.companion ? (
      plan.companion.kind === 'shot-timer' ? (
        <ShotTimer key={shotSlot(companionGroup)} planId={plan.id} spec={plan.companion} group={companionGroup} speakOn={p.speakOn} />
      ) : (
        <PourSchedule key="pour-schedule" planId={plan.id} spec={plan.companion} speakOn={p.speakOn} />
      )
    ) : null;
  const referenceStep = !companion && !!step.timerSec && step.timerMode === 'reference';

  const statusWord = (id: string) => {
    const st = session.stepStatus[id];
    return st === 'done' ? t(S.statusDone) : st === 'skipped' ? t(S.statusSkipped) : st === 'help' ? t(S.statusHelp) : '';
  };

  return (
    <div className="kp-run" data-guidance={guidance}>
      <div className="kp-run__bar">
        <StepProgress current={idx} total={total} locale={locale} states={states} />
        <div className="kp-run__tools">
          <GuidanceBadge level={guidance} locale={locale} />
          {p.speakSupported && (
            <IconButton
              icon={p.speakOn ? 'sound-on' : 'sound-off'}
              label={t(p.speakOn ? S.speakOn : S.speakOff)}
              pressed={p.speakOn}
              onClick={() => p.onSpeak(!p.speakOn)}
            />
          )}
          <IconButton icon="sliders" label={t(S.settings)} onClick={() => setSettingsOpen(true)} data-testid="kitchen-settings" />
          <Button variant="ghost" size="md" icon="x" onClick={p.onExit} data-testid="practice-exit">
            {t(S.exit)}
          </Button>
        </div>
      </div>

      {p.keepAwake && p.wakeStatus === 'active' && (
        <p className="kp-awake cl-muted">
          <span aria-hidden="true">●</span> {t(S.awakeOn)}
        </p>
      )}

      <article className={`kp-step${flash ? ' is-flash' : ''}`} aria-labelledby="kp-step-text" data-testid="practice-step" data-step-id={step.id}>
        <h1 id="kp-step-text" ref={headingRef} tabIndex={-1} className="kp-step__text">
          <span className="cl-visually-hidden">{t(S.stepOf(idx + 1, total))}: </span>
          {t(step.text)}
        </h1>

        {step.safety?.map((n, i) => (
          <Callout key={i} kind="safety" locale={locale} title={t(S.safetyLabel)}>
            {t(n)}
          </Callout>
        ))}

        {/* Timers sit right under the step + safety so they're visible without scrolling. */}
        {companion}
        {!companion && step.timerSec && step.timerMode === 'countdown' ? (
          <CountdownCard key={step.id} planId={plan.id} stepId={step.id} seconds={step.timerSec} fromText={step.timerFromText} />
        ) : null}
        {referenceStep && <Stopwatch planId={plan.id} referenceSec={step.timerSec} prominent />}

        {guidance === 'guided' && (
          <>
            {step.detail && <p className="kp-step__detail">{t(step.detail)}</p>}
            <Callout kind="tip" locale={locale} title={t(S.tip)}>
              {t(step.help)}
            </Callout>
          </>
        )}
        {guidance === 'assisted' && (
          <>
            {showMore && step.detail && <p className="kp-step__detail">{t(step.detail)}</p>}
            {(step.detail || illustration) && (
              <Button variant="ghost" size="md" icon={showMore ? 'chevron-up' : 'chevron-down'} aria-expanded={showMore} onClick={() => setShowMore((v) => !v)}>
                {t(showMore ? S.less : S.more)}
              </Button>
            )}
          </>
        )}
        {showDetail && illustration && (
          <div className="kp-step__art">
            <Illustration name={illustration} />
          </div>
        )}
      </article>

      {!referenceStep && !companion && <Stopwatch planId={plan.id} />}

      {guidance === 'independent' && (
        <section className="kp-checklist" aria-labelledby="kp-checklist-h">
          <h2 id="kp-checklist-h" className="cl-eyebrow">
            {t(S.checklist)}
          </h2>
          <ol>
            {plan.steps.map((s, i) => {
              const st = session.stepStatus[s.id];
              return (
                <li key={s.id} data-state={i === idx ? 'current' : (st ?? 'todo')}>
                  <button
                    type="button"
                    className="kp-checklist__item"
                    aria-current={i === idx ? 'step' : undefined}
                    onClick={() => p.onAction({ type: 'goto', index: i })}
                    title={t(S.jump)}
                  >
                    <span className="kp-checklist__mark" aria-hidden="true">
                      {st === 'done' ? '✓' : st === 'skipped' ? '–' : i + 1}
                    </span>
                    <span className="kp-checklist__text">{t(s.text)}</span>
                    <span className="cl-visually-hidden">{i === idx ? t(S.current) : statusWord(s.id)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <KitchenActionBar
        locale={locale}
        className="kp-actions"
        onDone={() => p.onAction({ type: 'done' })}
        onBack={() => p.onAction({ type: 'back' })}
        backDisabled={idx === 0}
        onRepeat={p.onRepeat}
        onHelp={openHelp}
        doneLabel={isLast ? t(S.doneLast) : undefined}
      />

      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title={t(S.help)} locale={locale}>
        <p className="kp-help__step">
          <strong>{t(step.text)}</strong>
        </p>
        <p>{t(step.help)}</p>
        {step.detail && <p className="cl-muted">{t(step.detail)}</p>}
        {illustration && (
          <div className="kp-step__art">
            <Illustration name={illustration} />
          </div>
        )}
        <div className="kp-help__actions">
          <Button size="lg" block onClick={() => setHelpOpen(false)} data-testid="help-close">
            {t(S.close)}
          </Button>
          {guidance !== 'guided' && (
            <Button
              variant="secondary"
              size="lg"
              block
              onClick={() => {
                p.onAction({ type: 'guidance', guidance: 'guided' });
                setHelpOpen(false);
              }}
            >
              {t(S.stepDown)}
            </Button>
          )}
          <Button
            variant="ghost"
            size="lg"
            block
            onClick={() => {
              setHelpOpen(false);
              p.onAction({ type: 'skip' });
            }}
          >
            {t(S.skip)}
          </Button>
          <p className="cl-muted kp-small">{t(S.skipNote)}</p>
        </div>
      </Sheet>

      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title={t(S.settings)} locale={locale}>
        <GuidanceSelector
          value={guidance}
          onChange={(g) => p.onAction({ type: 'guidance', guidance: g })}
          locale={locale}
          variant="full"
        />
        <div className="kp-switches">
          <Switch
            checked={p.speakOn && p.speakSupported}
            disabled={!p.speakSupported}
            onChange={p.onSpeak}
            label={t(S.speak)}
            description={p.speakSupported ? undefined : t(S.speakNo)}
          />
          <Switch checked={p.keepAwake} onChange={p.onKeepAwake} label={t(S.awake)} />
        </div>
      </Sheet>
    </div>
  );
}

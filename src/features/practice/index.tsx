/**
 * /practice/:activityId — the phone-first real-world guide ("kitchen mode").
 * Works for any curriculum guided-practice activity and for any Drink Atlas recipe (`drink:<id>`).
 *
 * Honesty: the app cannot see the kitchen. Every step and the finished session are SELF-REPORTED
 * (event evidence 'self_report', mode 'real-world-guide'); timers never complete a step.
 * Interruption-safe: progress lives in state.activePractice (persisted) → "Resume where you left off?".
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useDocumentTitle } from '../../app/useDocumentTitle';
import { audio } from '../../audio';
import type { Guidance, LocalizedText } from '../../domain/contracts';
import { useI18n } from '../../i18n';
import { getLearnerState, learnerActions, useLearner } from '../../state';
import { announce, Button, Card, Dialog, EmptyState, EvidenceBadge, Illustration } from '../../ui';
import type { BrewValues } from '../journal/BrewLogForm';
import { resolvePlan } from './catalog';
import { FinishView, PracticeDone } from './FinishView';
import { clearPlanTimers, readKeepAwakePref, readStopwatchSeconds, speak, speechSupported, stopSpeaking, useWakeLock, writeKeepAwakePref } from './hooks';
import type { PracticePlan } from './plan';
import { Preflight } from './Preflight';
import { isFinishPhase, reducePractice, resumeDecision, sessionSummaryNote, tallySteps, type PracticeAction } from './session';
import { StepRunner } from './StepRunner';
import './practice.css';

const S = {
  title: { zh: '真实操作指导', en: 'Real-world guide' },
  notFound: { zh: '找不到这个练习', en: 'We couldn’t find that practice' },
  notFoundBody: {
    zh: '链接可能过期了，或者这不是一个实际操作练习。可以从练习页或饮品图鉴重新选择。',
    en: 'The link may be out of date, or it isn’t a hands-on practice. Pick one from Practice or the Drink Atlas.',
  },
  toPractice: { zh: '去练习页', en: 'Go to Practice' },
  toAtlas: { zh: '打开饮品图鉴', en: 'Open the Drink Atlas' },
  resumeQ: { zh: '从上次停下的地方继续？', en: 'Resume where you left off?' },
  resumeAt: (i: number, n: number) => ({ zh: `你停在第 ${i} 步（共 ${n} 步）：`, en: `You were on step ${i} of ${n}:` }),
  resumeFinish: { zh: '你已经确认了所有步骤，还差记录这一杯。', en: 'You confirmed every step — only the brew log is left.' },
  lastActive: { zh: '上次操作：', en: 'Last active:' },
  soFar: (n: number) => ({ zh: `目前确认完成 ${n} 步`, en: `${n} steps confirmed so far` }),
  resume: { zh: '继续', en: 'Resume' },
  startOver: { zh: '从头开始', en: 'Start over' },
  leave: { zh: '离开', en: 'Leave' },
  exitTitle: { zh: '离开厨房模式？', en: 'Leave kitchen mode?' },
  exitBody: {
    zh: '你的进度已保存在这台设备上，之后可以从“练习”页继续。',
    en: 'Your place is saved on this device — resume any time from Practice.',
  },
  exitKeep: { zh: '保存并离开', en: 'Save my place & leave' },
  exitEnd: { zh: '结束，不保存进度', en: 'End without saving progress' },
  exitStay: { zh: '继续做', en: 'Keep going' },
  replaceTitle: { zh: '替换进行中的指导？', en: 'Replace the guide in progress?' },
  replaceBody: (title: string, i: number, n: number) => ({
    zh: `你正在进行“${title}”（第 ${i}/${n} 步）。开始这个练习会结束那一个，它不会被记为完成。`,
    en: `You’re partway through “${title}” (step ${i} of ${n}). Starting this one ends that session; it won’t be recorded as completed.`,
  }),
  replaceGo: { zh: '开始这个练习', en: 'Start this one' },
  replaceOther: { zh: '去继续那个', en: 'Continue that one' },
  cancel: { zh: '取消', en: 'Cancel' },
  stepAnnounce: (i: number, n: number, text: string) => ({ zh: `第 ${i} 步，共 ${n} 步：${text}`, en: `Step ${i} of ${n}: ${text}` }),
  finished: { zh: '所有步骤都确认了。现在可以记录这一杯。', en: 'All steps confirmed. You can log your brew now.' },
  safety: { zh: '安全：', en: 'Safety: ' },
};

function formatWhen(iso: string, locale: 'zh' | 'en'): string {
  try {
    return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function PracticePage() {
  const { activityId = '' } = useParams();
  const resolution = useMemo(() => resolvePlan(activityId), [activityId]);
  if (!resolution.ok) return <PracticeNotFound />;
  return <KitchenMode key={resolution.plan.id} plan={resolution.plan} />;
}

function PracticeNotFound() {
  const { t } = useI18n();
  useDocumentTitle(S.notFound);
  return (
    <section className="kp-page" aria-labelledby="page-title">
      <h1 id="page-title" className="cl-visually-hidden">
        {t(S.title)}
      </h1>
      <EmptyState
        art={<Illustration name="cup" />}
        title={t(S.notFound)}
        action={
          <div className="cl-row">
            <Link className="cl-btn cl-btn--primary cl-btn--md" to="/journal">
              {t(S.toPractice)}
            </Link>
            <Link className="cl-btn cl-btn--secondary cl-btn--md" to="/atlas">
              {t(S.toAtlas)}
            </Link>
          </div>
        }
      >
        <p>{t(S.notFoundBody)}</p>
      </EmptyState>
    </section>
  );
}

type Phase = 'preflight' | 'resume' | 'run' | 'done';

function KitchenMode({ plan }: { plan: PracticePlan }) {
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  useDocumentTitle(plan.title);

  const active = useLearner((s) => s.activePractice);
  const owned = useLearner((s) => s.profile?.equipment ?? null);
  const speakPref = useLearner((s) => s.prefs.speakSteps);
  const defaultGuidance = useLearner((s) => s.prefs.defaultGuidance);
  const stepIds = useMemo(() => plan.steps.map((s) => s.id), [plan]);
  const total = stepIds.length;

  const decision = resumeDecision(active, plan.id, total);
  const mine = decision.kind === 'resume' ? decision.session : null;
  const other = decision.kind === 'other-active' ? decision.session : null;
  const otherPlan = useMemo(() => {
    if (!other) return null;
    const r = resolvePlan(other.activityId);
    return r.ok ? r.plan : null;
  }, [other?.activityId]);

  const [phase, setPhase] = useState<Phase>(() => (mine ? 'resume' : 'preflight'));
  const [guidance, setGuidance] = useState<Guidance>(defaultGuidance);
  const [exitOpen, setExitOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [repeatTick, setRepeatTick] = useState(0);
  const [keepAwake, setKeepAwake] = useState(readKeepAwakePref);
  const canSpeak = useMemo(speechSupported, []);
  const speakOn = speakPref && canSpeak;
  const wakeStatus = useWakeLock(keepAwake);

  // Session ended elsewhere (another tab, reset) while running → back to the start screen.
  useEffect(() => {
    if (phase === 'run' && !mine) setPhase('preflight');
  }, [phase, mine]);

  useEffect(() => () => stopSpeaking(), []);

  const exitTo = plan.lessonId ? `/learn/${encodeURIComponent(plan.lessonId)}` : plan.source === 'drink' ? `/atlas/${encodeURIComponent(plan.drinkId)}` : '/journal';

  const stepSpeech = useCallback(
    (index: number) => {
      const step = plan.steps[index];
      if (!step) return '';
      const safety = (step.safety ?? []).map((n) => `${t(S.safety)}${t(n)}`).join(' ');
      return [t(S.stepAnnounce(index + 1, total, t(step.text))), safety].filter(Boolean).join(' ');
    },
    [plan, t, total],
  );

  // Speak each new step when read-aloud is on (output only; never the microphone).
  const runningIndex = phase === 'run' && mine && !isFinishPhase(mine, total) ? mine.stepIndex : -1;
  useEffect(() => {
    if (runningIndex < 0) return;
    if (speakOn) speak(stepSpeech(runningIndex), locale);
  }, [runningIndex, speakOn, stepSpeech, locale]);

  const setSpeak = (on: boolean) => {
    learnerActions.updatePrefs({ speakSteps: on });
    if (!on) stopSpeaking();
    else if (runningIndex >= 0) speak(stepSpeech(runningIndex), locale);
  };

  const setAwake = (on: boolean) => {
    setKeepAwake(on);
    writeKeepAwakePref(on);
  };

  const begin = () => {
    learnerActions.startPractice(plan.id, guidance);
    clearPlanTimers(plan.id);
    if (other) clearPlanTimers(other.activityId);
    setReplaceOpen(false);
    setPhase('run');
    audio.play('select');
  };

  const onStart = () => {
    if (other) setReplaceOpen(true);
    else begin();
  };

  const dispatch = (action: PracticeAction) => {
    const cur = getLearnerState().activePractice;
    if (!cur || cur.activityId !== plan.id) return;
    const next = reducePractice(cur, action, stepIds);
    const finishing = !isFinishPhase(cur, total) && isFinishPhase(next, total);
    learnerActions.updatePractice(next);
    if (finishing) {
      // Record the self-reported completion once per session (Back + Done again won't duplicate).
      const already = getLearnerState().events.some(
        (e) => e.activityId === plan.id && e.outcome === 'completed' && e.evidence === 'self_report' && e.recordedAt >= cur.startedAt,
      );
      if (!already) {
        learnerActions.recordEvent({
          activityId: plan.id,
          lessonId: plan.lessonId,
          mode: 'real-world-guide',
          guidance: next.guidance,
          evidence: 'self_report',
          outcome: 'completed',
          notes: sessionSummaryNote(tallySteps(next.stepStatus, stepIds)),
        });
      }
      stopSpeaking();
      audio.play('complete');
      announce(t(S.finished));
    } else if (action.type === 'done' || action.type === 'skip' || action.type === 'back' || action.type === 'goto') {
      if (action.type === 'done') audio.play('tap');
      if (!speakOn && next.stepIndex < total) announce(stepSpeech(next.stepIndex));
    }
  };

  const repeat = () => {
    if (!mine) return;
    setRepeatTick((n) => n + 1);
    if (speakOn) speak(stepSpeech(mine.stepIndex), locale);
    else announce(stepSpeech(mine.stepIndex));
  };

  const finishWithLog = (v: BrewValues) => {
    const entry = learnerActions.addJournalEntry({ drinkId: plan.drinkId, activityId: plan.id, ...v });
    learnerActions.endPractice();
    clearPlanTimers(plan.id);
    audio.play('correct');
    navigate(`/journal?entry=${encodeURIComponent(entry.id)}&from=practice`);
  };

  const finishWithoutLog = () => {
    learnerActions.endPractice();
    clearPlanTimers(plan.id);
    setPhase('done');
  };

  const endAndLeave = () => {
    learnerActions.endPractice();
    clearPlanTimers(plan.id);
    stopSpeaking();
    setExitOpen(false);
    navigate(exitTo);
  };

  const otherTitle: LocalizedText | null = otherPlan?.title ?? null;

  return (
    <section className="kp-page" aria-labelledby={phase === 'run' && mine && !isFinishPhase(mine, total) ? 'kp-step-text' : 'page-title'} data-phase={phase}>
      {phase === 'preflight' && (
        <Preflight
          plan={plan}
          owned={owned}
          guidance={guidance}
          onGuidance={setGuidance}
          speakOn={speakOn}
          speakSupported={canSpeak}
          onSpeak={setSpeak}
          keepAwake={keepAwake}
          wakeStatus={wakeStatus}
          onKeepAwake={setAwake}
          otherSession={other}
          otherTitle={otherTitle}
          onStart={onStart}
        />
      )}

      {phase === 'resume' && mine && (
        <div className="kp-resume">
          <p className="cl-eyebrow">{t(plan.title)}</p>
          <Card as="div" tone="accent" className="kp-resume__card" data-testid="resume-prompt">
            <h1 id="page-title" className="kp-title">
              {t(S.resumeQ)}
            </h1>
            {isFinishPhase(mine, total) ? (
              <p>{t(S.resumeFinish)}</p>
            ) : (
              <>
                <p>{t(S.resumeAt(mine.stepIndex + 1, total))}</p>
                <p className="kp-resume__step">{t(plan.steps[mine.stepIndex]!.text)}</p>
              </>
            )}
            <p className="cl-muted kp-small">
              {t(S.soFar(tallySteps(mine.stepStatus, stepIds).done))} · {t(S.lastActive)} <time dateTime={mine.updatedAt}>{formatWhen(mine.updatedAt, locale)}</time>
            </p>
            <EvidenceBadge kind="self_report" locale={locale} />
            <div className="kp-resume__actions">
              <Button size="kitchen" block icon="play" onClick={() => setPhase('run')} data-testid="resume-continue">
                {t(S.resume)}
              </Button>
              <Button variant="secondary" size="lg" block icon="repeat" onClick={begin} data-testid="resume-restart">
                {t(S.startOver)}
              </Button>
              <Button variant="ghost" size="lg" block onClick={() => navigate(exitTo)}>
                {t(S.leave)}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {phase === 'run' && mine && !isFinishPhase(mine, total) && (
        <StepRunner
          plan={plan}
          session={mine}
          onAction={dispatch}
          onRepeat={repeat}
          onExit={() => setExitOpen(true)}
          speakOn={speakOn}
          speakSupported={canSpeak}
          onSpeak={setSpeak}
          keepAwake={keepAwake}
          wakeStatus={wakeStatus}
          onKeepAwake={setAwake}
          repeatTick={repeatTick}
        />
      )}

      {phase === 'run' && mine && isFinishPhase(mine, total) && (
        <FinishView
          plan={plan}
          tally={tallySteps(mine.stepStatus, stepIds)}
          stopwatchSec={readStopwatchSeconds(plan.id)}
          onSave={finishWithLog}
          onSkip={finishWithoutLog}
          onBack={() => dispatch({ type: 'back' })}
        />
      )}

      {phase === 'done' && <PracticeDone plan={plan} onAgain={() => setPhase('preflight')} />}

      <Dialog
        open={exitOpen}
        onClose={() => setExitOpen(false)}
        title={t(S.exitTitle)}
        description={t(S.exitBody)}
        locale={locale}
        footer={
          <>
            <Button variant="ghost" onClick={() => setExitOpen(false)}>
              {t(S.exitStay)}
            </Button>
            <Button variant="danger" onClick={endAndLeave} data-testid="exit-end">
              {t(S.exitEnd)}
            </Button>
            <Button
              onClick={() => {
                stopSpeaking();
                setExitOpen(false);
                navigate(exitTo);
              }}
              data-testid="exit-keep"
            >
              {t(S.exitKeep)}
            </Button>
          </>
        }
      />

      <Dialog
        open={replaceOpen}
        onClose={() => setReplaceOpen(false)}
        title={t(S.replaceTitle)}
        description={
          other
            ? t(S.replaceBody(otherTitle ? t(otherTitle) : other.activityId, Math.min(other.stepIndex + 1, otherPlan?.steps.length ?? other.stepIndex + 1), otherPlan?.steps.length ?? other.stepIndex + 1))
            : undefined
        }
        role="alertdialog"
        locale={locale}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReplaceOpen(false)}>
              {t(S.cancel)}
            </Button>
            {other && (
              <Button variant="secondary" onClick={() => navigate(`/practice/${encodeURIComponent(other.activityId)}`)}>
                {t(S.replaceOther)}
              </Button>
            )}
            <Button onClick={begin} data-testid="replace-start">
              {t(S.replaceGo)}
            </Button>
          </>
        }
      />
    </section>
  );
}

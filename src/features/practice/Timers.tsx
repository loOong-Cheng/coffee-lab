/**
 * Kitchen-mode timers. The learner starts, pauses and resets them; they NEVER complete or advance
 * a step (timerSec is a reference — lead decision). A countdown is only offered for waits (bloom,
 * steep, cool); everything judged by weight or taste gets the stopwatch with a reference.
 */
import { audio } from '../../audio';
import { useI18n } from '../../i18n';
import { announce, Button, ProgressRing } from '../../ui';
import { timerKey, usePersistentTimer } from './hooks';
import { elapsedMs, formatClock, pauseTimer, remainingMs, resetTimer, startTimer, timerFraction } from './timer';

const S = {
  stopwatch: { zh: '秒表', en: 'Stopwatch' },
  countdown: { zh: '等待计时', en: 'Wait timer' },
  start: { zh: '开始', en: 'Start' },
  pause: { zh: '暂停', en: 'Pause' },
  resume: { zh: '继续', en: 'Resume' },
  reset: { zh: '归零', en: 'Reset' },
  restart: { zh: '从 0 重新开始', en: 'Restart from 0' },
  running: { zh: '计时中', en: 'running' },
  paused: { zh: '已暂停', en: 'paused' },
  reference: (sec: number) => ({
    zh: `参考约 ${sec} 秒——按重量和味道停止，而不是按时钟。`,
    en: `Reference ≈ ${sec} s — stop by weight and taste, not by the clock.`,
  }),
  fromText: { zh: '（时长取自配方文字）', en: '(duration taken from the recipe text)' },
  timesUp: { zh: '时间到——检查一下，准备好了再点“完成”。', en: 'Time’s up — check it, then tap Done when you’re ready.' },
  timesUpShort: { zh: '时间到', en: 'Time’s up' },
  never: { zh: '计时器不会替你完成步骤。', en: 'Timers never complete a step for you.' },
  measured: { zh: '应用记录', en: 'Recorded by app' },
};

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* optional */
  }
}

/** One stopwatch per practice plan (persisted for the session, offered to the brew log). */
export function Stopwatch({ planId, referenceSec, prominent }: { planId: string; referenceSec?: number; prominent?: boolean }) {
  const { t } = useI18n();
  const { timer, now, update } = usePersistentTimer(timerKey(planId, 'stopwatch'), 'stopwatch', 0);
  const ms = elapsedMs(timer, now);
  const running = timer.status === 'running';
  const label = t(S.stopwatch);
  return (
    <section className={`kp-timer kp-timer--stopwatch${prominent ? ' kp-timer--prominent' : ''}`} aria-label={label} data-testid="stopwatch">
      <div className="kp-timer__head">
        <span className="cl-eyebrow">{label}</span>
        <time className="kp-timer__digits" aria-live="off" data-status={timer.status}>
          {formatClock(ms)}
        </time>
        <span className="cl-visually-hidden" role="status">
          {timer.status === 'running' ? t(S.running) : timer.status === 'paused' ? t(S.paused) : ''}
        </span>
      </div>
      {referenceSec ? <p className="kp-timer__ref">{t(S.reference(referenceSec))}</p> : null}
      <div className="kp-timer__actions">
        {running ? (
          <Button variant="secondary" size={prominent ? 'lg' : 'md'} icon="pause" onClick={() => update(pauseTimer)}>
            {t(S.pause)}
          </Button>
        ) : (
          <Button
            variant={prominent ? 'primary' : 'secondary'}
            size={prominent ? 'lg' : 'md'}
            icon="play"
            onClick={() => {
              update(startTimer);
              audio.play('tap');
            }}
            data-testid="stopwatch-start"
          >
            {timer.status === 'paused' ? t(S.resume) : t(S.start)}
          </Button>
        )}
        {timer.status !== 'idle' && (
          <Button
            variant="ghost"
            size={prominent ? 'lg' : 'md'}
            icon="repeat"
            onClick={() => update((tt, at) => (running ? startTimer(resetTimer(tt), at) : resetTimer(tt)))}
          >
            {running ? t(S.restart) : t(S.reset)}
          </Button>
        )}
      </div>
    </section>
  );
}

/** Countdown for a wait step (bloom/steep/cool). Cue + vibration at zero; never advances the step. */
export function CountdownCard({ planId, stepId, seconds, fromText }: { planId: string; stepId: string; seconds: number; fromText?: boolean }) {
  const { t, locale } = useI18n();
  const { timer, now, update } = usePersistentTimer(timerKey(planId, `step:${stepId}`), 'countdown', seconds, () => {
    audio.play('timer');
    vibrate([200, 100, 200]);
    announce(t(S.timesUp), 'assertive');
  });
  const remaining = remainingMs(timer, now);
  const finished = timer.status === 'finished';
  const running = timer.status === 'running';
  return (
    <section className={`kp-timer kp-timer--countdown${finished ? ' is-finished' : ''}`} aria-label={t(S.countdown)} data-testid="countdown">
      <div className="kp-timer__head">
        <ProgressRing
          value={timerFraction(timer, now)}
          size={72}
          label={t(S.countdown)}
          valueText={locale === 'zh' ? `剩余 ${formatClock(remaining, true)}` : `${formatClock(remaining, true)} left`}
        >
          <span className="kp-timer__ring-text">{finished ? '0:00' : formatClock(remaining, true)}</span>
        </ProgressRing>
        <div>
          <span className="cl-eyebrow">{t(S.countdown)}</span>
          <time className="kp-timer__digits" data-status={timer.status}>
            {formatClock(remaining, true)}
          </time>
          {fromText && <p className="kp-timer__ref cl-muted">{t(S.fromText)}</p>}
        </div>
      </div>
      {finished && (
        <p className="kp-timer__done" role="status">
          <strong>{t(S.timesUpShort)}</strong> — {t(S.timesUp)}
        </p>
      )}
      <div className="kp-timer__actions">
        {running ? (
          <Button variant="secondary" size="lg" icon="pause" onClick={() => update(pauseTimer)}>
            {t(S.pause)}
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            icon="play"
            onClick={() => {
              update(startTimer);
              audio.play('tap');
            }}
            data-testid="countdown-start"
          >
            {timer.status === 'paused' ? t(S.resume) : finished ? t(S.restart) : t(S.start)}
          </Button>
        )}
        {timer.status !== 'idle' && (
          <Button variant="ghost" size="lg" icon="repeat" onClick={() => update(resetTimer)}>
            {t(S.reset)}
          </Button>
        )}
      </div>
      <p className="kp-timer__note cl-muted">{t(S.never)}</p>
    </section>
  );
}

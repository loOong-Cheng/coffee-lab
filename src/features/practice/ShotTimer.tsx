/**
 * Espresso shot timer companion. The learner taps Start when THEY start the pump and Stop when THEY stop
 * it; the app measures only the interval between those two taps ("timed in app" → observed_by_app).
 * It never sees the machine or the scale, never judges the shot, and never completes a step.
 */
import { useId } from 'react';
import { audio } from '../../audio';
import { formatBrewRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { announce, Button, Callout, Icon, Tag } from '../../ui';
import { shotSlot, type ShotTimerSpec } from './companion';
import { speak, timerKey, useCarry, usePersistentTimer } from './hooks';
import { measuredSeconds } from './measured';
import { elapsedMs, formatClock, resetTimer, startTimer, stopTimer } from './timer';

const S = {
  title: { zh: '萃取计时', en: 'Shot timer' },
  how: {
    zh: '开泵的那一刻点“开始”，停泵的那一刻点“停止”。应用只记录你两次点按之间的时间。',
    en: 'Tap Start the moment you start the pump and Stop the moment you stop it. The app only times the gap between your two taps.',
  },
  yield: { zh: '目标出液', en: 'Target yield' },
  dose: { zh: '粉量', en: 'Dose' },
  ratio: { zh: '比例', en: 'Ratio' },
  refTime: { zh: '参考时间', en: 'Reference time' },
  refCommon: (a: number, b: number) => ({
    zh: `很多配方大约在 ${a}–${b} 秒之间——按重量停止，而不是按时钟。看你自己的秤，应用看不到它。`,
    en: `Many recipes land around ${a}–${b} s — stop by weight, not by the clock. Read your own scale; the app can’t see it.`,
  }),
  refRecipe: (a: number, b: number) => ({
    zh: `这个配方的参考约 ${a}–${b} 秒——按重量停止，而不是按时钟。看你自己的秤，应用看不到它。`,
    en: `This recipe’s reference is about ${a}–${b} s — stop by weight, not by the clock. Read your own scale; the app can’t see it.`,
  }),
  start: { zh: '开始萃取计时', en: 'Start shot' },
  stop: { zh: '停止', en: 'Stop shot' },
  running: { zh: '计时中……接近目标重量时停泵，然后点“停止”。', en: 'Timing… stop the pump near your target weight, then tap Stop.' },
  result: { zh: '萃取时间', en: 'Shot time' },
  timed: { zh: '应用计时', en: 'Timed in app' },
  timedDetail: { zh: '在你点“开始”和“停止”之间测得。其余数值（重量、味道）都是你自己报告的。', en: 'Measured between your Start and Stop taps. Everything else (weights, taste) is your own report.' },
  within: (a: number, b: number) => ({ zh: `落在 ${a}–${b} 秒的参考范围内——好不好喝由味道决定。`, en: `Within the ${a}–${b} s reference — taste decides whether you like it.` }),
  shorter: (a: number, b: number) => ({ zh: `比 ${a}–${b} 秒的参考短——这不算失败，尝一尝再记录。`, en: `Shorter than the ${a}–${b} s reference — not a fail; taste it and log it.` }),
  longer: (a: number, b: number) => ({ zh: `比 ${a}–${b} 秒的参考长——这不算失败，尝一尝再记录。`, en: `Longer than the ${a}–${b} s reference — not a fail; taste it and log it.` }),
  carry: (clock: string) => ({ zh: `把 ${clock} 填进我的冲煮记录`, en: `Use ${clock} in my brew log` }),
  carried: (clock: string) => ({ zh: `${clock} 会填进你的冲煮记录，并标注“应用计时”。`, en: `${clock} will go in your brew log, marked “Timed in app”.` }),
  uncarry: { zh: '不用这个时间', en: 'Don’t use this time' },
  again: { zh: '再计时一杯', en: 'Time another shot' },
  never: { zh: '计时器不会替你完成步骤——停好、记下重量后再点“完成”。', en: 'The timer never completes a step — tap Done once you’ve stopped and noted the weight.' },
  started: { zh: '萃取计时开始', en: 'Shot timer started' },
  stoppedAt: (s: number) => ({ zh: `停止。萃取时间 ${s} 秒，应用计时。`, en: `Stopped. Shot time ${s} seconds, timed in app.` }),
};

export interface ShotTimerProps {
  planId: string;
  spec: ShotTimerSpec;
  group: readonly string[];
  speakOn?: boolean;
}

export function ShotTimer({ planId, spec, group, speakOn }: ShotTimerProps) {
  const { t, locale } = useI18n();
  const hid = useId();
  const slot = shotSlot(group);
  const { timer, now, update } = usePersistentTimer(timerKey(planId, slot), 'stopwatch', 0);
  const [carry, setCarry] = useCarry(planId);
  const ms = elapsedMs(timer, now);
  const sec = measuredSeconds(timer, now);
  const [a, b] = spec.referenceSec;
  const finished = timer.status === 'finished' && sec !== null;
  const clock = formatClock(ms);
  const carried = finished && carry?.slot === slot && carry.sec === sec;

  const say = (msg: string) => {
    if (!(speakOn && speak(msg, locale))) announce(msg);
  };

  const onStart = () => {
    update((tt, at) => startTimer(resetTimer(tt), at));
    if (carry?.slot === slot) setCarry(null);
    audio.play('tap');
    say(t(S.started));
  };
  const onStop = () => {
    const at = Date.now();
    const stopped = Math.round(elapsedMs(stopTimer(timer, at), at) / 1000);
    update(stopTimer);
    audio.play('timer');
    say(t(S.stoppedAt(stopped)));
  };
  const onReset = () => {
    update(resetTimer);
    if (carry?.slot === slot) setCarry(null);
  };

  const verdict = sec === null ? null : sec < a ? S.shorter(a, b) : sec > b ? S.longer(a, b) : S.within(a, b);

  return (
    <section className="kp-companion kp-shot" aria-labelledby={hid} data-testid="shot-timer" data-status={timer.status}>
      <div className="kp-companion__head">
        <h2 id={hid} className="kp-companion__title">
          <Icon name="timer" size={22} /> {t(S.title)}
        </h2>
      </div>
      <p className="kp-companion__how">{t(S.how)}</p>

      <time className="kp-companion__clock" data-testid="shot-digits" data-status={timer.status} aria-live="off">
        {clock}
      </time>

      <dl className="kp-companion__facts">
        {spec.targetOutG != null && (
          <div>
            <dt>{t(S.yield)}</dt>
            <dd className="cl-num" data-testid="shot-target">≈ {spec.targetOutG} g</dd>
          </div>
        )}
        {spec.doseG != null && (
          <div>
            <dt>{t(S.dose)}</dt>
            <dd className="cl-num">{spec.doseG} g</dd>
          </div>
        )}
        {spec.doseG != null && spec.targetOutG != null && (
          <div>
            <dt>{t(S.ratio)}</dt>
            <dd className="cl-num">{formatBrewRatio(spec.doseG, spec.targetOutG)}</dd>
          </div>
        )}
        <div>
          <dt>{t(S.refTime)}</dt>
          <dd className="cl-num">
            ~{a}–{b} s
          </dd>
        </div>
      </dl>
      <Callout kind="illustrative" locale={locale}>
        {t(spec.referenceFrom === 'recipe' ? S.refRecipe(a, b) : S.refCommon(a, b))}
      </Callout>

      {timer.status === 'running' && <p className="kp-companion__status">{t(S.running)}</p>}

      {finished && (
        <div className="kp-companion__result" data-testid="shot-result">
          <p className="kp-companion__result-line">
            <strong>
              {t(S.result)}: <span className="cl-num">{clock}</span>
            </strong>{' '}
            <Tag tone="info" icon="clock">
              {t(S.timed)}
            </Tag>
          </p>
          <p className="kp-small cl-muted">{t(S.timedDetail)}</p>
          {verdict && <p className="kp-small">{t(verdict)}</p>}
          {carried ? (
            <div className="kp-companion__carried">
              <p data-testid="shot-carried">
                <Icon name="check" size={18} /> {t(S.carried(clock))}
              </p>
              <Button variant="ghost" size="lg" onClick={() => setCarry(null)}>
                {t(S.uncarry)}
              </Button>
            </div>
          ) : (
            <Button size="kitchen" block icon="journal" onClick={() => setCarry({ sec: sec!, source: 'shot', slot })} data-testid="shot-carry">
              {t(S.carry(clock))}
            </Button>
          )}
        </div>
      )}

      <div className="kp-companion__actions">
        {timer.status === 'running' ? (
          <Button size="kitchen" block variant="danger" onClick={onStop} data-testid="shot-stop">
            {t(S.stop)}
          </Button>
        ) : finished ? (
          <Button size="kitchen" block variant="secondary" icon="repeat" onClick={onReset} data-testid="shot-reset">
            {t(S.again)}
          </Button>
        ) : (
          <Button size="kitchen" block icon="play" onClick={onStart} data-testid="shot-start">
            {t(S.start)}
          </Button>
        )}
      </div>
      <p className="kp-timer__note cl-muted">{t(S.never)}</p>
    </section>
  );
}

/**
 * Pour-over schedule companion: a user-started clock that shows the current phase of an illustrative
 * recipe and the cumulative scale reading THE SCHEDULE expects — "a schedule to follow, not a
 * measurement". The learner reads their own scale. Phase changes get a gentle cue (audio respects the
 * SFX preference via the shared engine), a short vibration where supported, and a screen-reader
 * announcement (or speech when read-aloud is on). Only the total time between the learner's Start and
 * "It's drained" taps is measured (offered to the brew log as "timed in app").
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { audio } from '../../audio';
import { formatRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { announce, Button, Callout, Icon, IconButton, Tag } from '../../ui';
import type { PourScheduleSpec } from './companion';
import { readPlanNumber, speak, timerKey, useCarry, usePersistentTimer, writePlanNumber } from './hooks';
import { measuredSeconds } from './measured';
import { buildPourSchedule, clampDose, phaseInstruction, phaseName, POUR_TEMPLATES, scheduleAt, type PourSchedule as Schedule } from './schedule';
import { elapsedMs, formatClock, pauseTimer, resetTimer, startTimer, stopTimer } from './timer';

const S = {
  title: { zh: '注水时间表', en: 'Pour schedule' },
  notMeasure: { zh: '时间表，不是测量', en: 'A schedule, not a measurement' },
  how: {
    zh: '开始闷蒸注水时点“开始”。这里显示的是示例配方此刻“应该”的秤上读数——请看你自己的秤，应用看不到它。',
    en: 'Tap Start as you begin the bloom pour. This shows what an illustrative recipe would have your scale reading — read your own scale; the app can’t see it.',
  },
  dose: { zh: '咖啡粉量', en: 'Coffee dose' },
  less: { zh: '减少 1 克咖啡粉', en: 'Less coffee (−1 g)' },
  more: { zh: '增加 1 克咖啡粉', en: 'More coffee (+1 g)' },
  total: (w: number, r: string) => ({ zh: `→ 总水量 ${w} 克 · ${r}`, en: `→ ${w} g water in total · ${r}` }),
  recipeLine: (d: number, w: number, r: string) => ({ zh: `${d} 克咖啡粉 → ${w} 克水（${r}）`, en: `${d} g coffee → ${w} g water (${r})` }),
  doseLocked: { zh: '重置后才能修改粉量。', en: 'Reset to change the dose.' },
  pace: (g: number) => ({ zh: `按时间表，秤此刻约 ${g} 克`, en: `On schedule, the scale would read about ${g} g now` }),
  reachBy: (g: number, at: string, left: string) => ({ zh: `${at} 前到 ${g} 克（还剩 ${left}）`, en: `Reach ${g} g by ${at} (${left} left)` }),
  nextIn: (left: string, g: number) => ({ zh: `下一段注水：${left} 后，注到 ${g} 克`, en: `Next pour in ${left} — up to ${g} g` }),
  drawdown: (a: string, b: string) => ({
    zh: `很多人在 ${a}–${b} 之间滴完（示意）。滴完后点“已滴完”。`,
    en: `Many finish around ${a}–${b} (illustrative). Tap “It’s drained” when the dripping stops.`,
  }),
  over: { zh: '已经超过参考时间——没关系。滴完后点“已滴完”。', en: 'Past the reference time — that’s fine. Tap “It’s drained” when the dripping stops.' },
  idle: { zh: '准备好就点“开始”。', en: 'Tap Start when you’re ready to pour.' },
  start: { zh: '开始时间表', en: 'Start schedule' },
  pause: { zh: '暂停', en: 'Pause' },
  resume: { zh: '继续', en: 'Resume' },
  drained: { zh: '已滴完——停止', en: 'It’s drained — stop' },
  reset: { zh: '重置', en: 'Reset' },
  paused: { zh: '已暂停', en: 'Paused' },
  result: { zh: '总冲煮时间', en: 'Total brew time' },
  timed: { zh: '应用计时', en: 'Timed in app' },
  timedDetail: { zh: '在你点“开始”和“已滴完”之间测得。其余数值都是你自己报告的。', en: 'Measured between your Start and “It’s drained” taps. Everything else is your own report.' },
  carry: (clock: string) => ({ zh: `把 ${clock} 填进我的冲煮记录`, en: `Use ${clock} in my brew log` }),
  carried: (clock: string) => ({ zh: `${clock} 会填进你的冲煮记录，并标注“应用计时”。`, en: `${clock} will go in your brew log, marked “Timed in app”.` }),
  uncarry: { zh: '不用这个时间', en: 'Don’t use this time' },
  timeline: { zh: '时间表', en: 'Schedule' },
  current: { zh: '当前', en: 'now' },
  note: {
    zh: '这是一份要跟随的时间表，不是测量——以你自己的秤为准。粉量更大时通常会慢一些；同样合理的手法有很多。',
    en: 'A schedule to follow, not a measurement — your own scale is the truth. Bigger doses usually run a little longer, and many valid techniques exist.',
  },
  stagesNote: { zh: '各段注水的时间点是示意划分；配方本身只写了“分几次注水”。', en: 'The stage timings are an illustrative split; the recipe itself only says “pour in stages”.' },
  never: { zh: '时间表不会替你完成步骤——每一步仍由你点“完成”。', en: 'The schedule never completes a step — you still tap Done for each one.' },
  startedSay: (txt: string) => ({ zh: `时间表开始。${txt}`, en: `Schedule started. ${txt}` }),
  stoppedSay: (s: number) => ({ zh: `已停止。总时间 ${s} 秒，应用计时。`, en: `Stopped. Total time ${s} seconds, timed in app.` }),
};

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* optional */
  }
}

export interface PourScheduleProps {
  planId: string;
  spec: PourScheduleSpec;
  speakOn?: boolean;
}

export function PourSchedule({ planId, spec, speakOn }: PourScheduleProps) {
  const { t, locale } = useI18n();
  const hid = useId();
  const template = POUR_TEMPLATES[spec.templateId];
  const [dose, setDoseState] = useState(() => clampDose(template, readPlanNumber(planId, 'schedule-dose') ?? spec.doseG));
  const schedule = useMemo(() => buildPourSchedule(template, dose), [template, dose]);
  const { timer, now, update } = usePersistentTimer(timerKey(planId, 'schedule'), 'stopwatch', 0);
  const [carry, setCarry] = useCarry(planId);
  const ms = elapsedMs(timer, now);
  const status = scheduleAt(schedule, ms / 1000);
  const running = timer.status === 'running';
  const finished = timer.status === 'finished';
  const sec = measuredSeconds(timer, now);
  const clock = formatClock(ms);
  const carried = finished && sec !== null && carry?.slot === 'schedule' && carry.sec === sec;
  const ratio = formatRatio(schedule.ratio);

  const say = (msg: string) => {
    if (!(speakOn && speak(msg, locale))) announce(msg);
  };

  // Cue each phase change while running (not on mount/resume: the ref starts at the current phase).
  const lastIndex = useRef(status.index);
  useEffect(() => {
    if (status.index === lastIndex.current) return;
    lastIndex.current = status.index;
    if (!running) return;
    audio.play(status.phase?.id === 'bloom-pour' ? 'bloom' : 'timer');
    vibrate(status.phase?.kind === 'pour' ? [120, 80, 120] : 120);
    say(status.phase ? t(phaseInstruction(status.phase)) : t(S.over));
  }, [status.index, running]);

  const setDose = (d: number) => {
    const next = clampDose(template, d);
    setDoseState(next);
    writePlanNumber(planId, 'schedule-dose', next);
  };

  const onStart = () => {
    lastIndex.current = 0;
    update((tt, at) => startTimer(resetTimer(tt), at));
    if (carry?.slot === 'schedule') setCarry(null);
    audio.play('bloom');
    vibrate(120);
    const first = schedule.phases[0];
    say(t(S.startedSay(first ? t(phaseInstruction(first)) : '')));
  };
  const onResume = () => update(startTimer);
  const onPause = () => update(pauseTimer);
  const onStop = () => {
    const at = Date.now();
    const s = Math.round(elapsedMs(stopTimer(timer, at), at) / 1000);
    update(stopTimer);
    audio.play('timer');
    say(t(S.stoppedSay(s)));
  };
  const onReset = () => {
    update(resetTimer);
    lastIndex.current = 0;
    if (carry?.slot === 'schedule') setCarry(null);
  };

  const [fa, fb] = schedule.finishWindowSec;
  const phase = status.phase;
  let detail: string;
  if (timer.status === 'idle') detail = t(S.idle);
  else if (!phase) detail = t(S.over);
  else if (phase.kind === 'pour')
    detail = `${t(S.reachBy(phase.targetG, formatClock(phase.endSec * 1000), formatClock(status.phaseLeftSec * 1000, true)))} · ${t(S.pace(Math.round(status.expectedG / 5) * 5))}`;
  else if (phase.kind === 'wait' && status.nextPour) detail = t(S.nextIn(formatClock(status.nextPour.inSec * 1000, true), status.nextPour.phase.targetG));
  else detail = t(S.drawdown(formatClock(fa * 1000), formatClock(fb * 1000)));

  return (
    <section
      className="kp-companion kp-pour"
      aria-labelledby={hid}
      data-testid="pour-schedule"
      data-status={timer.status}
      data-phase={timer.status === 'idle' ? 'idle' : (phase?.id ?? 'over')}
    >
      <div className="kp-companion__head">
        <h2 id={hid} className="kp-companion__title">
          <Icon name="kettle" size={22} /> {t(S.title)}
        </h2>
        <Tag tone="warning" icon="info">
          {t(S.notMeasure)}
        </Tag>
      </div>
      <p className="kp-companion__how">{t(S.how)}</p>

      {timer.status === 'idle' ? (
        <div className="kp-dose">
          <div className="kp-dose__row" role="group" aria-labelledby={`${hid}-dose`}>
            <span id={`${hid}-dose`} className="kp-dose__label">
              {t(S.dose)}
            </span>
            <IconButton icon="minus" size="kitchen" variant="secondary" label={t(S.less)} disabled={dose <= template.doseRangeG[0]} onClick={() => setDose(dose - 1)} data-testid="pour-dose-less" />
            <output className="kp-dose__value cl-num" aria-live="polite" data-testid="pour-dose">
              {dose} g
            </output>
            <IconButton icon="plus" size="kitchen" variant="secondary" label={t(S.more)} disabled={dose >= template.doseRangeG[1]} onClick={() => setDose(dose + 1)} data-testid="pour-dose-more" />
          </div>
          <p className="kp-dose__total cl-num" data-testid="pour-total">
            {t(S.total(schedule.waterG, ratio))}
          </p>
        </div>
      ) : (
        <p className="kp-dose__total cl-num" data-testid="pour-total">
          {t(S.recipeLine(schedule.doseG, schedule.waterG, ratio))} <span className="cl-muted kp-small">· {t(S.doseLocked)}</span>
        </p>
      )}

      <div className="kp-pour__now">
        <time className="kp-companion__clock" data-testid="pour-clock" aria-live="off">
          {clock}
        </time>
        {timer.status !== 'idle' && !finished && (
          <p className="kp-pour__phase" data-testid="pour-phase">
            {timer.status === 'paused' && <Tag tone="neutral" icon="pause">{t(S.paused)}</Tag>} {phase ? t(phaseInstruction(phase)) : t(S.over)}
          </p>
        )}
        {!finished && (
          <p className="kp-pour__detail cl-num" data-testid="pour-detail">
            {detail}
          </p>
        )}
      </div>

      <ScheduleGraph schedule={schedule} tSec={timer.status === 'idle' ? null : ms / 1000} />

      <section aria-labelledby={`${hid}-tl`}>
        <h3 id={`${hid}-tl`} className="cl-eyebrow kp-pour__tl-h">
          {t(S.timeline)}
        </h3>
        <ol className="kp-pour__list" data-testid="pour-timeline">
          {schedule.phases.map((p, i) => {
            const isNow = timer.status !== 'idle' && !finished && i === status.index;
            return (
              <li key={p.id} aria-current={isNow ? 'step' : undefined} data-kind={p.kind}>
                <span className="kp-pour__when cl-num">
                  {formatClock(p.startSec * 1000)}–{formatClock(p.endSec * 1000)}
                </span>
                <span className="kp-pour__name">
                  {t(phaseName(p))}
                  {isNow && <span className="cl-visually-hidden"> ({t(S.current)})</span>}
                </span>
                <span className="kp-pour__g cl-num">{p.kind === 'pour' ? `→ ${p.targetG} g` : `${p.targetG} g`}</span>
              </li>
            );
          })}
        </ol>
      </section>

      {finished && sec !== null && (
        <div className="kp-companion__result" data-testid="pour-result">
          <p className="kp-companion__result-line">
            <strong>
              {t(S.result)}: <span className="cl-num">{clock}</span>
            </strong>{' '}
            <Tag tone="info" icon="clock">
              {t(S.timed)}
            </Tag>
          </p>
          <p className="kp-small cl-muted">{t(S.timedDetail)}</p>
          {carried ? (
            <div className="kp-companion__carried">
              <p data-testid="pour-carried">
                <Icon name="check" size={18} /> {t(S.carried(clock))}
              </p>
              <Button variant="ghost" size="lg" onClick={() => setCarry(null)}>
                {t(S.uncarry)}
              </Button>
            </div>
          ) : (
            <Button size="kitchen" block icon="journal" onClick={() => setCarry({ sec, source: 'schedule', slot: 'schedule' })} data-testid="pour-carry">
              {t(S.carry(clock))}
            </Button>
          )}
        </div>
      )}

      <div className="kp-companion__actions kp-companion__actions--split">
        {timer.status === 'idle' && (
          <Button size="kitchen" block icon="play" onClick={onStart} data-testid="pour-start">
            {t(S.start)}
          </Button>
        )}
        {running && (
          <>
            <Button size="kitchen" variant="secondary" icon="pause" onClick={onPause} data-testid="pour-pause">
              {t(S.pause)}
            </Button>
            <Button size="kitchen" onClick={onStop} data-testid="pour-stop">
              {t(S.drained)}
            </Button>
          </>
        )}
        {timer.status === 'paused' && (
          <>
            <Button size="kitchen" icon="play" onClick={onResume} data-testid="pour-resume">
              {t(S.resume)}
            </Button>
            <Button size="kitchen" variant="secondary" onClick={onStop} data-testid="pour-stop">
              {t(S.drained)}
            </Button>
          </>
        )}
        {(timer.status === 'paused' || finished) && (
          <Button size="kitchen" variant="ghost" icon="repeat" onClick={onReset} data-testid="pour-reset">
            {t(S.reset)}
          </Button>
        )}
      </div>

      <Callout kind="illustrative" locale={locale}>
        {t(S.note)} {schedule.stagesIllustrative && t(S.stagesNote)}
      </Callout>
      <p className="kp-timer__note cl-muted">{t(S.never)}</p>
    </section>
  );
}

/** Target cumulative grams over time (decorative; the timeline list carries the same information). */
function ScheduleGraph({ schedule, tSec }: { schedule: Schedule; tSec: number | null }) {
  const W = 320;
  const H = 72;
  const pad = 4;
  const last = schedule.phases[schedule.phases.length - 1];
  const maxT = Math.max(last?.endSec ?? 1, schedule.finishWindowSec[1]);
  const x = (s: number) => pad + (Math.min(s, maxT) / maxT) * (W - pad * 2);
  const y = (g: number) => H - pad - (g / Math.max(1, schedule.waterG)) * (H - pad * 2);
  const pts = [`${x(0)},${y(0)}`, ...schedule.phases.map((p) => `${x(p.endSec)},${y(p.targetG)}`)].join(' ');
  return (
    <svg className="kp-pour__graph" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect className="kp-pour__graph-window" x={x(schedule.finishWindowSec[0])} y={pad} width={x(schedule.finishWindowSec[1]) - x(schedule.finishWindowSec[0])} height={H - pad * 2} />
      <polyline className="kp-pour__graph-line" points={pts} />
      {tSec !== null && <line className="kp-pour__graph-now" x1={x(tSec)} x2={x(tSec)} y1={pad} y2={H - pad} />}
    </svg>
  );
}

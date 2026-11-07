import { useId, useState } from 'react';
import type { LocalizedText, ParameterLabActivity } from '../../domain/contracts';
import { formatRatio, tryBrewRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { Icon } from '../../ui/icons';
import { Button, IconButton } from '../../ui/primitives/Button';
import { Callout } from '../../ui/primitives/Callout';
import { FeedbackPanel } from '../../ui/primitives/FeedbackPanel';
import { extractionModel } from './logic/extractionModel';
import { guidancePolicy } from './logic/guidance';
import { checkChallenge, clampToRange, suggestedOut, type ChallengeCheck } from './logic/ratioLab';
import { FinishRow, sfx } from './shared';
import { S } from './strings';
import type { ActivityProps } from './types';

interface SliderProps {
  label: LocalizedText;
  value: number;
  range: readonly [number, number];
  step: number;
  unit: string;
  onChange(v: number): void;
  testId: string;
}

/** Range slider + exact number field + large −/+ buttons (touch-friendly; no tiny drag targets). */
function LabSlider({ label, value, range, step, unit, onChange, testId }: SliderProps) {
  const { t } = useI18n();
  const id = useId();
  const text = t(label);
  const [draft, setDraft] = useState<string | null>(null);
  const set = (v: number) => {
    setDraft(null);
    onChange(clampToRange(v, range, step));
  };
  return (
    <div className="act-slider" data-testid={testId}>
      <div className="act-slider__head">
        <label htmlFor={`${id}-range`} className="act-field__label">
          {text}
        </label>
        <span className="act-slider__value">
          <input
            id={`${id}-num`}
            type="number"
            inputMode="decimal"
            className="act-num"
            min={range[0]}
            max={range[1]}
            step={step}
            value={draft ?? String(value)}
            aria-label={`${text} (${unit || '1–10'})`}
            onChange={(e) => {
              // Keep what the learner types; apply it live only once it is a valid in-range number.
              const raw = e.target.value;
              setDraft(raw);
              const v = Number(raw);
              if (raw !== '' && Number.isFinite(v) && v >= range[0] && v <= range[1]) onChange(v);
            }}
            onBlur={() => {
              if (draft !== null) {
                const v = Number(draft);
                if (draft !== '' && Number.isFinite(v)) set(v);
                setDraft(null);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />
          <span aria-hidden="true">{unit}</span>
        </span>
      </div>
      <div className="act-slider__row">
        <IconButton icon="minus" label={t(S.decrease(text))} variant="secondary" onClick={() => set(value - step)} disabled={value <= range[0]} />
        <input
          id={`${id}-range`}
          type="range"
          className="act-range"
          min={range[0]}
          max={range[1]}
          step={step}
          value={value}
          aria-valuetext={`${value} ${unit}`}
          onChange={(e) => set(Number(e.target.value))}
        />
        <IconButton icon="plus" label={t(S.increase(text))} variant="secondary" onClick={() => set(value + step)} disabled={value >= range[1]} />
      </div>
    </div>
  );
}

function Meter({ label, value, low, high, testId, zones }: { label: string; value: number; low: string; high: string; testId: string; zones?: boolean }) {
  const pct = Math.round(value * 100);
  return (
    <div className="act-meter" data-testid={testId}>
      <div className="act-meter__head">
        <span>{label}</span>
      </div>
      <div className="act-meter__track" data-zones={zones || undefined} role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
        {zones && <span className="act-meter__band" aria-hidden="true" />}
        <span className="act-meter__marker" style={{ left: `${pct}%` }} aria-hidden="true" />
      </div>
      <div className="act-meter__scale" aria-hidden="true">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </div>
  );
}

/**
 * Ratio / parameter lab: live, correct ratio maths (src/domain/brew) + small challenges.
 * Guidance: guided/assisted failed checks say which way to move (guided also shows an example),
 * independent only says "not in the target yet".
 * The extraction explorer adds an ILLUSTRATIVE model — always labelled, never a taste prediction.
 */
export function ParameterLabView({ activity, guidance, onComplete }: ActivityProps<ParameterLabActivity>) {
  const { t, locale } = useI18n();
  const policy = guidancePolicy(guidance);
  const d = activity.defaults;
  const [dose, setDose] = useState(d.doseG);
  const [out, setOut] = useState(d.outG);
  const [time, setTime] = useState(d.timeSec ?? 28);
  const [grind, setGrind] = useState(d.grind ?? 5);
  const [index, setIndex] = useState(0);
  const [passed, setPassed] = useState<Set<string>>(new Set());
  const [firstPass, setFirstPass] = useState<Set<string>>(new Set());
  const [checkedOnce, setCheckedOnce] = useState<Set<string>>(new Set());
  const [last, setLast] = useState<ChallengeCheck | null>(null);

  const ratio = tryBrewRatio(dose, out);
  const ratioText = formatRatio(ratio, 2).replace(/0$/, '');
  const isPour = activity.lab === 'pourover-ratio';
  const outLabel = activity.lab === 'espresso-ratio' ? S.outEspresso : isPour ? S.outPourover : S.outGeneric;
  const challenges = activity.challenges;
  const current = challenges[index];
  const finished = index >= challenges.length;
  const allPassed = challenges.every((c) => passed.has(c.id));
  const score = challenges.length ? firstPass.size / challenges.length : 0;
  const model = activity.lab === 'extraction-explorer' ? extractionModel({ doseG: dose, outG: out, timeSec: time, grind }) : null;
  const outStep = isPour ? 5 : 1;

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    if (last && !last.ok) setLast(null);
  };

  const check = () => {
    if (!current) return;
    const r = checkChallenge(current, dose, out);
    setLast(r);
    if (!checkedOnce.has(current.id)) {
      setCheckedOnce((s) => new Set(s).add(current.id));
      if (r.ok) setFirstPass((s) => new Set(s).add(current.id));
    }
    if (r.ok) setPassed((s) => new Set(s).add(current.id));
    sfx(r.ok ? 'correct' : 'incorrect');
  };

  const nextChallenge = () => {
    setLast(null);
    // Skip challenges already passed (e.g. when revisiting skipped ones).
    const found = challenges.findIndex((c, i) => i > index && !passed.has(c.id));
    const next = found === -1 ? challenges.length : found;
    setIndex(next);
    if (next >= challenges.length) sfx('complete');
  };

  const band = current
    ? t(S.targetBand(formatRatio(current.target.ratioMin, 1), formatRatio(current.target.ratioMax, 1)))
    : '';

  return (
    <div className="act act-lab" data-testid="activity-lab" data-lab={activity.lab}>
      <Callout kind="illustrative" locale={locale}>
        {t(activity.illustrativeNote)}
      </Callout>

      <div className="act-lab__grid">
        <div className="act-lab__controls">
          <LabSlider label={S.dose} value={dose} range={activity.ranges.doseG} step={0.5} unit="g" onChange={touch(setDose)} testId="lab-dose" />
          <LabSlider label={outLabel} value={out} range={activity.ranges.outG} step={outStep} unit="g" onChange={touch(setOut)} testId="lab-out" />
          {model && (
            <>
              <LabSlider
                label={S.time}
                value={time}
                range={activity.ranges.timeSec ?? [10, 60]}
                step={1}
                unit="s"
                onChange={setTime}
                testId="lab-time"
              />
              <LabSlider label={S.grind} value={grind} range={activity.ranges.grind ?? [1, 10]} step={1} unit="" onChange={setGrind} testId="lab-grind" />
            </>
          )}
        </div>

        <div className="act-lab__readout">
          <output className="act-ratio" data-testid="lab-ratio" aria-label={t(S.ratio)}>
            <span className="act-ratio__label">{t(S.ratio)}</span>
            <span className="act-ratio__value cl-num">{ratioText}</span>
            <span className="act-ratio__formula cl-num">{t(S.ratioFormula(String(out), String(dose), formatRatio(ratio, 2)))}</span>
          </output>
          <div className="act-ratio-bar" aria-hidden="true">
            <span className="act-ratio-bar__dose" style={{ flexGrow: dose }}>
              {dose} g
            </span>
            <span className="act-ratio-bar__out" style={{ flexGrow: out }}>
              {out} g
            </span>
          </div>
          {model && (
            <section className="act-model" aria-labelledby={`${activity.id}-model`} data-illustrative="true">
              <h3 id={`${activity.id}-model`} className="act-model__title">
                <Icon name="flask" size={18} /> {t(S.modelTitle)}
              </h3>
              <Meter label={t(S.extraction)} value={model.extraction} low={t(S.lower)} high={t(S.higher)} testId="model-extraction" zones />
              <Meter label={t(S.strength)} value={model.strength} low={t(S.weaker)} high={t(S.stronger)} testId="model-strength" />
              <p className="act-model__zone" data-zone={model.zone}>
                {t(S.zone[model.zone])}
              </p>
            </section>
          )}
        </div>
      </div>

      {challenges.length > 0 && (
        <section className="act-challenge" aria-labelledby={`${activity.id}-challenge`}>
          {!finished && current ? (
            <>
              <p className="cl-eyebrow">{t(S.challenge(index + 1, challenges.length))}</p>
              <h3 id={`${activity.id}-challenge`} className="act-subheading">
                <Icon name="target" size={18} /> {t(current.prompt)}
              </h3>
              {last?.ok ? (
                <FeedbackPanel
                  status="correct"
                  locale={locale}
                  actions={
                    <Button iconEnd="next" onClick={nextChallenge} data-testid="lab-next">
                      {index < challenges.length - 1 ? t(S.nextChallenge) : t(S.continue)}
                    </Button>
                  }
                >
                  <p>{t(current.success)}</p>
                </FeedbackPanel>
              ) : (
                <>
                  {last && !last.ok && (
                    <FeedbackPanel status="incorrect" locale={locale}>
                      <p>
                        {t(S.yourRatio(formatRatio(last.ratio, 2)))} {band}
                        {!last.doseOk && current.target.doseG ? ` ${t(S.doseBand(current.target.doseG[0], current.target.doseG[1]))}` : ''}
                      </p>
                      {policy.directionalHints && last.direction ? <p>{t(S.dir[last.direction])}</p> : <p>{t(S.notInBand)}</p>}
                      {guidance === 'guided' && last.doseOk && (
                        <p className="cl-muted">{t(S.forExample(String(dose), suggestedOut(current, dose)))}</p>
                      )}
                    </FeedbackPanel>
                  )}
                  <div className="act-actions">
                    <Button icon="check" onClick={check} data-testid="lab-check">
                      {t(S.checkNumbers)}
                    </Button>
                    <Button variant="ghost" onClick={nextChallenge}>
                      {t(S.skipChallenge)}
                    </Button>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h3 id={`${activity.id}-challenge`} className="act-subheading">
                {t(S.challengesDone)}
              </h3>
              <FeedbackPanel status={allPassed ? 'correct' : 'partly'} locale={locale}>
                <p>{t(S.firstTry(firstPass.size, challenges.length))}</p>
                <p className="cl-muted">{t(S.freePlay)}</p>
              </FeedbackPanel>
              <FinishRow
                done={allPassed}
                onContinue={() => onComplete({ outcome: allPassed ? 'completed' : 'retry', score })}
                onRetry={
                  allPassed
                    ? undefined
                    : () => {
                        setIndex(challenges.findIndex((c) => !passed.has(c.id)));
                        setLast(null);
                      }
                }
              />
            </>
          )}
        </section>
      )}
      {challenges.length === 0 && <FinishRow done onContinue={() => onComplete({ outcome: 'completed' })} />}
    </div>
  );
}

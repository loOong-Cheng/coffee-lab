/**
 * The brew log form (after kitchen mode, "log a cup", "log another attempt", and editing).
 * Every field is optional; nothing is pre-filled with values the learner didn't provide or ask for.
 */
import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { BrewLogEntry } from '../../domain/contracts';
import { formatBrewRatio, tryBrewRatio } from '../../domain/brew';
import { useI18n } from '../../i18n';
import { Button, Chip, SegmentedControl } from '../../ui';
import type { BrewKind, LogField } from '../practice/plan';
import { formatClock } from '../practice/timer';
import { formatDurationInput, parseDuration, parseGrams } from './model';
import { TASTE_TAGS, type TasteTag } from './taste';
import './journal.css';

export interface BrewValues {
  doseG?: number;
  outG?: number;
  timeSec?: number;
  grind?: string;
  tasteTags?: string[];
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  nextChange?: string;
}

const S = {
  dose: { zh: '咖啡粉（粉量）', en: 'Coffee in (dose)' },
  doseHint: { zh: '放进粉碗或滤杯的咖啡粉重量。', en: 'Weight of ground coffee you used.' },
  outEspresso: { zh: '浓缩液重量（出液量）', en: 'Espresso out (yield)' },
  outEspressoHint: { zh: '杯里液体的重量（秤上读数）。', en: 'Weight of liquid in the cup, as the scale showed.' },
  outBrew: { zh: '用水量', en: 'Water used' },
  outBrewHint: { zh: '一共倒入的水的重量。', en: 'Total water you poured, as the scale showed.' },
  outOther: { zh: '出液 / 用水量', en: 'Output / water' },
  time: { zh: '时间', en: 'Brew time' },
  timeHint: { zh: '秒数（如 28）或 分:秒（如 3:30）。', en: 'Seconds (28) or minutes:seconds (3:30).' },
  useStopwatch: { zh: '使用应用秒表的读数', en: 'Use the in-app stopwatch' },
  stopwatchNote: { zh: '来自你在本应用里运行的秒表。', en: 'From the stopwatch you ran in this app.' },
  grind: { zh: '研磨设置', en: 'Grinder setting' },
  grindHint: { zh: '按你的磨豆机的刻度写，例如“8”或“比上次细 2 格”。', en: 'As your grinder labels it, e.g. “8” or “2 clicks finer”.' },
  taste: { zh: '味道如何？（可多选，也可不选）', en: 'How did it taste? (pick any, or none)' },
  tasteBalance: { zh: '平衡', en: 'Balance' },
  tasteBody: { zh: '口感', en: 'Body' },
  tasteFlavor: { zh: '风味', en: 'Flavour' },
  rating: { zh: '你有多喜欢？（自己的感受，1–5）', en: 'How much did you enjoy it? (your own 1–5)' },
  clearRating: { zh: '不打分', en: 'No rating' },
  notes: { zh: '笔记', en: 'Notes' },
  notesHint: { zh: '任何你想记住的：豆子、香气、哪里不顺……', en: 'Anything worth remembering: beans, aroma, what felt awkward…' },
  nextChange: { zh: '下次我只改变一件事：', en: 'Next time I’ll change one thing:' },
  ratio: { zh: '比例', en: 'Ratio' },
  ratioEspresso: { zh: '出液 ÷ 粉量（只是算术，不代表好坏）', en: 'yield ÷ dose — just arithmetic, not a grade' },
  ratioBrew: { zh: '水 ÷ 咖啡粉（只是算术，不代表好坏）', en: 'water ÷ coffee — just arithmetic, not a grade' },
  optional: { zh: '全部选填——不确定就留空。', en: 'Everything is optional — leave unknowns blank.' },
  copyPrev: { zh: '沿用上一杯的粉量、出液/水量和研磨', en: 'Copy dose, output and grind from the previous attempt' },
  prevWas: { zh: '上一杯', en: 'Previous' },
  errNan: { zh: '请输入数字，例如 18 或 18.5。', en: 'Enter a number, like 18 or 18.5.' },
  errRange: { zh: '这个数值超出了合理范围，请检查。', en: 'That value looks out of range — please check it.' },
  errTime: { zh: '请输入秒数（28）或 分:秒（3:30）。', en: 'Enter seconds (28) or minutes:seconds (3:30).' },
  errSummary: { zh: '有字段需要检查。', en: 'Some fields need a look.' },
  unitG: { zh: '克', en: 'g' },
};

type NumKey = 'doseG' | 'outG' | 'timeSec';

export interface BrewLogFormProps {
  fields: readonly LogField[];
  brewKind: BrewKind;
  initial?: BrewValues;
  /** Previous attempt: shown as placeholders + an explicit copy button (inputs only, never results). */
  reference?: BrewLogEntry;
  /** Seconds measured by the in-app stopwatch, offered (not auto-filled) for the time field. */
  stopwatchSec?: number | null;
  showNextChange?: boolean;
  submitLabel: string;
  onSubmit(values: BrewValues): void;
  secondary?: ReactNode;
}

export function BrewLogForm({
  fields,
  brewKind,
  initial,
  reference,
  stopwatchSec,
  showNextChange,
  submitLabel,
  onSubmit,
  secondary,
}: BrewLogFormProps) {
  const { t } = useI18n();
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;
  const has = (f: LogField) => fields.includes(f);

  const [dose, setDose] = useState(initial?.doseG != null ? String(initial.doseG) : '');
  const [out, setOut] = useState(initial?.outG != null ? String(initial.outG) : '');
  const [time, setTime] = useState(formatDurationInput(initial?.timeSec));
  const [grind, setGrind] = useState(initial?.grind ?? '');
  const [tags, setTags] = useState<string[]>(initial?.tasteTags ?? []);
  const [rating, setRating] = useState<BrewValues['rating']>(initial?.rating);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [nextChange, setNextChange] = useState(initial?.nextChange ?? '');
  const [errors, setErrors] = useState<Partial<Record<NumKey, string>>>({});
  const [usedStopwatch, setUsedStopwatch] = useState(false);
  const refs = { doseG: useRef<HTMLInputElement>(null), outG: useRef<HTMLInputElement>(null), timeSec: useRef<HTMLInputElement>(null) };

  const outLabel = brewKind === 'espresso' ? S.outEspresso : brewKind === 'brew' ? S.outBrew : S.outOther;
  const outHint = brewKind === 'espresso' ? S.outEspressoHint : S.outBrewHint;
  const dParsed = parseGrams(dose, 'doseG');
  const oParsed = parseGrams(out, 'outG');
  const liveRatio = dParsed.ok && oParsed.ok ? tryBrewRatio(dParsed.value, oParsed.value) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<NumKey, string>> = {};
    const v: BrewValues = {};
    if (has('doseG')) {
      const r = parseGrams(dose, 'doseG');
      if (!r.ok) errs.doseG = t(r.error === 'nan' ? S.errNan : S.errRange);
      else if (r.value !== undefined) v.doseG = r.value;
    }
    if (has('outG')) {
      const r = parseGrams(out, 'outG');
      if (!r.ok) errs.outG = t(r.error === 'nan' ? S.errNan : S.errRange);
      else if (r.value !== undefined) v.outG = r.value;
    }
    if (has('timeSec')) {
      const r = parseDuration(time);
      if (!r.ok) errs.timeSec = t(r.error === 'nan' ? S.errTime : S.errRange);
      else if (r.value !== undefined) v.timeSec = r.value;
    }
    setErrors(errs);
    const firstBad = (['doseG', 'outG', 'timeSec'] as const).find((k) => errs[k]);
    if (firstBad) {
      refs[firstBad].current?.focus();
      return;
    }
    if (has('grind') && grind.trim()) v.grind = grind.trim();
    if (has('taste') && tags.length) v.tasteTags = [...tags];
    if (has('rating') && rating) v.rating = rating;
    if (has('notes') && notes.trim()) v.notes = notes.trim();
    if (showNextChange && nextChange.trim()) v.nextChange = nextChange.trim();
    onSubmit(v);
  };

  const numField = (key: NumKey, label: string, hint: string, value: string, set: (s: string) => void, unit?: string, placeholder?: string) => (
    <div className="jr-field">
      <label htmlFor={id(key)} className="jr-field__label">
        {label}
        {unit && <span className="jr-field__unit"> ({unit})</span>}
      </label>
      <div className="jr-field__input-wrap">
        <input
          ref={refs[key]}
          id={id(key)}
          name={key}
          type="text"
          inputMode={key === 'timeSec' ? 'text' : 'decimal'}
          autoComplete="off"
          className="jr-input jr-input--num"
          value={value}
          placeholder={placeholder}
          onChange={(e) => set(e.target.value)}
          aria-invalid={errors[key] ? true : undefined}
          aria-describedby={`${id(key)}-hint${errors[key] ? ` ${id(key)}-err` : ''}`}
          data-testid={`log-${key}`}
        />
        {unit && (
          <span className="jr-field__suffix" aria-hidden="true">
            {unit}
          </span>
        )}
      </div>
      <p id={`${id(key)}-hint`} className="jr-field__hint">
        {hint}
      </p>
      {errors[key] && (
        <p id={`${id(key)}-err`} className="jr-field__error" role="alert">
          {errors[key]}
        </p>
      )}
    </div>
  );

  const groups: Array<{ key: TasteTag['group']; label: string }> = [
    { key: 'balance', label: t(S.tasteBalance) },
    { key: 'body', label: t(S.tasteBody) },
    { key: 'flavor', label: t(S.tasteFlavor) },
  ];
  const unknownTags = tags.filter((x) => !TASTE_TAGS.some((tt) => tt.id === x));
  const g = t(S.unitG);

  return (
    <form className="jr-form" onSubmit={submit} noValidate aria-describedby={id('opt')}>
      <p id={id('opt')} className="cl-muted jr-form__optional">
        {t(S.optional)}
      </p>

      {reference && (has('doseG') || has('outG') || has('grind')) && (
        <div className="jr-form__ref">
          <Button
            variant="secondary"
            size="sm"
            icon="repeat"
            onClick={() => {
              if (reference.doseG != null) setDose(String(reference.doseG));
              if (reference.outG != null) setOut(String(reference.outG));
              if (reference.grind) setGrind(reference.grind);
            }}
          >
            {t(S.copyPrev)}
          </Button>
        </div>
      )}

      {(has('doseG') || has('outG')) && (
        <div className="jr-form__row">
          {has('doseG') &&
            numField('doseG', t(S.dose), t(S.doseHint), dose, setDose, g, reference?.doseG != null ? `${t(S.prevWas)}: ${reference.doseG}` : undefined)}
          {has('outG') &&
            numField('outG', t(outLabel), t(outHint), out, setOut, g, reference?.outG != null ? `${t(S.prevWas)}: ${reference.outG}` : undefined)}
        </div>
      )}

      {has('doseG') && has('outG') && (
        <p className="jr-ratio-live" aria-live="polite">
          <span className="jr-ratio-live__label">{t(S.ratio)}</span>{' '}
          <output className="jr-ratio-live__value" data-testid="log-ratio">
            {liveRatio !== null ? formatBrewRatio(dParsed.ok ? dParsed.value : null, oParsed.ok ? oParsed.value : null) : '—'}
          </output>{' '}
          <span className="cl-muted">· {t(brewKind === 'espresso' ? S.ratioEspresso : S.ratioBrew)}</span>
        </p>
      )}

      {has('timeSec') && (
        <div className="jr-form__row">
          {numField(
            'timeSec',
            t(S.time),
            t(S.timeHint),
            time,
            (s) => {
              setTime(s);
              setUsedStopwatch(false);
            },
            undefined,
            reference?.timeSec != null ? `${t(S.prevWas)}: ${formatDurationInput(reference.timeSec)}` : undefined,
          )}
          {stopwatchSec ? (
            <div className="jr-field jr-field--action">
              <Button
                variant="secondary"
                size="md"
                icon="clock"
                onClick={() => {
                  setTime(formatDurationInput(stopwatchSec));
                  setUsedStopwatch(true);
                }}
              >
                {t(S.useStopwatch)} ({formatClock(stopwatchSec * 1000)})
              </Button>
              {usedStopwatch && <p className="jr-field__hint">{t(S.stopwatchNote)}</p>}
            </div>
          ) : null}
        </div>
      )}

      {has('grind') && (
        <div className="jr-field">
          <label htmlFor={id('grind')} className="jr-field__label">
            {t(S.grind)}
          </label>
          <input
            id={id('grind')}
            type="text"
            className="jr-input"
            value={grind}
            maxLength={60}
            placeholder={reference?.grind ? `${t(S.prevWas)}: ${reference.grind}` : undefined}
            onChange={(e) => setGrind(e.target.value)}
            aria-describedby={`${id('grind')}-hint`}
          />
          <p id={`${id('grind')}-hint`} className="jr-field__hint">
            {t(S.grindHint)}
          </p>
        </div>
      )}

      {has('taste') && (
        <fieldset className="jr-fieldset">
          <legend className="jr-field__label">{t(S.taste)}</legend>
          {groups.map((grp) => (
            <div key={grp.key} className="jr-taste-group">
              <span className="cl-eyebrow">{grp.label}</span>
              <div className="jr-chips">
                {TASTE_TAGS.filter((tt) => tt.group === grp.key).map((tt) => {
                  const on = tags.includes(tt.id);
                  return (
                    <Chip
                      key={tt.id}
                      selected={on}
                      title={t(tt.hint)}
                      data-testid={`taste-${tt.id}`}
                      onChange={(sel) => setTags((cur) => (sel ? [...cur, tt.id] : cur.filter((x) => x !== tt.id)))}
                    >
                      {t(tt.label)}
                    </Chip>
                  );
                })}
              </div>
            </div>
          ))}
          {unknownTags.length > 0 && (
            <div className="jr-chips">
              {unknownTags.map((x) => (
                <Chip key={x} selected onChange={() => setTags((cur) => cur.filter((y) => y !== x))}>
                  {x}
                </Chip>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {has('rating') && (
        <fieldset className="jr-fieldset">
          <legend className="jr-field__label" id={id('rating-l')}>
            {t(S.rating)}
          </legend>
          <div className="cl-row">
            <SegmentedControl<string>
              labelledBy={id('rating-l')}
              value={rating ? String(rating) : null}
              onChange={(v) => setRating(Number(v) as BrewValues['rating'])}
              options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
              size="lg"
              id={id('rating')}
            />
            {rating && (
              <Button variant="ghost" size="sm" onClick={() => setRating(undefined)}>
                {t(S.clearRating)}
              </Button>
            )}
          </div>
        </fieldset>
      )}

      {has('notes') && (
        <div className="jr-field">
          <label htmlFor={id('notes')} className="jr-field__label">
            {t(S.notes)}
          </label>
          <textarea
            id={id('notes')}
            className="jr-input jr-textarea"
            rows={3}
            maxLength={2000}
            value={notes}
            placeholder={t(S.notesHint)}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {showNextChange && (
        <div className="jr-field">
          <label htmlFor={id('next')} className="jr-field__label">
            {t(S.nextChange)}
          </label>
          <input id={id('next')} type="text" className="jr-input" maxLength={200} value={nextChange} onChange={(e) => setNextChange(e.target.value)} />
        </div>
      )}

      {Object.keys(errors).length > 0 && (
        <p className="jr-field__error" role="status">
          {t(S.errSummary)}
        </p>
      )}

      <div className="jr-form__actions">
        <Button type="submit" size="lg" icon="check" data-testid="log-save">
          {submitLabel}
        </Button>
        {secondary}
      </div>
    </form>
  );
}

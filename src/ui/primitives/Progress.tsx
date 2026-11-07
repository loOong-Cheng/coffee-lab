import { useId } from 'react';
import type { ReactNode } from 'react';
import type { Locale } from '../../domain/contracts';
import { Icon } from '../icons';
import { cx } from './util';
import './primitives.css';

const clamp01 = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  /** Accessible + visible label, e.g. "Espresso path". */
  label: string;
  /** Hide the visible label (still announced). */
  hideLabel?: boolean;
  /** Human text for value, e.g. "3 of 6 lessons". Defaults to a percentage. */
  valueText?: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  tone?: 'accent' | 'success';
  className?: string;
}

export function ProgressBar({
  value,
  label,
  hideLabel,
  valueText,
  showValue = true,
  size = 'md',
  tone = 'accent',
  className,
}: ProgressBarProps) {
  const id = useId();
  const v = clamp01(value);
  const pct = Math.round(v * 100);
  const text = valueText ?? `${pct}%`;
  return (
    <div className={cx('cl-progress', size === 'sm' && 'cl-progress--sm', tone === 'success' && 'cl-progress--success', className)}>
      {(!hideLabel || showValue) && (
        <div className="cl-progress__meta">
          <span id={id} className={cx('cl-progress__label', hideLabel && 'cl-visually-hidden')}>
            {label}
          </span>
          {showValue && <span aria-hidden="true">{text}</span>}
        </div>
      )}
      <div
        className="cl-progress__track"
        role="progressbar"
        aria-labelledby={id}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={text}
      >
        <div className="cl-progress__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export interface ProgressRingProps {
  /** 0..1 */
  value: number;
  /** Accessible label, e.g. "Lesson mastery". */
  label: string;
  valueText?: string;
  /** px (default 56). */
  size?: number;
  thickness?: number;
  /** Center content; defaults to percentage, or a check when complete. */
  children?: ReactNode;
  className?: string;
}

export function ProgressRing({ value, label, valueText, size = 56, thickness, children, className }: ProgressRingProps) {
  const v = clamp01(value);
  const pct = Math.round(v * 100);
  const stroke = thickness ?? Math.max(4, Math.round(size / 9));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const complete = v >= 1;
  return (
    <div
      className={cx('cl-ring', complete && 'cl-ring--complete', className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={valueText ?? `${pct}%`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="cl-ring__track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} />
        <circle
          className="cl-ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
        />
      </svg>
      <span className="cl-ring__center" aria-hidden="true">
        {children ?? (complete ? <Icon name="check" size={Math.round(size / 2.4)} strokeWidth={2.5} /> : `${pct}%`)}
      </span>
    </div>
  );
}

export type StepState = 'done' | 'skipped' | 'current' | 'todo';

export interface StepProgressProps {
  /** 0-based current index. */
  current: number;
  total: number;
  locale?: Locale;
  /** Optional per-step states (length = total); defaults to done/current/todo by index. */
  states?: StepState[];
  className?: string;
}

/** "Step 3 of 8" + compact dots. Text carries the meaning; dots are decorative. */
export function StepProgress({ current, total, locale = 'en', states, className }: StepProgressProps) {
  const n = Math.max(0, total);
  const idx = Math.min(Math.max(0, current), Math.max(0, n - 1));
  const text = locale === 'zh' ? `第 ${idx + 1} 步，共 ${n} 步` : `Step ${idx + 1} of ${n}`;
  return (
    <div className={cx('cl-steps', className)}>
      <span className="cl-steps__text">{text}</span>
      <span className="cl-steps__dots" aria-hidden="true">
        {Array.from({ length: n }, (_, i) => (
          <span
            key={i}
            className="cl-steps__dot"
            data-state={states?.[i] ?? (i < idx ? 'done' : i === idx ? 'current' : 'todo')}
          />
        ))}
      </span>
    </div>
  );
}

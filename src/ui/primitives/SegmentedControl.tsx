import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cx } from './util';
import './primitives.css';

export interface SegmentedOption<V extends string = string> {
  value: V;
  label: ReactNode;
  /** Decorative leading visual (icon / pips). */
  icon?: ReactNode;
  /** Shown in the `stacked` layout; also exposed via aria-describedby. */
  description?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<V extends string = string> {
  options: ReadonlyArray<SegmentedOption<V>>;
  value: V | null;
  onChange(value: V): void;
  /** Accessible group name (use this or `labelledBy`). */
  label?: string;
  labelledBy?: string;
  /** inline = pill segments; stacked = selectable cards with descriptions. */
  layout?: 'inline' | 'stacked';
  size?: 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  /** Stable id prefix (for tests / aria wiring). */
  id?: string;
}

/**
 * Single choice with radio-group semantics: one tab stop, arrow keys move AND select
 * (WAI-ARIA radio pattern), Home/End jump, disabled options are skipped.
 */
export function SegmentedControl<V extends string = string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  layout = 'inline',
  size = 'md',
  fullWidth,
  className,
  id,
}: SegmentedControlProps<V>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop = selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : (enabled[0] ?? -1);
  const autoId = useId();
  const base = id ?? autoId;

  const move = (from: number, dir: 1 | -1 | 'first' | 'last') => {
    if (enabled.length === 0) return;
    let target: number;
    if (dir === 'first') target = enabled[0]!;
    else if (dir === 'last') target = enabled[enabled.length - 1]!;
    else {
      const pos = enabled.indexOf(from);
      const nextPos = pos < 0 ? 0 : (pos + dir + enabled.length) % enabled.length;
      target = enabled[nextPos]!;
    }
    refs.current[target]?.focus();
    const opt = options[target];
    if (opt && opt.value !== value) onChange(opt.value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        move(i, 1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        move(i, -1);
        break;
      case 'Home':
        e.preventDefault();
        move(i, 'first');
        break;
      case 'End':
        e.preventDefault();
        move(i, 'last');
        break;
      default:
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className={cx(
        'cl-seg',
        layout === 'stacked' && 'cl-seg--stacked',
        size === 'lg' && 'cl-seg--lg',
        fullWidth && 'cl-seg--full',
        className,
      )}
    >
      {options.map((o, i) => {
        const checked = o.value === value;
        const descId = o.description ? `${base}-${o.value}-desc` : undefined;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-describedby={layout === 'stacked' ? descId : undefined}
            tabIndex={i === tabStop ? 0 : -1}
            disabled={o.disabled}
            className="cl-seg__opt"
            data-value={o.value}
            onClick={() => {
              if (!checked) onChange(o.value);
            }}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {layout === 'stacked' ? (
              <>
                <span className="cl-seg__radio" aria-hidden="true" />
                <span className="cl-seg__title">
                  {o.icon}
                  {o.label}
                </span>
                {o.description && (
                  <span id={descId} className="cl-seg__desc">
                    {o.description}
                  </span>
                )}
              </>
            ) : (
              <>
                {o.icon}
                <span>{o.label}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

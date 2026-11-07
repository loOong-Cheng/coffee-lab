import { useId } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons';
import { cx } from './util';
import './primitives.css';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'children'> {
  checked: boolean;
  onChange(checked: boolean): void;
  /** Visible label (the whole row is the hit target). */
  label: ReactNode;
  description?: ReactNode;
}

/** On/off setting (role="switch"). Thumb shows a check when on — state is not colour-only. */
export function Switch({ checked, onChange, label, description, className, disabled, ...rest }: SwitchProps) {
  const labelId = useId();
  const descId = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelId}
      aria-describedby={description ? descId : undefined}
      disabled={disabled}
      className={cx('cl-switch', className)}
      onClick={() => onChange(!checked)}
      {...rest}
    >
      <span className="cl-switch__text">
        <span id={labelId} className="cl-switch__label">
          {label}
        </span>
        {description && (
          <span id={descId} className="cl-switch__desc">
            {description}
          </span>
        )}
      </span>
      <span className="cl-switch__track" aria-hidden="true">
        <span className="cl-switch__thumb">{checked ? <Icon name="check" size={14} strokeWidth={3} /> : null}</span>
      </span>
    </button>
  );
}

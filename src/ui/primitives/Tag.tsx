import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { cx } from './util';
import './primitives.css';

export type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'culture';

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  size?: 'sm' | 'md';
  /** Decorative icon; the text must carry the meaning. */
  icon?: IconName;
  children: ReactNode;
}

/** Static label (status, category, "you own this"). Not interactive. */
export function Tag({ tone = 'neutral', size = 'sm', icon, className, children, ...rest }: TagProps) {
  return (
    <span className={cx('cl-tag', tone !== 'neutral' && `cl-tag--${tone}`, size === 'md' && 'cl-tag--md', className)} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  selected: boolean;
  onChange?(selected: boolean): void;
  icon?: IconName;
  children: ReactNode;
}

/** Toggleable filter/selection chip (aria-pressed). Selected state adds a check mark — never colour alone. */
export function Chip({ selected, onChange, icon, className, children, onClick, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx('cl-chip', className)}
      onClick={(e) => {
        onClick?.(e);
        if (!e.defaultPrevented) onChange?.(!selected);
      }}
      {...rest}
    >
      {selected ? <Icon name="check" size={16} className="cl-chip__check" /> : icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

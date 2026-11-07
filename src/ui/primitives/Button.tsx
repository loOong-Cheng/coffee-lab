import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { cx } from './util';
import './primitives.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
/** sm 36px (44px on touch) · md 44px · lg 52px · kitchen ≥64px for hands-busy mode */
export type ButtonSize = 'sm' | 'md' | 'lg' | 'kitchen';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon before the label (decorative). */
  icon?: IconName;
  /** Icon after the label (decorative), e.g. 'next'. */
  iconEnd?: IconName;
  /** Full-width. */
  block?: boolean;
  /** Shows a busy state and blocks clicks while keeping focus. */
  busy?: boolean;
  children?: ReactNode;
}

const ICON_SIZE: Record<ButtonSize, number> = { sm: 16, md: 20, lg: 22, kitchen: 28 };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon, iconEnd, block, busy, className, children, type = 'button', onClick, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx('cl-btn', `cl-btn--${variant}`, `cl-btn--${size}`, block && 'cl-btn--block', className)}
      aria-busy={busy || undefined}
      onClick={busy ? (e) => e.preventDefault() : onClick}
      {...rest}
    >
      {busy ? (
        <span className="cl-spinner__ring" aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={ICON_SIZE[size]} />
      )}
      {children != null && <span className="cl-btn__label">{children}</span>}
      {iconEnd && <Icon name={iconEnd} size={ICON_SIZE[size]} />}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'aria-label'> {
  icon: IconName;
  /** REQUIRED accessible name (also shown as tooltip). */
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** For toggle buttons (e.g. mute): exposes aria-pressed. */
  pressed?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', size = 'md', pressed, className, type = 'button', title, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={title ?? label}
      aria-pressed={pressed}
      className={cx('cl-btn', 'cl-icon-btn', `cl-btn--${variant}`, `cl-btn--${size}`, className)}
      {...rest}
    >
      <Icon name={icon} size={ICON_SIZE[size] + (size === 'kitchen' ? 4 : 2)} />
    </button>
  );
});

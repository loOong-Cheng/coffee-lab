import type { HTMLAttributes, ReactNode } from 'react';
import type { Locale } from '../../domain/contracts';
import { cx } from './util';
import './primitives.css';

/** Keyboard shortcut hint, e.g. <Kbd>→</Kbd>. */
export function Kbd({ children, className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd className={cx('cl-kbd', className)} {...rest}>
      {children}
    </kbd>
  );
}

/** Loading indicator with a visible text label (meaning survives reduced motion). */
export function Spinner({ label, locale = 'en', className }: { label?: string; locale?: Locale; className?: string }) {
  const text = label ?? (locale === 'zh' ? '加载中…' : 'Loading…');
  return (
    <span className={cx('cl-spinner', className)} role="status">
      <span className="cl-spinner__ring" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}

export interface EmptyStateProps {
  /** e.g. <Illustration name="cup" /> */
  art?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Friendly empty/error state: always explains why it is empty and offers a next step. */
export function EmptyState({ art, title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cx('cl-empty', className)}>
      {art && <div className="cl-empty__art">{art}</div>}
      <h3 className="cl-empty__title">{title}</h3>
      {children && <div className="cl-empty__body">{children}</div>}
      {action}
    </div>
  );
}

import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cx } from './util';
import './primitives.css';

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  as?: ElementType;
  tone?: 'default' | 'muted' | 'accent' | 'outline';
  padding?: 'none' | 'sm' | 'md';
  /** Hover lift. Put a `.cl-card__link` (or use CardLink-style anchor) inside for a whole-card click target. */
  interactive?: boolean;
  /** Small label above the title (e.g. track name, "Lesson 2"). */
  eyebrow?: ReactNode;
  title?: ReactNode;
  /** Heading level for `title` (default 3). */
  titleLevel?: 2 | 3 | 4;
  /** Full-bleed media (illustration) at the top. */
  media?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function Card({
  as: As = 'div',
  tone = 'default',
  padding = 'md',
  interactive,
  eyebrow,
  title,
  titleLevel = 3,
  media,
  footer,
  className,
  children,
  ...rest
}: CardProps) {
  const H = `h${titleLevel}` as ElementType;
  return (
    <As
      className={cx(
        'cl-card',
        tone !== 'default' && `cl-card--${tone}`,
        padding !== 'md' && `cl-card--pad-${padding}`,
        interactive && 'cl-card--interactive',
        className,
      )}
      {...rest}
    >
      {media && <div className="cl-card__media">{media}</div>}
      {eyebrow && <div className="cl-card__eyebrow cl-eyebrow">{eyebrow}</div>}
      {title && <H className="cl-card__title">{title}</H>}
      {children}
      {footer && <div className="cl-card__footer">{footer}</div>}
    </As>
  );
}

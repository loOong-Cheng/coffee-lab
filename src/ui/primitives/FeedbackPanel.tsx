import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Locale, LocalizedText } from '../../domain/contracts';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { announce } from './announcer';
import { cx, pick } from './util';
import './primitives.css';

export type FeedbackStatus = 'correct' | 'partly' | 'incorrect' | 'hint' | 'info';

const META: Record<FeedbackStatus, { icon: IconName; title: LocalizedText }> = {
  correct: { icon: 'check', title: { zh: '没错！', en: 'Spot on.' } },
  partly: { icon: 'target', title: { zh: '很接近了', en: 'Close — one more look' } },
  incorrect: { icon: 'x', title: { zh: '还不对——看看为什么', en: "Not quite — here's why" } },
  hint: { icon: 'lightbulb', title: { zh: '提示', en: 'Hint' } },
  info: { icon: 'info', title: { zh: '小知识', en: 'Good to know' } },
};

export interface FeedbackPanelProps {
  status: FeedbackStatus;
  locale: Locale;
  /** Override the default heading. */
  title?: ReactNode;
  /** The explanation — tie it to the misconception, not just right/wrong. */
  children?: ReactNode;
  /** Optional small label above the explanation, e.g. "Why" / "为什么". Pass true for the default. */
  why?: boolean | ReactNode;
  /** Retry / Next / Show answer buttons. */
  actions?: ReactNode;
  /** Announce text to screen readers when shown/changed (default true). */
  announceOnShow?: boolean;
  /** Move focus to the panel when it appears (good after submitting an answer). */
  focusOnShow?: boolean;
  className?: string;
}

/**
 * The single feedback pattern for every activity: status icon + status WORDS + why + next action.
 * Colour is a secondary cue only. Incorrect is framed as a learning moment, never a penalty.
 */
export function FeedbackPanel({
  status,
  locale,
  title,
  children,
  why,
  actions,
  announceOnShow = true,
  focusOnShow,
  className,
}: FeedbackPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const meta = META[status];
  const heading = title ?? pick(meta.title, locale);
  const whyLabel = why === true ? (locale === 'zh' ? '为什么' : 'Why') : why;

  const lastAnnounced = useRef('');

  // Announce only when the visible text actually changes (parents re-render often).
  useEffect(() => {
    const el = ref.current;
    if (!el || !announceOnShow) return;
    const head = el.querySelector('.cl-feedback__title')?.textContent ?? '';
    const body = el.querySelector('.cl-feedback__body')?.textContent ?? '';
    const text = `${head} ${body}`.trim();
    if (text && text !== lastAnnounced.current) {
      lastAnnounced.current = text;
      announce(text);
    }
  });

  useEffect(() => {
    if (focusOnShow) ref.current?.focus();
  }, [focusOnShow, status]);

  return (
    <div
      ref={ref}
      className={cx('cl-feedback', `cl-feedback--${status}`, className)}
      data-status={status}
      tabIndex={focusOnShow ? -1 : undefined}
    >
      <span className="cl-feedback__badge" aria-hidden="true">
        <Icon name={meta.icon} size={18} strokeWidth={2.5} />
      </span>
      <p className="cl-feedback__title">{heading}</p>
      {(children || whyLabel) && (
        <div className="cl-feedback__body">
          {whyLabel && <div className="cl-feedback__why">{whyLabel}</div>}
          {typeof children === 'string' ? <p>{children}</p> : children}
        </div>
      )}
      {actions && <div className="cl-feedback__actions">{actions}</div>}
    </div>
  );
}

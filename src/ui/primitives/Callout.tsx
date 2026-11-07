import type { ReactNode } from 'react';
import type { Locale, LocalizedText } from '../../domain/contracts';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { cx, pick } from './util';
import './primitives.css';

/** Matches ExplainActivity callout kinds, plus a neutral `info`. */
export type CalloutKind = 'tip' | 'safety' | 'myth' | 'culture' | 'illustrative' | 'info';

export const CALLOUT_META: Record<CalloutKind, { icon: IconName; label: LocalizedText }> = {
  tip: { icon: 'lightbulb', label: { zh: '小贴士', en: 'Tip' } },
  safety: { icon: 'shield', label: { zh: '安全提示', en: 'Safety' } },
  myth: { icon: 'myth', label: { zh: '常见误区', en: 'Myth check' } },
  culture: { icon: 'globe', label: { zh: '咖啡文化', en: 'Coffee culture' } },
  illustrative: { icon: 'flask', label: { zh: '示意模型', en: 'Illustrative model' } },
  info: { icon: 'info', label: { zh: '说明', en: 'Note' } },
};

export interface CalloutProps {
  kind: CalloutKind;
  locale?: Locale;
  /** Overrides the default kind label (keep it short). */
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Inline note with icon + visible kind label + coloured edge: meaning never relies on colour.
 * Safety callouts get a thicker edge and the shield icon; they are static notes, not alerts.
 */
export function Callout({ kind, locale = 'en', title, children, className }: CalloutProps) {
  const meta = CALLOUT_META[kind] ?? CALLOUT_META.info;
  return (
    <div role="note" className={cx('cl-callout', `cl-callout--${kind}`, className)} data-kind={kind}>
      <Icon name={meta.icon} size={20} className="cl-callout__icon" />
      <span className="cl-callout__label">{title ?? pick(meta.label, locale)}</span>
      <div className="cl-callout__body">{children}</div>
    </div>
  );
}

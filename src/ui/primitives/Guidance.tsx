import type { Guidance, Locale, LocalizedText } from '../../domain/contracts';
import { SegmentedControl } from './SegmentedControl';
import { cx, pick } from './util';
import './primitives.css';

export const GUIDANCE_ORDER: readonly Guidance[] = ['guided', 'assisted', 'independent'];

/** Support level 3→1 drawn as pips (more support = more filled), plus words. */
const SUPPORT: Record<Guidance, number> = { guided: 3, assisted: 2, independent: 1 };

export const GUIDANCE_TEXT: Record<Guidance, { label: LocalizedText; short: LocalizedText; detail: LocalizedText }> = {
  guided: {
    label: { zh: '引导', en: 'Guided' },
    short: { zh: '全程提示', en: 'Full support' },
    detail: {
      zh: '每一步都有说明和提示，答错会立刻解释原因。适合第一次学。',
      en: 'Every step is explained and hinted; mistakes are explained right away. Best the first time.',
    },
  },
  assisted: {
    label: { zh: '辅助', en: 'Assisted' },
    short: { zh: '需要时提示', en: 'Hints on request' },
    detail: {
      zh: '提示收起来了，需要时再点开；仍会解释每个选择。',
      en: 'Hints stay folded until you ask; every choice is still explained.',
    },
  },
  independent: {
    label: { zh: '独立', en: 'Independent' },
    short: { zh: '自己完成', en: 'On your own' },
    detail: {
      zh: '没有步骤标签和提示，完成后统一反馈。随时可以降回引导模式。',
      en: 'No step labels or hints; feedback comes at the end. You can step back down any time.',
    },
  },
};

export function guidanceLabel(g: Guidance, locale: Locale): string {
  return pick(GUIDANCE_TEXT[g].label, locale);
}

export function SupportPips({ level }: { level: Guidance }) {
  const n = SUPPORT[level];
  return (
    <span className="cl-pips" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className="cl-pips__pip" data-on={i <= n} />
      ))}
    </span>
  );
}

export interface GuidanceBadgeProps {
  level: Guidance;
  locale: Locale;
  className?: string;
}

export function GuidanceBadge({ level, locale, className }: GuidanceBadgeProps) {
  return (
    <span className={cx('cl-guidance', className)} data-level={level} title={pick(GUIDANCE_TEXT[level].detail, locale)}>
      <SupportPips level={level} />
      <span>{pick(GUIDANCE_TEXT[level].label, locale)}</span>
    </span>
  );
}

export interface GuidanceSelectorProps {
  value: Guidance;
  onChange(g: Guidance): void;
  locale: Locale;
  /** compact = inline pills (lesson header); full = cards with descriptions (start of an activity / settings). */
  variant?: 'compact' | 'full';
  /** Restrict to tiers an activity supports. */
  available?: readonly Guidance[];
  label?: string;
  className?: string;
}

export function GuidanceSelector({
  value,
  onChange,
  locale,
  variant = 'compact',
  available = GUIDANCE_ORDER,
  label,
  className,
}: GuidanceSelectorProps) {
  const options = GUIDANCE_ORDER.filter((g) => available.includes(g)).map((g) => ({
    value: g,
    label: pick(GUIDANCE_TEXT[g].label, locale),
    icon: <SupportPips level={g} />,
    description:
      variant === 'full' ? (
        <>
          <strong>{pick(GUIDANCE_TEXT[g].short, locale)}</strong> · {pick(GUIDANCE_TEXT[g].detail, locale)}
        </>
      ) : undefined,
  }));
  return (
    <SegmentedControl<Guidance>
      options={options}
      value={value}
      onChange={onChange}
      label={label ?? (locale === 'zh' ? '提示程度' : 'Guidance level')}
      layout={variant === 'full' ? 'stacked' : 'inline'}
      className={className}
    />
  );
}

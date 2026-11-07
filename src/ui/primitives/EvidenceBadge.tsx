import type { EvidenceKind, Locale, LocalizedText } from '../../domain/contracts';
import { Icon } from '../icons';
import type { IconName } from '../icons';
import { cx, pick } from './util';
import './primitives.css';

/**
 * Honest provenance labels (CONTRACTS.md §9). Every result shown to the learner
 * carries one of these so practice in a quiz/simulation is never mistaken for
 * real hands-on skill, and real-world steps are clearly the learner's own report.
 */
export const EVIDENCE_TEXT: Record<EvidenceKind, { icon: IconName; label: LocalizedText; detail: LocalizedText }> = {
  self_report: {
    icon: 'person-check',
    label: { zh: '自我报告', en: 'Self-reported' },
    detail: {
      zh: '由你自己确认——应用看不到你的厨房，也无法判断实际操作。',
      en: "You confirmed this yourself — the app can't see your kitchen or check the result.",
    },
  },
  assessed_answer: {
    icon: 'clipboard-check',
    label: { zh: '答题评估', en: 'Assessed answer' },
    detail: {
      zh: '根据你在应用里的作答评估——代表理解程度，不代表动手技能。',
      en: 'Based on your answers in the app — it shows understanding, not hands-on skill.',
    },
  },
  simulated: {
    icon: 'cube',
    label: { zh: '模拟练习', en: 'Simulated' },
    detail: {
      zh: '在模拟中完成——练习步骤顺序与位置，不包括真实手感、力度或味道。',
      en: 'Done in a simulation — practises order and positioning, not real touch, force or taste.',
    },
  },
  observed_by_app: {
    icon: 'clock',
    label: { zh: '应用记录', en: 'Recorded by app' },
    detail: {
      zh: '由应用直接测量（例如你在这里运行的计时器）。',
      en: 'Measured by the app itself (for example, a timer you ran here).',
    },
  },
};

export function evidenceLabel(kind: EvidenceKind, locale: Locale): string {
  return pick(EVIDENCE_TEXT[kind].label, locale);
}

export function evidenceDetail(kind: EvidenceKind, locale: Locale): string {
  return pick(EVIDENCE_TEXT[kind].detail, locale);
}

export interface EvidenceBadgeProps {
  kind: EvidenceKind;
  locale: Locale;
  /** Also render the one-line explanation under the badge (recommended the first time it appears on a screen). */
  showDetail?: boolean;
  className?: string;
}

export function EvidenceBadge({ kind, locale, showDetail, className }: EvidenceBadgeProps) {
  const meta = EVIDENCE_TEXT[kind];
  const label = pick(meta.label, locale);
  const detail = pick(meta.detail, locale);
  const badge = (
    <span className={cx('cl-evidence', !showDetail && className)} data-kind={kind} title={showDetail ? undefined : detail}>
      <Icon name={meta.icon} size={14} strokeWidth={2} />
      <span>{label}</span>
    </span>
  );
  if (!showDetail) return badge;
  return (
    <span className={cx('cl-evidence-wrap', className)}>
      {badge}
      <span className="cl-evidence-wrap__detail">{detail}</span>
    </span>
  );
}

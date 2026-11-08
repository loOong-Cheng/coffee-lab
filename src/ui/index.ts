/**
 * Coffee Lab UI kit — the only place screens should get visual building blocks from.
 * Styling via tokens (src/styles/tokens.css). Text comes in via props or a `locale` prop;
 * nothing here depends on src/i18n. See docs/UX_SPEC.md for when to use what.
 */
export { Icon, ICON_NAMES } from './icons';
export type { IconName, IconProps } from './icons';

export { Button, IconButton } from './primitives/Button';
export type { ButtonProps, ButtonSize, ButtonVariant, IconButtonProps } from './primitives/Button';
export { Card } from './primitives/Card';
export type { CardProps } from './primitives/Card';
export { Tag, Chip } from './primitives/Tag';
export type { TagProps, ChipProps, Tone } from './primitives/Tag';
export { ProgressBar, ProgressRing, StepProgress } from './primitives/Progress';
export type { ProgressBarProps, ProgressRingProps, StepProgressProps, StepState } from './primitives/Progress';
export { Switch } from './primitives/Switch';
export type { SwitchProps } from './primitives/Switch';
export { SegmentedControl } from './primitives/SegmentedControl';
export type { SegmentedControlProps, SegmentedOption } from './primitives/SegmentedControl';
export { Callout, CALLOUT_META } from './primitives/Callout';
export type { CalloutKind, CalloutProps } from './primitives/Callout';
export { EvidenceBadge, EVIDENCE_TEXT, evidenceLabel, evidenceDetail } from './primitives/EvidenceBadge';
export type { EvidenceBadgeProps } from './primitives/EvidenceBadge';
export {
  GuidanceBadge,
  GuidanceSelector,
  SupportPips,
  GUIDANCE_TEXT,
  GUIDANCE_ORDER,
  guidanceLabel,
} from './primitives/Guidance';
export type { GuidanceBadgeProps, GuidanceSelectorProps } from './primitives/Guidance';
export { FeedbackPanel } from './primitives/FeedbackPanel';
export type { FeedbackPanelProps, FeedbackStatus } from './primitives/FeedbackPanel';
export { Dialog, Sheet } from './primitives/Dialog';
export type { DialogProps } from './primitives/Dialog';
export { ToastProvider, useToast, useAnnounce } from './primitives/Toast';
export type { ToastOptions, ToastTone } from './primitives/Toast';
export { announce } from './primitives/announcer';
export type { Politeness } from './primitives/announcer';
export { Kbd, Spinner, EmptyState } from './primitives/misc';
export type { EmptyStateProps } from './primitives/misc';
export { KitchenActionBar } from './primitives/KitchenActionBar';
export type { KitchenActionBarProps } from './primitives/KitchenActionBar';
export { cx, pick } from './primitives/util';
export { MusicControl } from './MusicControl';
export type { MusicControlProps } from './MusicControl';

export * from './illustrations';

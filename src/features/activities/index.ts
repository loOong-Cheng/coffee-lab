/** 2D activity runtime (desktop-first, touch-usable). Consumed by the lesson player. */
export { ActivityRenderer } from './ActivityRenderer';
export { ActivityArt, coverArtKey } from './ActivityArt';
export type { ActivityProps, ActivityResult } from './types';
export { guidancePolicy, isGuidanceSensitive, GUIDANCE_SENSITIVE_KINDS, type GuidancePolicy } from './logic/guidance';
export { evidenceForKind, EVIDENCE_BY_KIND, RECORDED_BY_LESSON_PLAYER } from './logic/evidence';
export { extractionModel, type ExtractionModelResult } from './logic/extractionModel';
export { checkChallenge } from './logic/ratioLab';
export { checkSequence, checkNextStep } from './logic/sequence';

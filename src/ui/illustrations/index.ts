import type { DiagramId, Locale } from '../../domain/contracts';
import { ESPRESSO_PART_LABELS } from './EspressoStationDiagram';
import { POUROVER_PART_LABELS } from './PourOverStationDiagram';

export { EspressoStationDiagram, ESPRESSO_PART_LABELS, ESPRESSO_PINS, ESPRESSO_VIEWBOX } from './EspressoStationDiagram';
export { PourOverStationDiagram, POUROVER_PART_LABELS, POUROVER_PINS, POUROVER_VIEWBOX } from './PourOverStationDiagram';
export type { DiagramProps, PartSpec } from './StationDiagram';
export {
  Illustration,
  ILLUSTRATION_KEYS,
  hasIllustration,
  normalizeIllustrationKey,
  resolveIllustration,
} from './Illustration';
export type { IllustrationProps } from './Illustration';
export { ILLUSTRATION_ALIASES } from './aliases';

/** Built-in bilingual part name for any diagram part (useful for feedback text). */
export function diagramPartLabel(diagram: DiagramId, partId: string, locale: Locale): string {
  const table = (diagram === 'espresso-station' ? ESPRESSO_PART_LABELS : POUROVER_PART_LABELS) as Record<
    string,
    { zh: string; en: string } | undefined
  >;
  const t = table[partId];
  return t ? t[locale] : partId;
}

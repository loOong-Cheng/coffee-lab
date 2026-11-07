/**
 * Decorative card art. Thin wrapper over the UI kit's `Illustration` (70 original scenes + content-key
 * aliases + graceful fallback) so features never draw their own pictures. The adjacent text carries
 * the meaning, so the art is hidden from assistive tech.
 */
import type { Activity } from '../../domain/contracts';
import { Illustration } from '../../ui/illustrations/Illustration';

export function ActivityArt({ name, className }: { name?: string | null; className?: string }) {
  return (
    <div className={className ?? 'act-art'} aria-hidden="true">
      <Illustration name={name} />
    </div>
  );
}

/** First illustration key a lesson's concept cards use — a fitting cover picture for that lesson. */
export function coverArtKey(activities: readonly Activity[]): string | undefined {
  for (const a of activities) {
    if (a.kind === 'explain') {
      const key = a.cards.find((c) => c.illustration)?.illustration;
      if (key) return key;
    }
  }
  return undefined;
}

/**
 * Marker glyph per place kind. Shape AND colour differ (never colour alone):
 * origin = star · producer = round "bean" · drink culture = rounded square · coffeehouse = diamond.
 * Decorative (aria-hidden): the surrounding text always names the kind.
 */
import type { PlaceKind } from './model';

const SHAPES: Record<PlaceKind, string> = {
  origin: 'M12 2.6l2.75 5.95 6.5.72-4.85 4.4 1.37 6.4L12 16.8l-5.77 3.27 1.37-6.4-4.85-4.4 6.5-.72z',
  producer: 'M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z',
  'drink-culture': 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z',
  coffeehouse: 'M12 2.5l9.5 9.5-9.5 9.5L2.5 12z',
};

export function KindMark({ kind, size = 18, className }: { kind: PlaceKind; size?: number; className?: string }) {
  return (
    <svg
      className={`cu-mark cu-mark--${kind}${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path className="cu-mark__shape" d={SHAPES[kind]} />
      {kind === 'producer' && <path className="cu-mark__seam" d="M12 6.5c-2.6 3.2-2.6 7.8 0 11" />}
    </svg>
  );
}

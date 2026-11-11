/** Neutral kind icon in a circle — stands in for brand imagery (no logos or brand art, by rule). Decorative. */
import type { Brand } from '../../content';
import { Icon } from '../../ui';
import { KIND_TEXT } from './strings';

export function KindBadge({ brand, size = 22 }: { brand: Brand; size?: number }) {
  return (
    <span className="br-badge" data-kind={brand.kind} aria-hidden="true">
      <Icon name={KIND_TEXT[brand.kind].icon} size={size} />
    </span>
  );
}

import { useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import type { Locale, LocalizedText } from '../../domain/contracts';
import { Icon } from '../icons';
import { cx, pick } from '../primitives/util';
import './illustrations.css';

/** Public props shared by EspressoStationDiagram and PourOverStationDiagram. */
export interface DiagramProps<P extends string = string> {
  /** explore = labelled pins, free clicking; quiz = numbered pins with names hidden until revealed. */
  mode: 'explore' | 'quiz';
  /** Parts to draw attention to (hint / "look here"): pulsing ring + glow. */
  highlighted?: readonly string[];
  /** Parts whose names are revealed in quiz mode (e.g. correctly identified). Always labelled in explore. */
  revealed?: readonly string[];
  /** Parts just picked wrongly in quiz mode (shows an ✕ on the pin; pair with explanatory feedback). */
  incorrect?: readonly string[];
  /** Currently selected part (explore: shows pressed state + label). */
  selected?: string | null;
  onSelectPart?(id: P): void;
  /** Override labels (e.g. from IdentifyActivity targets). Falls back to built-in bilingual names. */
  labels?: Partial<Record<P, string>>;
  locale?: Locale;
  /** Accessible name for the figure (defaults to the diagram title). */
  title?: string;
  /** Visible caption under the drawing. */
  caption?: ReactNode;
  /** Hide pins entirely to use the drawing as a plain illustration. */
  showPins?: boolean;
  /** Numbered key under the drawing in explore mode (default true). Never shown in quiz mode. */
  showLegend?: boolean;
  className?: string;
}

export interface PartSpec<P extends string> {
  id: P;
  /** Pin centre in viewBox units. Pins sit beside small parts (with a leader) so the part stays visible. */
  pin: [number, number];
  /** Point on the part the leader line points to (omit when the pin sits on a large part). */
  anchor?: [number, number];
  /** Which side of the pin its name chip appears on (chosen per layout to avoid collisions). */
  side?: 'left' | 'right' | 'top' | 'bottom';
}

/** Helpers the art function uses to make each part's <g> reflect state and accept pointer clicks. */
export interface PartBinder<P extends string> {
  (id: P): {
    className: string;
    'data-part': P;
    onClick?: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

interface StationDiagramProps<P extends string> extends DiagramProps<P> {
  diagramId: string;
  width: number;
  height: number;
  parts: ReadonlyArray<PartSpec<P>>;
  defaultLabels: Record<P, LocalizedText>;
  defaultTitle: LocalizedText;
  art(part: PartBinder<P>): ReactNode;
}

export function StationDiagram<P extends string>({
  diagramId,
  width,
  height,
  parts,
  defaultLabels,
  defaultTitle,
  art,
  mode,
  highlighted = [],
  revealed = [],
  incorrect = [],
  selected = null,
  onSelectPart,
  labels,
  locale = 'en',
  title,
  caption,
  showPins = true,
  showLegend = true,
  className,
}: StationDiagramProps<P>) {
  const [hover, setHover] = useState<P | null>(null);
  const pinRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const labelOf = (id: P) => labels?.[id] ?? pick(defaultLabels[id], locale);
  const isRevealed = (id: P) => mode === 'explore' || revealed.includes(id);

  const bind: PartBinder<P> = (id) => ({
    className: cx(
      'cl-part',
      highlighted.includes(id) && 'is-highlighted',
      (hover === id || selected === id) && 'is-active',
      mode === 'quiz' && revealed.includes(id) && 'is-revealed',
      onSelectPart && 'is-clickable',
    ),
    'data-part': id,
    onClick: onSelectPart ? () => onSelectPart(id) : undefined,
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover((h) => (h === id ? null : h)),
  });

  const pinLabel = (id: P, i: number) => {
    const n = i + 1;
    const name = labelOf(id);
    if (mode === 'explore') return name;
    if (revealed.includes(id)) return locale === 'zh' ? `部件 ${n}：${name}（已识别）` : `Part ${n}: ${name} (identified)`;
    return locale === 'zh' ? `部件 ${n}` : `Part ${n}`;
  };

  const onPinKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (i + delta + parts.length) % parts.length;
    pinRefs.current[next]?.focus();
  };

  const figureLabel = title ?? pick(defaultTitle, locale);

  return (
    <figure className={cx('cl-diagram', `cl-diagram--${mode}`, className)} data-diagram={diagramId} aria-label={figureLabel}>
      <div className="cl-diagram__stage" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg
          className="cl-diagram__svg"
          viewBox={`0 0 ${width} ${height}`}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
        >
          {art(bind)}
          {showPins &&
            parts.map((p) =>
              p.anchor ? (
                <g key={`lead-${p.id}`} className={cx('cl-leader', (hover === p.id || selected === p.id) && 'is-active')}>
                  <line x1={p.pin[0]} y1={p.pin[1]} x2={p.anchor[0]} y2={p.anchor[1]} />
                  <circle cx={p.anchor[0]} cy={p.anchor[1]} r={5} />
                </g>
              ) : null,
            )}
        </svg>
        {showPins && (
          <ul className="cl-diagram__pins" role="list" aria-label={locale === 'zh' ? '部件' : 'Parts'}>
            {parts.map((p, i) => {
              const rev = isRevealed(p.id);
              const wrong = mode === 'quiz' && incorrect.includes(p.id) && !revealed.includes(p.id);
              const right = mode === 'quiz' && revealed.includes(p.id);
              const xPct = (p.pin[0] / width) * 100;
              return (
                <li key={p.id} className="cl-diagram__pin-item" style={{ left: `${xPct}%`, top: `${(p.pin[1] / height) * 100}%` }}>
                  <button
                    ref={(el) => {
                      pinRefs.current[i] = el;
                    }}
                    type="button"
                    className={cx(
                      'cl-hotspot',
                      `cl-hotspot--label-${p.side ?? (xPct > 58 ? 'left' : 'right')}`,
                      hover === p.id && 'is-active',
                      highlighted.includes(p.id) && 'is-highlighted',
                      right && 'is-revealed',
                      wrong && 'is-incorrect',
                    )}
                    data-part={p.id}
                    aria-label={pinLabel(p.id, i)}
                    aria-pressed={mode === 'explore' && onSelectPart ? selected === p.id : undefined}
                    onClick={() => onSelectPart?.(p.id)}
                    onMouseEnter={() => setHover(p.id)}
                    onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
                    onFocus={() => setHover(p.id)}
                    onBlur={() => setHover((h) => (h === p.id ? null : h))}
                    onKeyDown={(e) => onPinKey(e, i)}
                  >
                    <span className="cl-hotspot__dot" aria-hidden="true">
                      {right ? <Icon name="check" size={16} strokeWidth={3} /> : wrong ? <Icon name="x" size={16} strokeWidth={3} /> : i + 1}
                    </span>
                    {rev && (
                      <span className="cl-hotspot__label" aria-hidden="true">
                        {labelOf(p.id)}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {showPins && showLegend && mode === 'explore' && (
        // Visual key only: the pins themselves carry the accessible names.
        <ol className="cl-diagram__legend" aria-hidden="true">
          {parts.map((p, i) => (
            <li
              key={p.id}
              className={cx(
                'cl-diagram__legend-item',
                (selected === p.id || hover === p.id) && 'is-active',
                highlighted.includes(p.id) && 'is-highlighted',
              )}
              onMouseEnter={() => setHover(p.id)}
              onMouseLeave={() => setHover((h) => (h === p.id ? null : h))}
            >
              <span className="cl-diagram__legend-num">{i + 1}</span>
              {labelOf(p.id)}
            </li>
          ))}
        </ol>
      )}
      {caption && <figcaption className="cl-diagram__caption">{caption}</figcaption>}
    </figure>
  );
}

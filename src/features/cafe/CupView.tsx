/**
 * Original SVG cross-section of the drink being built: layers drawn in proportion to (rough,
 * illustrative) volumes, so the structural differences between drinks are visible at a glance.
 * No text is baked in; the accessible name describes the layers in words.
 */
import { useId } from 'react';
import type { Locale, LocalizedText } from '../../domain/contracts';
import { cx } from '../../ui';
import { CUP_CAPACITY_ML, buildVolumeMl, cupLayers, type Build, type CupSize, type LayerKind } from './model';
import { CUP_TEXT } from './strings';

interface CupGeom {
  top: number;
  bottom: number;
  wTop: number;
  wBottom: number;
  handle: boolean;
  saucer: boolean;
  glass: boolean;
}

const CX = 80;
/** Same scale for every cup (sizes stay comparable); the empty sky above the tallest mug is cropped. */
const VIEWBOX = '0 30 160 126';
const VB_RATIO = 126 / 160;
const GEOM: Record<CupSize, CupGeom> = {
  demitasse: { top: 106, bottom: 140, wTop: 46, wBottom: 34, handle: true, saucer: true, glass: false },
  small: { top: 80, bottom: 142, wTop: 54, wBottom: 46, handle: false, saucer: false, glass: true },
  medium: { top: 90, bottom: 140, wTop: 78, wBottom: 50, handle: true, saucer: true, glass: false },
  large: { top: 48, bottom: 142, wTop: 64, wBottom: 56, handle: true, saucer: false, glass: false },
};

const LAYER_TEXT: Record<LayerKind, LocalizedText> = {
  chocolate: { zh: '巧克力酱', en: 'chocolate' },
  condensed: { zh: '炼乳', en: 'condensed milk' },
  'ice-cream': { zh: '冰淇淋', en: 'ice cream' },
  water: { zh: '热水', en: 'hot water' },
  'cold-milk': { zh: '冷牛奶', en: 'cold milk' },
  'milk-tea': { zh: '港式奶茶', en: 'milk tea' },
  espresso: { zh: '浓缩', en: 'espresso' },
  diluted: { zh: '加了水的浓缩', en: 'espresso with water' },
  brew: { zh: '咖啡', en: 'brewed coffee' },
  crema: { zh: '油脂/泡沫', en: 'crema/foam' },
  milk: { zh: '热奶', en: 'steamed milk' },
  foam: { zh: '奶泡', en: 'milk foam' },
};

export function describeCup(b: Build, locale: Locale): string {
  const zh = locale === 'zh';
  if (!b.cup) return zh ? '还没有选杯子' : 'No cup chosen yet';
  const layers = cupLayers(b).filter((l) => l.kind !== 'crema');
  const parts = layers.map((l) => `${LAYER_TEXT[l.kind][locale]} ${zh ? '约' : '~'}${l.ml} ml`);
  const extras: string[] = [];
  if (b.ice) extras.push(zh ? '加冰' : 'over ice');
  if (b.extras.includes('sugar')) extras.push(zh ? '加糖' : 'with sugar');
  if (b.extras.includes('cardamom')) extras.push(zh ? '小豆蔻' : 'with cardamom');
  if (b.extras.includes('cinnamon-piloncillo')) extras.push(zh ? '肉桂和粗糖' : 'with cinnamon and piloncillo');
  const over = buildVolumeMl(b) > CUP_CAPACITY_ML[b.cup];
  const head = CUP_TEXT[b.cup][locale];
  const body = parts.length ? parts.join(zh ? '，' : ', ') : zh ? '空的' : 'empty';
  return `${head}: ${body}${extras.length ? (zh ? '，' : ', ') + extras.join(zh ? '，' : ', ') : ''}${over ? (zh ? '——溢出来了' : ' — overflowing') : ''}`;
}

export interface CupViewProps {
  build: Build;
  locale: Locale;
  size?: number;
  className?: string;
  /** Override the accessible name prefix (e.g. "Your cup"). */
  label?: string;
  testId?: string;
}

export function CupView({ build, locale, size = 160, className, label, testId }: CupViewProps) {
  const clipId = useId().replace(/:/g, '');
  const desc = describeCup(build, locale);
  const name = label ? `${label}. ${desc}` : desc;

  if (!build.cup) {
    return (
      <svg viewBox={VIEWBOX} width={size} height={Math.round(size * VB_RATIO)} className={cx('cafe-cup', 'cafe-cup--empty', className)} role="img" aria-label={name} data-testid={testId}>
        <ellipse cx={80} cy={148} rx={52} ry={5} className="cafe-cup__shadow" />
        <path d="M44 84h72l-6 56H50z" className="cafe-cup__ghost" />
      </svg>
    );
  }

  const g = GEOM[build.cup];
  const cap = CUP_CAPACITY_ML[build.cup];
  const inner = g.bottom - g.top - 3;
  const outline = `M${CX - g.wTop / 2} ${g.top} L${CX + g.wTop / 2} ${g.top} L${CX + g.wBottom / 2} ${g.bottom} Q${CX} ${g.bottom + (build.cup === 'medium' ? 6 : 2)} ${CX - g.wBottom / 2} ${g.bottom} Z`;
  const layers = cupLayers(build);
  const total = buildVolumeMl(build);
  const over = total > cap;

  let y = g.bottom;
  const rects = layers.map((l, i) => {
    const h = Math.max(l.kind === 'crema' ? 1.6 : 0, (l.ml / cap) * inner);
    y -= h;
    const top = Math.max(g.top, y);
    return (
      <rect key={`${l.kind}-${i}`} x={CX - 60} y={top} width={120} height={Math.max(0, Math.min(h, g.bottom - top + 4))} className={`cafe-cup__layer cafe-cup__layer--${l.kind}`} />
    );
  });
  const liquidTop = Math.max(g.top, y);
  const iceCream = layers.find((l) => l.kind === 'ice-cream');
  const iceCreamTop = (() => {
    if (!iceCream) return null;
    let yy = g.bottom;
    for (const l of layers) {
      yy -= (l.ml / cap) * inner;
      if (l === iceCream) return yy;
    }
    return null;
  })();

  const cubes =
    build.ice && layers.length
      ? [0, 1, 2, 3].map((i) => {
          const span = g.bottom - liquidTop;
          const cy = g.bottom - span * (0.25 + 0.2 * i) - 6;
          const cxx = CX + (i % 2 === 0 ? -g.wBottom / 5 : g.wBottom / 6);
          return (
            <rect key={i} x={cxx - 8} y={cy - 8} width={16} height={16} rx={3} transform={`rotate(${i % 2 ? 14 : -10} ${cxx} ${cy})`} className="cafe-cup__ice" />
          );
        })
      : null;

  return (
    <svg
      viewBox={VIEWBOX}
      width={size}
      height={Math.round(size * VB_RATIO)}
      className={cx('cafe-cup', className)}
      role="img"
      aria-label={name}
      data-testid={testId}
      data-cup={build.cup}
      data-overflow={over || undefined}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={outline} />
        </clipPath>
      </defs>
      <ellipse cx={80} cy={148} rx={58} ry={5} className="cafe-cup__shadow" />
      {g.saucer && <ellipse cx={80} cy={143} rx={g.wTop / 2 + 18} ry={5} className="cafe-cup__saucer" />}
      {g.handle && (
        <path
          d={`M${CX + g.wTop / 2 - 3} ${g.top + 6} c${build.cup === 'large' ? '18 0 22 8 22 22 s-6 24 -20 24' : '14 0 16 6 16 12 s-6 12 -16 12'}`}
          className="cafe-cup__handle"
        />
      )}
      <path d={outline} className={cx('cafe-cup__body', g.glass && 'cafe-cup__body--glass')} />
      <g clipPath={`url(#${clipId})`}>
        {rects}
        {iceCreamTop !== null && <ellipse cx={CX} cy={iceCreamTop + 2} rx={g.wBottom / 2.6} ry={8} className="cafe-cup__layer cafe-cup__layer--ice-cream" />}
        {cubes}
      </g>
      <path d={outline} className="cafe-cup__rim" />
      {build.extras.includes('cinnamon-piloncillo') && (
        <rect x={CX + 6} y={g.top - 16} width={6} height={42} rx={3} transform={`rotate(18 ${CX + 9} ${g.top + 4})`} className="cafe-cup__cinnamon" />
      )}
      {build.extras.includes('sugar') && (
        <g className="cafe-cup__sugar">
          <rect x={128} y={134} width={9} height={9} rx={1.5} />
          <rect x={138} y={136} width={8} height={8} rx={1.5} />
        </g>
      )}
      {build.extras.includes('cardamom') && (
        <g className="cafe-cup__cardamom">
          <ellipse cx={20} cy={140} rx={6} ry={3.5} transform="rotate(-20 20 140)" />
          <ellipse cx={31} cy={142} rx={6} ry={3.5} transform="rotate(15 31 142)" />
        </g>
      )}
      {over && (
        <g className="cafe-cup__spill">
          <path d={`M${CX + g.wTop / 2 - 2} ${g.top} q4 8 1 16 q-3 6 2 10`} />
          <circle cx={CX + g.wTop / 2 + 3} cy={g.top + 30} r={2.5} />
          <ellipse cx={CX + g.wTop / 2 + 6} cy={147} rx={10} ry={2.5} />
        </g>
      )}
    </svg>
  );
}

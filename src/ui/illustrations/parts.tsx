/**
 * Reusable ORIGINAL flat-style drawing pieces for Coffee Lab illustrations.
 * Each piece draws around an origin (usually bottom-centre) and accepts a scale,
 * inheriting stroke settings from the parent <g>. Colours come from --ill-* tokens
 * so every drawing follows light/dark theme.
 */
import type { ReactNode } from 'react';

export const C = {
  plate: 'var(--ill-plate)',
  plate2: 'var(--ill-plate-2)',
  line: 'var(--ill-line)',
  coffee: 'var(--ill-coffee)',
  coffeeDark: 'var(--ill-coffee-dark)',
  crema: 'var(--ill-crema)',
  milk: 'var(--ill-milk)',
  foam: 'var(--ill-foam)',
  steel: 'var(--ill-steel)',
  steelDark: 'var(--ill-steel-dark)',
  machine: 'var(--ill-machine)',
  machineDark: 'var(--ill-machine-dark)',
  wood: 'var(--ill-wood)',
  woodDark: 'var(--ill-wood-dark)',
  paper: 'var(--ill-paper)',
  water: 'var(--ill-water)',
  leaf: 'var(--ill-leaf)',
  cherry: 'var(--ill-cherry)',
  greenBean: 'var(--ill-green-bean)',
  glass: 'var(--ill-glass)',
  shadow: 'var(--ill-shadow)',
  flame: 'var(--ill-flame)',
  warn: 'var(--ill-warn)',
  clay: 'var(--ill-clay)',
  ice: 'var(--ill-ice)',
  ink: 'var(--ill-ink)',
} as const;

interface At {
  x: number;
  y: number;
  s?: number;
}

const tf = ({ x, y, s = 1 }: At, rot = 0) => `translate(${x} ${y})${rot ? ` rotate(${rot})` : ''}${s !== 1 ? ` scale(${s})` : ''}`;

/** Background plate + soft blob, used by every scene (240×160). */
export function Plate({ blob = true }: { blob?: boolean }) {
  return (
    <g stroke="none">
      <rect x="0" y="0" width="240" height="160" rx="16" fill={C.plate} />
      {blob && <path d="M42 118c-14-30 6-70 46-78s88-6 104 22 2 64-34 72-102 14-116-16Z" fill={C.plate2} />}
    </g>
  );
}

/** Ground shadow ellipse. */
export function Shadow({ x, y, w = 60 }: { x: number; y: number; w?: number }) {
  return <ellipse cx={x} cy={y} rx={w / 2} ry={w / 12} fill={C.shadow} stroke="none" />;
}

export function Bean({ x, y, s = 1, rot = 0, fill = C.coffee }: At & { rot?: number; fill?: string }) {
  return (
    <g transform={tf({ x, y, s }, rot)}>
      <ellipse cx="0" cy="0" rx="7" ry="10" fill={fill} />
      <path d="M-1.2 -8.5C3 -4 -3.8 3 1.2 8.5" fill="none" />
    </g>
  );
}

export function Steam({ x, y, s = 1, n = 3 }: At & { n?: number }) {
  const offs = n === 2 ? [-6, 6] : n === 1 ? [0] : [-10, 0, 10];
  return (
    <g transform={tf({ x, y, s })} fill="none" stroke={C.steelDark} strokeWidth={2.4} opacity={0.75}>
      {offs.map((o, i) => (
        <path key={o} d={`M${o} ${i % 2 ? -2 : 0}c-5-6 5-9 0-15s5-9 0-15`} />
      ))}
    </g>
  );
}

/** Espresso/cappuccino cup on saucer; origin = saucer centre. */
export function Cup({ x, y, s = 1, top = C.crema, art = false }: At & { top?: string; art?: boolean }) {
  return (
    <g transform={tf({ x, y, s })}>
      <ellipse cx="0" cy="0" rx="32" ry="6.5" fill={C.milk} />
      <path d="M22 -26c9 0 10 13 0 14" fill="none" strokeWidth={3.2} />
      <path d="M-24 -30h48l-3 20c-1 6-6 9-12 9h-18c-6 0-11-3-12-9Z" fill={C.milk} />
      <ellipse cx="0" cy="-30" rx="24" ry="4.5" fill={top} />
      {art && <path d="M-6 -31.5c-3-3 1-6 6-1.5 5-4.5 9-1.5 6 1.5l-6 3.2Z" fill={C.milk} strokeWidth={1.2} />}
      <ellipse cx="0" cy="-30" rx="24" ry="4.5" fill="none" />
    </g>
  );
}

/** Tall mug; origin = bottom centre. */
export function Mug({ x, y, s = 1, fill = C.milk }: At & { fill?: string }) {
  return (
    <g transform={tf({ x, y, s })}>
      <path d="M18 -34h5a8 8 0 0 1 0 16h-5" fill="none" strokeWidth={3.2} />
      <rect x="-20" y="-44" width="40" height="44" rx="7" fill={fill} />
      <ellipse cx="0" cy="-44" rx="20" ry="3.5" fill={C.coffee} />
    </g>
  );
}

/** Gooseneck kettle facing right; origin = bottom centre of body. */
export function Kettle({ x, y, s = 1, pour = false }: At & { pour?: boolean }) {
  return (
    <g transform={tf({ x, y, s })}>
      <path d="M-24 -42c-14 0-16 30-2 32" fill="none" strokeWidth={5} stroke={C.coffeeDark} />
      <path d="M-22 -46h44l6 40c1 4-2 6-5 6h-46c-3 0-6-2-5-6Z" fill={C.steel} />
      <path d="M-14 -46c0-8 6-11 14-11s14 3 14 11Z" fill={C.steelDark} />
      <circle cx="0" cy="-60" r="3.5" fill={C.coffeeDark} />
      {pour ? (
        <path d="M24 -12c14 2 14-12 20-24s10-18 22-20" fill="none" stroke={C.steelDark} strokeWidth={4.5} />
      ) : (
        <path d="M24 -12c12 0 12-14 16-26s8-14 14-14" fill="none" stroke={C.steelDark} strokeWidth={4.5} />
      )}
      <rect x="-22" y="-30" width="44" height="6" fill={C.steelDark} stroke="none" opacity={0.35} />
    </g>
  );
}

/** Cone dripper with paper filter; origin = bottom of base ring. */
export function Dripper({ x, y, s = 1, bed = true }: At & { bed?: boolean }) {
  return (
    <g transform={tf({ x, y, s })}>
      <path d="M-34 -48l-2 -6h72l-2 6Z" fill={C.paper} />
      <path d="M-34 -48h68l-24 34h-20Z" fill={C.milk} />
      {bed && <path d="M-26 -38h52l-6 9h-40Z" fill={C.coffee} strokeWidth={1.6} />}
      <path d="M-16 -36l8 18M16 -36l-8 18" fill="none" strokeWidth={1.6} opacity={0.5} />
      <rect x="-22" y="-14" width="44" height="7" rx="2" fill={C.milk} />
      <rect x="-8" y="-7" width="16" height="7" rx="1" fill={C.milk} />
    </g>
  );
}

/** Glass server/carafe with brewed coffee; origin = bottom centre. */
export function Carafe({ x, y, s = 1 }: At) {
  const body = 'M-26 -52h52c2 10 6 24 6 36 0 10-6 16-16 16h-32c-10 0-16-6-16-16 0-12 4-26 6-36Z';
  return (
    <g transform={tf({ x, y, s })}>
      <path d={body} fill={C.glass} />
      <path d="M-31.6 -22h63.2c.3 2 .4 4 .4 6 0 10-6 16-16 16h-32c-10 0-16-6-16-16 0-2 .1-4 .4-6Z" fill={C.coffee} stroke="none" />
      <path d={body} fill="none" />
      <path d="M-29 -54h58" fill="none" strokeWidth={4} />
      <path d="M-18 -44v14" fill="none" stroke={C.milk} strokeWidth={3} opacity={0.7} />
    </g>
  );
}

/** Flat digital scale; origin = bottom centre. */
export function Scale({ x, y, w = 90, s = 1, text }: At & { w?: number; text?: string }) {
  return (
    <g transform={tf({ x, y, s })}>
      <rect x={-w / 2} y="-14" width={w} height="14" rx="4" fill={C.coffeeDark} />
      <rect x={-w / 2 + 6} y="-18" width={w - 12} height="5" rx="2" fill={C.steel} />
      <rect x={-w / 4} y="-10.5" width={w / 2} height="7" rx="1.5" fill={C.ink} stroke="none" />
      {text && (
        <text
          x="0"
          y="-5"
          textAnchor="middle"
          fontSize="6.5"
          fontFamily="ui-monospace, Consolas, monospace"
          fontWeight="700"
          fill="#9be38f"
          stroke="none"
        >
          {text}
        </text>
      )}
    </g>
  );
}

/** Electric burr grinder; origin = bottom centre. */
export function Grinder({ x, y, s = 1 }: At) {
  return (
    <g transform={tf({ x, y, s })}>
      <path d="M-20 -104h40l-8 26h-24Z" fill={C.glass} />
      <Bean x={-6} y={-90} s={0.5} rot={20} />
      <Bean x={5} y={-92} s={0.5} rot={-30} />
      <Bean x={0} y={-84} s={0.5} rot={70} />
      <rect x="-24" y="-110" width="48" height="7" rx="3" fill={C.coffeeDark} />
      <rect x="-16" y="-78" width="32" height="60" rx="6" fill={C.coffeeDark} />
      <circle cx="0" cy="-62" r="7" fill={C.steel} />
      <path d="M0 -62l4 -4" fill="none" strokeWidth={2} />
      <rect x="-5" y="-42" width="10" height="7" fill={C.steelDark} />
      <rect x="-24" y="-18" width="48" height="18" rx="4" fill={C.coffeeDark} />
    </g>
  );
}

/** Hand grinder (tall cylinder + crank); origin = bottom centre. */
export function HandGrinder({ x, y, s = 1 }: At) {
  return (
    <g transform={tf({ x, y, s })}>
      <rect x="-15" y="-78" width="30" height="78" rx="6" fill={C.steel} />
      <rect x="-15" y="-30" width="30" height="14" fill={C.wood} />
      <path d="M0 -78v-10h26v-6" fill="none" strokeWidth={3.5} />
      <ellipse cx="26" cy="-98" rx="5" ry="6" fill={C.wood} />
      <rect x="-17" y="-82" width="34" height="6" rx="2" fill={C.steelDark} />
    </g>
  );
}

/** Portafilter side view, handle to the right; origin = top centre of the basket rim. */
export function Portafilter({ x, y, s = 1, grounds = false }: At & { grounds?: boolean }) {
  return (
    <g transform={tf({ x, y, s })}>
      <path d="M28 6l44 10c5 1 6 9 0 10l-46-6" fill={C.coffeeDark} />
      <path d="M-34 0h68v4c0 12-10 20-22 20h-24c-12 0-22-8-22-20Z" fill={C.steel} />
      {grounds && <path d="M-28 0h56" fill="none" stroke={C.coffee} strokeWidth={4} />}
      <path d="M-40 0h80" fill="none" strokeWidth={4} />
      <path d="M-6 24v8M6 24v8" fill="none" strokeWidth={3} />
    </g>
  );
}

/** Tamper; origin = bottom centre. */
export function Tamper({ x, y, s = 1 }: At) {
  return (
    <g transform={tf({ x, y, s })}>
      <path d="M-14 -40c-6-14 2-28 14-28s20 14 14 28Z" fill={C.wood} />
      <rect x="-5" y="-42" width="10" height="30" fill={C.steelDark} />
      <rect x="-22" y="-12" width="44" height="12" rx="2" fill={C.steel} />
    </g>
  );
}

/** Milk pitcher with spout on the left; origin = bottom centre. */
export function Pitcher({ x, y, s = 1 }: At) {
  return (
    <g transform={tf({ x, y, s })}>
      <path d="M22 -46c14 0 14 32 0 32" fill="none" strokeWidth={3.5} />
      <path d="M-24 -56l-10 -6h50l8 56c0 4-3 6-6 6h-38c-4 0-6-2-6-6l4-44Z" fill={C.steel} />
      <path d="M-22 -40h40" fill="none" strokeWidth={1.8} opacity={0.5} />
    </g>
  );
}

export function WarningSign({ x, y, s = 1 }: At) {
  return (
    <g transform={tf({ x, y, s })}>
      <path d="M0 -22L20 12H-20Z" fill={C.warn} strokeWidth={2.6} />
      <path d="M0 -10v10" fill="none" strokeWidth={3} />
      <circle cx="0" cy="6" r="1.6" fill={C.line} />
    </g>
  );
}

export function Sparkle({ x, y, s = 1, fill = C.crema }: At & { fill?: string }) {
  return (
    <path
      transform={tf({ x, y, s })}
      d="M0 -9l2.4 6.6L9 0l-6.6 2.4L0 9l-2.4-6.6L-9 0l6.6-2.4Z"
      fill={fill}
      strokeWidth={1.5}
    />
  );
}

export function Drop({ x, y, s = 1, fill = C.water }: At & { fill?: string }) {
  return <path transform={tf({ x, y, s })} d="M0 -12c5 7 8 10 8 14a8 8 0 0 1-16 0c0-4 3-7 8-14Z" fill={fill} />;
}

export function Flame({ x, y, s = 1 }: At) {
  return (
    <g transform={tf({ x, y, s })} fill={C.flame} strokeWidth={1.6}>
      <path d="M-14 0c-2-6 2-9 3-13 2 4 4 6 3 13Z" />
      <path d="M-4 0c-2-7 2-11 4-15 2 4 5 8 3 15Z" />
      <path d="M8 0c-2-6 2-9 3-13 2 4 4 6 3 13Z" />
    </g>
  );
}

export function Leaf({ x, y, s = 1, rot = 0 }: At & { rot?: number }) {
  return (
    <g transform={tf({ x, y, s }, rot)}>
      <path d="M0 0c6-12 22-14 30-8-6 10-20 14-30 8Z" fill={C.leaf} />
      <path d="M2 -1c8-3 16-5 24-6" fill="none" strokeWidth={1.4} />
    </g>
  );
}

/** Wrap children in a standard scene <svg>. */
export function Scene({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      xmlns="http://www.w3.org/2000/svg"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className="cl-ill__svg"
    >
      <Plate />
      <g stroke={C.line} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

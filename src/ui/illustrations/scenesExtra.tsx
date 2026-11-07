/**
 * Second batch of original scenes (240×160): safety, measurement, sensory, method
 * comparisons and regional drinks. Same flat style + tokens as Illustration.tsx.
 */
import type { ReactNode } from 'react';
import {
  Bean,
  C,
  Cup,
  Drop,
  Dripper,
  Flame,
  Grinder,
  Kettle,
  Leaf,
  Mug,
  Pitcher,
  Portafilter,
  Shadow,
  Sparkle,
  Steam,
  Tamper,
  WarningSign,
} from './parts';

export type SceneFn = (uid: string) => ReactNode;

const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

function wedge(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r1, a0);
  const [x1, y1] = polar(cx, cy, r1, a1);
  const [x2, y2] = polar(cx, cy, r0, a1);
  const [x3, y3] = polar(cx, cy, r0, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${r1} ${r1} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${large} 0 ${x3} ${y3}Z`;
}

/** Small stopwatch glyph; origin = centre. */
function Stopwatch({ x, y, r = 14, sweep = 0 }: { x: number; y: number; r?: number; sweep?: number }) {
  return (
    <g>
      <rect x={x - 3} y={y - r - 7} width="6" height="5" rx="1" fill={C.steelDark} />
      <circle cx={x} cy={y} r={r} fill={C.milk} />
      {sweep > 0 && <path d={wedge(x, y, 0.01, r - 3, 0, sweep)} fill={C.crema} stroke="none" opacity={0.75} />}
      <path d={`M${x} ${y}L${polar(x, y, r - 4, sweep)[0]} ${polar(x, y, r - 4, sweep)[1]}`} fill="none" strokeWidth={2} />
      <circle cx={x} cy={y} r={1.8} fill={C.line} stroke="none" />
    </g>
  );
}

function Heart({ x, y, s = 1, fill = C.cherry }: { x: number; y: number; s?: number; fill?: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 8C-16-2-12-16 0-8 12-16 16-2 0 8Z"
      fill={fill}
      strokeWidth={2.5 / s}
    />
  );
}

/** Prohibition ring with a hand inside. */
function NoHand({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r="22" fill={C.milk} />
      <path
        d="M-8 12c-4-3-8-9-10-13-1-3 2-5 4-3l4 4V-10a2.5 2.5 0 0 1 5 0v6-11a2.5 2.5 0 0 1 5 0V-4-12a2.5 2.5 0 0 1 5 0v9-6a2.5 2.5 0 0 1 5 0V5c0 6-4 10-10 10Z"
        fill={C.foam}
        strokeWidth={1.8}
      />
      <circle r="22" fill="none" stroke={C.cherry} strokeWidth={5} />
      <path d="M-15 -15l30 30" fill="none" stroke={C.cherry} strokeWidth={5} />
    </g>
  );
}

const SHOT = 'M-12 -34h24l-3 32c0 2-2 2-3 2h-12c-1 0-3 0-3-2Z';

export const EXTRA_SCENES: Record<string, SceneFn> = {
  'grinder-safety': () => (
    <>
      <Shadow x={82} y={136} w={70} />
      <Grinder x={82} y={136} s={1.05} />
      <NoHand x={152} y={56} s={1} />
      <WarningSign x={202} y={112} s={1.3} />
    </>
  ),

  'unplug-safety': () => (
    <>
      <rect x="26" y="40" width="64" height="64" rx="12" fill={C.milk} />
      <circle cx="58" cy="72" r="20" fill={C.foam} />
      <rect x="49" y="64" width="5" height="14" rx="2" fill={C.line} stroke="none" />
      <rect x="62" y="64" width="5" height="14" rx="2" fill={C.line} stroke="none" />
      <path d="M100 72h12" fill="none" strokeWidth={2.5} strokeDasharray="3 4" />
      <path d="M118 62h6v-8M118 82h6v8" fill="none" strokeWidth={3} />
      <rect x="124" y="56" width="26" height="32" rx="6" fill={C.coffeeDark} />
      <path d="M150 72c26 0 22 50 60 44" fill="none" stroke={C.coffeeDark} strokeWidth={5} />
      <path d="M108 40l-10 14h8l-8 14" fill="none" stroke={C.warn} strokeWidth={3.5} />
      <WarningSign x={200} y={52} s={1.3} />
    </>
  ),

  timer: () => (
    <>
      <rect x="88" y="24" width="16" height="10" rx="2" fill={C.steelDark} />
      <path d="M134 40l8-8" fill="none" strokeWidth={4} />
      <circle cx="96" cy="86" r="48" fill={C.milk} />
      <path d={wedge(96, 86, 0.01, 40, 150, 180)} fill={C.crema} stroke="none" opacity={0.8} />
      {Array.from({ length: 12 }, (_, i) => {
        const [x0, y0] = polar(96, 86, 42, i * 30);
        const [x1, y1] = polar(96, 86, 36, i * 30);
        return <path key={i} d={`M${x0} ${y0}L${x1} ${y1}`} fill="none" strokeWidth={i % 3 ? 1.5 : 2.5} />;
      })}
      <path d={`M96 86L${polar(96, 86, 34, 165)[0]} ${polar(96, 86, 34, 165)[1]}`} fill="none" stroke={C.cherry} strokeWidth={3} />
      <circle cx="96" cy="86" r="4" fill={C.line} stroke="none" />
      <Cup x={194} y={134} s={0.8} />
    </>
  ),

  temperature: () => (
    <>
      <Shadow x={74} y={136} w={80} />
      <Kettle x={74} y={136} s={0.95} />
      <Steam x={74} y={64} s={0.7} />
      <Shadow x={170} y={138} w={60} />
      <Pitcher x={170} y={138} s={0.85} />
      <path d="M176 112V58" fill="none" stroke={C.steelDark} strokeWidth={3} />
      <circle cx="176" cy="40" r="20" fill={C.milk} />
      <path d={wedge(176, 40, 13, 17, 30, 70)} fill={C.cherry} stroke="none" />
      <path d="M176 40l10-10" fill="none" strokeWidth={2.5} />
      <circle cx="176" cy="40" r="2.5" fill={C.line} stroke="none" />
    </>
  ),

  'flavor-wheel': () => {
    const fills = [C.cherry, C.foam, C.crema, C.wood, C.coffee, C.clay];
    return (
      <>
        {fills.map((f, i) => (
          <path key={i} d={wedge(100, 82, 18, 58, i * 60, i * 60 + 60)} fill={f} />
        ))}
        <circle cx="100" cy="82" r="18" fill={C.milk} />
        <path d="M100 82l26-30" fill="none" stroke={C.line} strokeWidth={4} />
        <path d="M126 52l-9 2 6 6Z" fill={C.line} />
        <circle cx="100" cy="82" r="4" fill={C.line} stroke="none" />
        <Cup x={198} y={132} s={0.7} />
        <Steam x={198} y={100} s={0.5} n={2} />
      </>
    );
  },

  journal: () => (
    <>
      <path d="M30 36h86v100H40c-6 0-10-4-10-10Z" fill={C.paper} />
      <path d="M116 36h86c6 0 8 2 8 8v92h-94Z" fill={C.paper} />
      <path d="M116 36v100" fill="none" />
      <path d="M44 56h56M44 70h56M44 84h40M130 56h64M130 70h64M130 84h48M130 98h56" fill="none" strokeWidth={1.6} opacity={0.5} />
      <Bean x={66} y={110} s={0.9} rot={25} />
      <circle cx="168" cy="118" r="13" fill="none" stroke={C.crema} strokeWidth={3} opacity={0.8} />
      <path d="M196 26l-48 66" fill="none" stroke={C.warn} strokeWidth={7} />
      <path d="M150 89l-4 7 7-3Z" fill={C.line} />
    </>
  ),

  levers: () => (
    <>
      {[70, 120, 170].map((x, i) => (
        <g key={x}>
          <rect x={x - 4} y="30" width="8" height="84" rx="4" fill={C.plate} />
          <rect
            x={x - 16}
            y={[78, 46, 70][i]! - 8}
            width="32"
            height="16"
            rx="6"
            fill={i === 1 ? C.crema : C.steel}
          />
        </g>
      ))}
      <path d="M140 40v-14m-6 6 6-7 6 7" fill="none" stroke={C.cherry} strokeWidth={3} />
      <Bean x={70} y={136} s={0.9} rot={20} />
      <Drop x={120} y={138} s={0.9} />
      <Stopwatch x={170} y={138} r={9} />
    </>
  ),

  preference: () => (
    <>
      <Cup x={100} y={132} s={1.5} />
      <Steam x={100} y={76} s={0.8} n={2} />
      <Heart x={168} y={50} s={1.6} />
      <Sparkle x={196} y={92} s={0.7} />
      <Sparkle x={140} y={30} s={0.5} />
    </>
  ),

  species: () => (
    <>
      <Leaf x={20} y={124} rot={-30} s={1.2} />
      <Leaf x={150} y={128} rot={-20} s={1.3} />
      <g transform="translate(76 78)">
        <ellipse rx="22" ry="32" fill={C.coffee} transform="rotate(-15)" />
        <path d="M-4-28C8-14-12 8 4 28" fill="none" transform="rotate(-15)" />
      </g>
      <g transform="translate(170 82)">
        <ellipse rx="22" ry="24" fill={C.coffeeDark} />
        <path d="M0-22V22" fill="none" />
      </g>
    </>
  ),

  processing: () => (
    <>
      <circle cx="40" cy="30" r="10" fill={C.warn} />
      <path d="M40 12v-4M24 30h-4M28 18l-3-3M52 18l3-3" fill="none" strokeWidth={2} />
      <rect x="14" y="104" width="64" height="8" rx="2" fill={C.wood} />
      <path d="M20 112v18M72 112v18" fill="none" strokeWidth={3} />
      {[24, 36, 48, 60, 30, 42, 54].map((x, i) => (
        <circle key={i} cx={x + 4} cy={i < 4 ? 98 : 88} r="6" fill={i % 2 ? C.cherry : C.machineDark} strokeWidth={1.8} />
      ))}
      <path d="M92 70h56v54c0 4-3 6-6 6h-44c-3 0-6-2-6-6Z" fill={C.glass} />
      <path d="M94.5 84h51v40c0 3-2 4-4 4h-43c-2 0-4-1-4-4Z" fill={C.water} stroke="none" opacity={0.7} />
      <Bean x={110} y={112} s={0.7} rot={30} fill={C.greenBean} />
      <Bean x={128} y={116} s={0.7} rot={-30} fill={C.greenBean} />
      <Bean x={120} y={98} s={0.7} rot={70} fill={C.greenBean} />
      <path d="M92 70h56v54c0 4-3 6-6 6h-44c-3 0-6-2-6-6Z" fill="none" />
      <ellipse cx="194" cy="118" rx="34" ry="8" fill={C.wood} />
      {[178, 194, 210, 186, 202].map((x, i) => (
        <g key={i}>
          <ellipse cx={x} cy={i < 3 ? 110 : 100} rx="10" ry="8" fill={C.warn} opacity={0.55} stroke="none" />
          <Bean x={x} y={i < 3 ? 110 : 100} s={0.65} rot={i * 40} fill={C.greenBean} />
        </g>
      ))}
    </>
  ),

  'burr-vs-blade': () => (
    <>
      <circle cx="62" cy="62" r="34" fill={C.steel} />
      <circle cx="62" cy="62" r="20" fill={C.steelDark} />
      {Array.from({ length: 16 }, (_, i) => {
        const [x0, y0] = polar(62, 62, 22, i * 22.5);
        const [x1, y1] = polar(62, 62, 32, i * 22.5 + 8);
        return <path key={i} d={`M${x0} ${y0}L${x1} ${y1}`} fill="none" strokeWidth={1.6} />;
      })}
      <circle cx="62" cy="62" r="6" fill={C.milk} />
      {[36, 48, 60, 72, 84].map((x) => (
        <circle key={x} cx={x + 2} cy={128} r={3.4} fill={C.coffee} stroke="none" />
      ))}
      <path d="M120 40v100" fill="none" strokeWidth={1.6} strokeDasharray="4 6" opacity={0.6} />
      <path d="M150 70h64l-6 30h-52Z" fill={C.steel} />
      <path d="M182 82c-14-10-22 0-22 4 10 0 14-2 22-4 8 2 12 4 22 4 0-4-8-14-22-4Z" fill={C.steelDark} />
      <path d="M182 82v18" fill="none" strokeWidth={3} />
      {[
        [156, 128, 5.5],
        [170, 130, 1.6],
        [180, 126, 3.8],
        [192, 130, 1.2],
        [202, 127, 4.6],
        [214, 131, 1.8],
      ].map(([x, y, r]) => (
        <circle key={x} cx={x} cy={y} r={r} fill={C.coffee} stroke="none" />
      ))}
    </>
  ),

  channeling: () => (
    <>
      {[84, 104, 124, 144].map((x) => (
        <path key={x} d={`M${x} 16v18m-5-6 5 7 5-7`} fill="none" stroke={C.flame} strokeWidth={2.2} />
      ))}
      <path d="M58 40h124l-8 46c-1 6-6 10-12 10H78c-6 0-11-4-12-10Z" fill={C.steel} />
      <path d="M66 52h108l-5 30H71Z" fill={C.coffee} stroke="none" />
      <path d="M128 52l-6 8 8 6-6 8 4 8" fill="none" stroke={C.water} strokeWidth={4} />
      <path d="M126 98c2 14-6 26-10 40" fill="none" stroke={C.coffee} strokeWidth={6} />
      <path d="M100 98v18" fill="none" stroke={C.coffee} strokeWidth={2} strokeDasharray="2 6" />
      <WarningSign x={204} y={110} s={1} />
    </>
  ),

  baskets: () => (
    <>
      {[
        [48, 0.75],
        [120, 0.95],
        [194, 1.15],
      ].map(([x, s]) => (
        <g key={x} transform={`translate(${x} 92) scale(${s})`}>
          <path d="M-28 -16h56l-5 28c-1 4-4 6-8 6h-30c-4 0-7-2-8-6Z" fill={C.steel} />
          <path d="M-34 -16h68" fill="none" strokeWidth={4} />
          <path d="M-14 14h28" fill="none" strokeWidth={2.4} strokeDasharray="1 5" />
        </g>
      ))}
      {[1, 2, 3].map((n, i) => (
        <g key={n}>
          {Array.from({ length: n }, (_, j) => (
            <Bean key={j} x={[48, 120, 194][i]! + (j - (n - 1) / 2) * 14} y={132} s={0.6} rot={20} />
          ))}
        </g>
      ))}
    </>
  ),

  drippers: () => (
    <>
      <Dripper x={46} y={124} s={0.85} />
      <g>
        <path d="M94 76h52l-10 34h-32Z" fill={C.milk} />
        <path d="M100 76l3 34M110 76l2 34M120 76v34M130 76l-2 34M140 76l-3 34" fill="none" strokeWidth={1.2} opacity={0.5} />
        <rect x="100" y="110" width="40" height="8" rx="2" fill={C.milk} />
        <path d="M110 118v4M120 118v4M130 118v4" fill="none" strokeWidth={2} />
      </g>
      <g>
        <path d="M168 40h44l-16 34 18 38c3 6-1 12-7 12h-32c-6 0-10-6-7-12l18-38Z" fill={C.glass} />
        <path d="M180 66h20l-3 14h-14Z" fill={C.wood} />
      </g>
      <path d="M20 132h200" fill="none" strokeWidth={2} opacity={0.5} />
    </>
  ),

  workflow: () => (
    <>
      {[38, 92, 146, 200].map((x, i) => (
        <g key={x}>
          <circle cx={x} cy={84} r={22} fill={i === 3 ? C.crema : C.milk} />
          <text x={x} y={46} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.ink} stroke="none">
            {i + 1}
          </text>
        </g>
      ))}
      {[60, 114, 168].map((x) => (
        <path key={x} d={`M${x + 2} 84h8m-4-4 4 4-4 4`} fill="none" strokeWidth={2} />
      ))}
      <Bean x={38} y={84} s={0.9} rot={20} />
      <Tamper x={92} y={98} s={0.45} />
      <Drop x={146} y={88} s={0.9} />
      <Cup x={200} y={96} s={0.45} />
      <path d="M30 130h180" fill="none" strokeWidth={2} strokeDasharray="2 8" opacity={0.6} />
    </>
  ),

  'portafilter-lock': () => (
    <>
      <rect x="40" y="16" width="120" height="18" rx="5" fill={C.steelDark} />
      <path d="M58 34h84v16c0 8-6 12-14 12H72c-8 0-14-4-14-12Z" fill={C.steel} />
      <Portafilter x={100} y={88} s={1.1} grounds />
      <path d="M100 82v-12m-6 6 6-7 6 7" fill="none" stroke={C.cherry} strokeWidth={3} />
      <path d="M176 128c18-6 26-22 22-40" fill="none" stroke={C.cherry} strokeWidth={3} />
      <path d="M192 90l6-6 4 8" fill="none" stroke={C.cherry} strokeWidth={3} />
    </>
  ),

  'grinder-tamper': () => (
    <>
      <Shadow x={76} y={138} w={70} />
      <Grinder x={76} y={138} s={1} />
      <Shadow x={166} y={138} w={60} />
      <Tamper x={166} y={138} s={1.3} />
      <path d="M200 138c3-8 16-8 20 0Z" fill={C.coffee} />
    </>
  ),

  'shot-lengths': () => (
    <>
      {[
        [56, 0.3],
        [120, 0.55],
        [184, 0.85],
      ].map(([x, lvl]) => {
        const top = -2 - 32 * lvl;
        const hw = 12 - (3 * (top + 34)) / 32; // glass half-width at the liquid line
        return (
          <g key={x} transform={`translate(${x} 128) scale(1.5)`}>
            <path d={SHOT} fill={C.glass} />
            <path d={`M${-hw} ${top}H${hw}L9 -2c0 2-2 2-3 2h-12c-1 0-3 0-3-2Z`} fill={C.coffee} stroke="none" />
            <path d={`M${-hw + 0.5} ${top}H${hw - 0.5}`} fill="none" stroke={C.crema} strokeWidth={2.5} />
            <path d={SHOT} fill="none" strokeWidth={1.8} />
          </g>
        );
      })}
    </>
  ),

  gooseneck: () => (
    <>
      <Shadow x={70} y={140} w={80} />
      <Kettle x={70} y={140} s={1.25} pour />
      <path d="M152 70c8 4 14 10 18 22" fill="none" stroke={C.water} strokeWidth={3} />
      <Shadow x={182} y={142} w={70} />
      <Dripper x={182} y={142} s={0.85} />
    </>
  ),

  'strength-extraction': () => (
    <>
      <path d="M40 22v108h176" fill="none" strokeWidth={3} />
      <path d="M36 30l4-8 4 8M208 126l8 4-8 4" fill="none" strokeWidth={2.5} />
      <path d="M40 58h176M40 94h176M98 22v108M156 22v108" fill="none" strokeWidth={1.2} strokeDasharray="3 5" opacity={0.6} />
      <rect x="98" y="58" width="58" height="36" fill={C.crema} opacity={0.55} stroke="none" />
      <rect x="98" y="58" width="58" height="36" fill="none" strokeWidth={2} />
      <circle cx="126" cy="76" r="6" fill={C.coffee} />
      <circle cx="70" cy="110" r="5" fill="none" />
      <circle cx="186" cy="40" r="5" fill="none" />
      <Drop x={22} y={50} s={0.7} fill={C.coffee} />
      <Stopwatch x={196} y={146} r={8} sweep={120} />
    </>
  ),

  'three-numbers': () => (
    <>
      {[
        [48, '18 g'],
        [120, '36 g'],
        [192, '28 s'],
      ].map(([x, label]) => (
        <g key={String(x)}>
          <rect x={Number(x) - 32} y="30" width="64" height="96" rx="12" fill={C.milk} />
          <text x={Number(x)} y="114" textAnchor="middle" fontSize="15" fontWeight="700" fill={C.ink} stroke="none" fontFamily="ui-monospace, Consolas, monospace">
            {label}
          </text>
        </g>
      ))}
      <Bean x={40} y={72} s={1} rot={20} />
      <Bean x={56} y={76} s={1} rot={-30} />
      <Cup x={120} y={90} s={0.75} />
      <Stopwatch x={192} y={72} r={16} sweep={168} />
    </>
  ),

  'black-coffee': () => (
    <>
      <Shadow x={120} y={136} w={90} />
      <Mug x={120} y={136} s={1.5} />
      <Steam x={120} y={60} s={0.9} />
      <Bean x={186} y={128} rot={30} />
    </>
  ),

  affogato: () => (
    <>
      <path d="M78 76h84c0 36-18 58-42 58s-42-22-42-58Z" fill={C.glass} />
      <circle cx="120" cy="82" r="24" fill={C.milk} />
      <path d="M100 92c8 8 32 8 40 0" fill="none" stroke={C.coffee} strokeWidth={6} />
      <path d="M78 76h84c0 36-18 58-42 58s-42-22-42-58Z" fill="none" />
      <path d="M174 30c-6 14-24 26-40 40" fill="none" stroke={C.coffee} strokeWidth={4} />
      <Cup x={196} y={42} s={0.55} />
      <rect x="110" y="132" width="20" height="8" rx="2" fill={C.glass} />
    </>
  ),

  dallah: () => (
    <>
      <path d="M86 132h44l-4-36c8-6 8-16 2-22l-4-20h-28l-4 20c-6 6-6 16 2 22Z" fill={C.warn} />
      <path d="M92 54c-2-10 6-18 16-18s18 8 16 18Z" fill={C.warn} />
      <path d="M108 36v-10" fill="none" strokeWidth={3} />
      <circle cx="108" cy="24" r="3" fill={C.warn} />
      <path d="M128 92c18-6 22-24 30-40 2-4 8-6 10-4" fill="none" stroke={C.line} strokeWidth={8} />
      <path d="M128 92c18-6 22-24 30-40 2-4 8-6 10-4" fill="none" stroke={C.warn} strokeWidth={4} />
      <path d="M88 90c-18-2-20-30-4-36" fill="none" stroke={C.line} strokeWidth={6} />
      <path d="M84 74h48" fill="none" strokeWidth={1.6} opacity={0.5} />
      {[164, 190].map((x) => (
        <g key={x}>
          <path d={`M${x - 9} 118h18l-3 14h-12Z`} fill={C.milk} />
          <ellipse cx={x} cy="118" rx="9" ry="2" fill={C.crema} />
        </g>
      ))}
      <ellipse cx="44" cy="128" rx="22" ry="5" fill={C.wood} />
      {[34, 44, 54].map((x) => (
        <ellipse key={x} cx={x} cy="122" rx="5" ry="8" fill={C.coffeeDark} transform={`rotate(70 ${x} 122)`} strokeWidth={1.8} />
      ))}
    </>
  ),

  'goat-legend': () => (
    <>
      <path d="M150 140c0-30 6-62 30-84" fill="none" stroke={C.woodDark} strokeWidth={4} />
      <Leaf x={168} y={78} rot={-60} />
      <Leaf x={176} y={66} rot={20} />
      <Leaf x={158} y={100} rot={-150} s={0.9} />
      <circle cx="184" cy="84" r="5" fill={C.cherry} />
      <circle cx="176" cy="92" r="5" fill={C.cherry} />
      <circle cx="165" cy="76" r="5" fill={C.cherry} />
      <g transform="translate(78 94) rotate(-8)">
        <path d="M-26 22l-4 22M-12 24l2 20M14 22l6 20M24 18l10 18" fill="none" strokeWidth={4} />
        <ellipse cx="0" cy="8" rx="34" ry="18" fill={C.milk} />
        <path d="M-34 4c-6-2-10 2-8 6" fill="none" strokeWidth={3} />
        <path d="M26 -2l12-20c4-6 14-6 16 2l2 12c0 6-6 8-10 6l-10-2" fill={C.milk} />
        <path d="M44 -20c-2-10 4-16 10-18M50 -18c2-8 8-12 14-12" fill="none" stroke={C.woodDark} strokeWidth={3} />
        <circle cx="50" cy="-8" r="2" fill={C.line} stroke="none" />
        <path d="M54 4c0 6-2 10-6 12" fill="none" strokeWidth={2.5} />
      </g>
      <path d="M36 44l4-8M30 52l-6-4M48 40l1-9" fill="none" stroke={C.crema} strokeWidth={3} />
    </>
  ),

  'scroll-ban': () => (
    <>
      <path d="M52 30h124v96H52Z" fill={C.paper} />
      <rect x="40" y="22" width="148" height="14" rx="7" fill={C.wood} />
      <rect x="40" y="120" width="148" height="14" rx="7" fill={C.wood} />
      <path d="M66 50h96M66 62h96M66 74h70M66 86h88M66 98h52" fill="none" strokeWidth={1.8} opacity={0.5} />
      <circle cx="158" cy="104" r="13" fill={C.cherry} />
      <path d="M152 100l12 8M164 100l-12 8" fill="none" stroke={C.milk} strokeWidth={2} />
      <Cup x={206} y={92} s={0.5} />
      <path d="M190 58l30 30M220 58l-30 30" fill="none" stroke={C.cherry} strokeWidth={4} opacity={0.85} />
    </>
  ),

  'mocha-port': () => (
    <>
      <circle cx="196" cy="36" r="14" fill={C.warn} />
      <path d="M20 112c12-6 24-6 36 0s24 6 36 0 24-6 36 0 24 6 36 0 24-6 36 0 24 6 24 6v36H20Z" fill={C.water} />
      <path d="M70 100h96l-12 18H84Z" fill={C.wood} />
      <path d="M118 100V30" fill="none" strokeWidth={3} />
      <path d="M118 32c-30 14-40 40-42 64h42Z" fill={C.paper} />
      <path d="M118 30l18 8-18 6" fill={C.cherry} strokeWidth={2} />
      {[136, 150].map((x) => (
        <path key={x} d={`M${x - 6} 100v-10c0-4 12-4 12 0v10Z`} fill={C.woodDark} />
      ))}
      <path d="M20 132c12-6 24-6 36 0s24 6 36 0 24-6 36 0 24 6 36 0 24-6 36 0" fill="none" stroke={C.milk} strokeWidth={2} opacity={0.7} />
    </>
  ),

  'lever-machine': () => (
    <>
      <Shadow x={110} y={140} w={110} />
      <rect x="76" y="40" width="68" height="94" rx="8" fill={C.steel} />
      <path d="M76 44c0-18 14-28 34-28s34 10 34 28Z" fill={C.crema} />
      <circle cx="110" cy="12" r="5" fill={C.crema} />
      <rect x="70" y="128" width="80" height="12" rx="3" fill={C.coffeeDark} />
      <rect x="96" y="76" width="28" height="14" rx="3" fill={C.steelDark} />
      <path d="M104 90h12v10c0 3-3 5-6 5s-6-2-6-5Z" fill={C.steel} />
      <path d="M110 76L84 30" fill="none" stroke={C.line} strokeWidth={7} />
      <path d="M110 76L84 30" fill="none" stroke={C.steelDark} strokeWidth={3} />
      <circle cx="84" cy="28" r="6" fill={C.coffeeDark} />
      <path d="M90 62h40" fill="none" strokeWidth={1.6} opacity={0.5} />
      <Cup x={110} y={128} s={0.45} />
      <circle cx="176" cy="60" r="18" fill={C.milk} />
      <path d="M176 60l10-8" fill="none" strokeWidth={2.5} />
      <path d="M146 64h12" fill="none" strokeWidth={4} />
      <Steam x={190} y={130} s={0.6} n={2} />
    </>
  ),

  fika: () => (
    <>
      <ellipse cx="120" cy="128" rx="96" ry="12" fill={C.milk} />
      <Cup x={82} y={124} s={1.15} />
      <Steam x={82} y={80} s={0.7} n={2} />
      <ellipse cx="166" cy="114" rx="34" ry="14" fill={C.crema} />
      <path d="M166 114m-2 0a4 3 0 1 1 6 1 10 7 0 1 1-14-1 16 10 0 1 1 26 2 22 13 0 1 1-34-2" fill="none" stroke={C.woodDark} strokeWidth={2.4} />
      {[150, 160, 176, 184, 168].map((x, i) => (
        <circle key={x} cx={x} cy={[106, 102, 104, 110, 98][i]} r="1.6" fill={C.milk} stroke="none" />
      ))}
    </>
  ),

  waves: () => (
    <>
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path
            d={`M20 ${116 - i * 34}c16-14 32-14 48 0s32 14 48 0 32-14 48 0 32 14 48 0`}
            fill="none"
            stroke={[C.coffee, C.crema, C.water][i]}
            strokeWidth={6}
          />
          <circle cx="222" cy={116 - i * 34} r="11" fill={C.milk} />
          <text x="222" y={121 - i * 34} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.ink} stroke="none">
            {i + 1}
          </text>
        </g>
      ))}
    </>
  ),

  'many-cups': () => (
    <>
      <path d="M14 140h212" fill="none" strokeWidth={2} opacity={0.5} />
      <Cup x={40} y={138} s={0.7} />
      <Mug x={92} y={138} s={0.8} />
      <path d="M132 100h28l-4 38h-20Z" fill={C.glass} />
      <path d="M134 112h24l-3 26h-18Z" fill={C.coffee} stroke="none" />
      <path d="M134 112h24" fill="none" stroke={C.foam} strokeWidth={4} />
      <path d="M132 100h28l-4 38h-20Z" fill="none" />
      <path d="M176 124h20l-3 14h-14Z" fill={C.milk} />
      <ellipse cx="186" cy="124" rx="10" ry="2.4" fill={C.coffee} />
      <path d="M206 116h18l-2 22h-14Z" fill={C.clay} />
      <ellipse cx="215" cy="116" rx="9" ry="2.2" fill={C.crema} />
      <Sparkle x={120} y={44} s={0.8} />
      <Sparkle x={70} y={64} s={0.5} />
      <Sparkle x={182} y={70} s={0.6} />
    </>
  ),

  olla: () => (
    <>
      <ellipse cx="110" cy="142" rx="44" ry="6" fill={C.coffeeDark} />
      <Flame x={110} y={142} s={1} />
      <path d="M70 70h80c8 0 14 6 12 14l-6 34c-2 10-10 16-20 16h-52c-10 0-18-6-20-16l-6-34c-2-8 4-14 12-14Z" fill={C.clay} />
      <path d="M150 84c14 0 18 16 6 22" fill="none" stroke={C.clay} strokeWidth={6} />
      <ellipse cx="110" cy="70" rx="40" ry="6" fill={C.coffee} />
      <path d="M78 96c20 6 44 6 64 0" fill="none" strokeWidth={1.6} opacity={0.5} />
      <rect x="168" y="42" width="44" height="8" rx="4" fill={C.wood} transform="rotate(-25 190 46)" />
      <rect x="170" y="54" width="44" height="8" rx="4" fill={C.woodDark} transform="rotate(-25 192 58)" />
      <Steam x={110} y={58} s={0.6} n={2} />
    </>
  ),
};

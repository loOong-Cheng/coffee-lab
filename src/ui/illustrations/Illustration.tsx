/**
 * <Illustration name="bloom" /> — original flat SVG scenes keyed by content
 * (`ExplainActivity.cards[].illustration`, guided-practice step illustrations…).
 * Unknown keys fall back to a friendly generic cup scene, never a broken image.
 * Decorative by default; pass `alt` when the picture carries meaning on its own.
 */
import { useId } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../primitives/util';
import {
  Bean,
  C,
  Carafe,
  Cup,
  Drop,
  Dripper,
  Flame,
  Grinder,
  HandGrinder,
  Kettle,
  Leaf,
  Mug,
  Pitcher,
  Portafilter,
  Scale,
  Scene,
  Shadow,
  Sparkle,
  Steam,
  Tamper,
  WarningSign,
} from './parts';
import { ILLUSTRATION_ALIASES } from './aliases';
import { EXTRA_SCENES } from './scenesExtra';
import type { SceneFn } from './scenesExtra';
import './illustrations.css';


const ROAST = ['#a7b47a', '#c99a5b', '#8a5530', '#3b2116'];

/** Deterministic mound of dots for grind-size piles. */
function pile(cx: number, base: number, r: number, width = 40): ReactNode[] {
  const dots: ReactNode[] = [];
  const step = r * 2.1;
  let row = 0;
  for (let y = base - r; y > base - 26; y -= step * 0.9) {
    const half = (width / 2) * (1 - row / 7);
    for (let x = cx - half; x <= cx + half; x += step) {
      const jitter = ((x * 7 + y * 13) % 5) / 5 - 0.4;
      dots.push(<circle key={`${x}-${y}`} cx={x + jitter} cy={y} r={r} fill={C.coffee} stroke="none" />);
    }
    row += 1;
    if (half < r) break;
  }
  return dots;
}

const SCENES: Record<string, SceneFn> = {
  beans: () => (
    <>
      <Shadow x={120} y={134} w={150} />
      <path d="M50 134c-4-26 0-50 12-62 8-4 44-4 52 0 12 12 14 36 12 62Z" fill={C.wood} />
      <ellipse cx="89" cy="72" rx="27" ry="7" fill={C.coffeeDark} />
      <Bean x={80} y={70} s={0.7} rot={30} />
      <Bean x={97} y={69} s={0.7} rot={-40} />
      <path d="M62 100c18 4 36 4 52 0" fill="none" strokeWidth={2} opacity={0.5} />
      <Bean x={142} y={124} rot={20} />
      <Bean x={160} y={127} rot={-35} />
      <Bean x={178} y={124} rot={60} />
      <Bean x={150} y={108} rot={-10} />
      <Bean x={168} y={110} rot={40} />
      <Bean x={159} y={94} rot={-60} />
      <Leaf x={182} y={60} rot={-25} />
    </>
  ),
  cherry: () => (
    <>
      <path d="M24 38c44 8 96 22 150 74" fill="none" stroke={C.woodDark} strokeWidth={5} />
      <Leaf x={52} y={42} rot={-30} s={1.1} />
      <Leaf x={120} y={64} rot={20} s={1.2} />
      <Leaf x={70} y={46} rot={150} s={0.9} />
      <circle cx="92" cy="64" r="10" fill={C.cherry} />
      <circle cx="106" cy="73" r="10" fill={C.cherry} />
      <circle cx="94" cy="82" r="10" fill={C.cherry} />
      <circle cx="89" cy="60" r="2.5" fill={C.milk} stroke="none" />
      <circle cx="103" cy="69" r="2.5" fill={C.milk} stroke="none" />
      <circle cx="176" cy="112" r="26" fill={C.cherry} />
      <circle cx="176" cy="112" r="19" fill={C.foam} />
      <ellipse cx="169" cy="112" rx="7" ry="12" fill={C.greenBean} />
      <ellipse cx="183" cy="112" rx="7" ry="12" fill={C.greenBean} />
      <path d="M169 103v18M183 103v18" fill="none" strokeWidth={1.6} />
    </>
  ),
  'roast-levels': () => (
    <>
      {ROAST.map((fill, i) => (
        <Bean key={fill} x={48 + i * 48} y={74} s={1.9} rot={-20 + i * 10} fill={fill} />
      ))}
      {ROAST.map((fill, i) => (
        <rect key={`bar-${fill}`} x={30 + i * 45} y={114} width={45} height={12} fill={fill} stroke="none" />
      ))}
      <rect x="30" y="114" width="180" height="12" rx="3" fill="none" />
      <path d="M30 140h174m-8-5 8 5-8 5" fill="none" strokeWidth={2} />
    </>
  ),
  freshness: () => (
    <>
      <Shadow x={95} y={134} w={80} />
      <path d="M60 134V60l10-12h50l10 12v74Z" fill={C.wood} />
      <path d="M60 60h70" fill="none" strokeWidth={2} />
      <circle cx="95" cy="74" r="6" fill={C.steel} />
      <circle cx="95" cy="74" r="2" fill={C.line} stroke="none" />
      <rect x="73" y="90" width="44" height="32" rx="4" fill={C.paper} />
      <Bean x={95} y={106} s={0.8} rot={25} />
      <rect x="140" y="52" width="66" height="72" rx="7" fill={C.milk} />
      <path d="M140 66h66" fill="none" />
      <rect x="140" y="52" width="66" height="14" rx="7" fill={C.cherry} />
      <path d="M156 46v12M190 46v12" fill="none" strokeWidth={3} />
      {[0, 1, 2, 3].flatMap((i) =>
        [0, 1, 2].map((j) => <circle key={`${i}${j}`} cx={152 + i * 14} cy={80 + j * 13} r={2.4} fill={C.steelDark} stroke="none" />),
      )}
      <circle cx="180" cy="93" r="7" fill="none" stroke={C.crema} strokeWidth={3} />
    </>
  ),
  grinder: () => (
    <>
      <Shadow x={120} y={136} w={70} />
      <Grinder x={120} y={136} />
      <path d="M52 136c4-14 28-14 32 0Z" fill={C.coffee} />
      <Bean x={166} y={126} rot={30} />
      <Bean x={182} y={130} rot={-20} />
    </>
  ),
  'grind-sizes': () => (
    <>
      {[4, 3, 2, 1.2].map((r, i) => (
        <g key={r}>{pile(48 + i * 48, 112, r)}</g>
      ))}
      {/* brewer glyphs: press · dripper · moka · espresso */}
      <g strokeWidth={2}>
        <rect x="40" y="30" width="16" height="22" rx="2" fill={C.glass} />
        <path d="M48 30v-6M43 24h10M56 34h4v12h-4" fill="none" />
        <path d="M84 30h24l-8 14h-8Z" fill={C.milk} />
        <path d="M90 48h12" fill="none" />
        <path d="M134 52l-3-12h18l-3 12ZM133 38l3-12h8l3 12Z" fill={C.steel} />
        <path d="M180 38h16l-2 10h-12Z" fill={C.milk} />
        <path d="M196 40c5 0 5 6 0 6" fill="none" />
      </g>
      <path d="M30 134h180m-8-5 8 5-8 5" fill="none" strokeWidth={2} />
    </>
  ),
  scale: () => (
    <>
      <Shadow x={120} y={134} w={130} />
      <Bean x={106} y={84} s={0.8} rot={40} />
      <Bean x={121} y={80} s={0.8} rot={-20} />
      <Bean x={136} y={85} s={0.8} rot={70} />
      <path d="M84 86h72l-8 24h-56Z" fill={C.milk} />
      <Scale x={120} y={134} w={96} s={1.25} text="18.0 g" />
    </>
  ),
  ratio: () => (
    <>
      <path d="M120 132l-14 0 14-40 14 40Z" fill={C.woodDark} />
      <rect x="36" y="86" width="168" height="7" rx="3" fill={C.wood} />
      <path d="M58 93l-12 22M58 93l12 22M182 93l-12 22M182 93l12 22" fill="none" strokeWidth={1.8} />
      <path d="M38 115h40c0 8-8 12-20 12s-20-4-20-12Z" fill={C.steel} />
      <path d="M162 115h40c0 8-8 12-20 12s-20-4-20-12Z" fill={C.steel} />
      <Bean x={52} y={108} s={0.6} rot={30} />
      <Bean x={64} y={108} s={0.6} rot={-30} />
      <Cup x={182} y={114} s={0.55} />
      <circle cx="120" cy="89" r="5" fill={C.crema} />
      <Drop x={182} y={52} s={0.9} />
    </>
  ),
  tamp: () => (
    <>
      <path d="M120 22v22m-7-8 7 9 7-9" fill="none" strokeWidth={2.5} />
      <Portafilter x={100} y={100} s={1.3} grounds />
      <Tamper x={100} y={98} s={0.9} />
      <path d="M36 98h128" fill="none" stroke={C.crema} strokeWidth={2.5} strokeDasharray="5 5" />
      <rect x="176" y="40" width="44" height="14" rx="7" fill={C.water} />
      <circle cx="198" cy="47" r="4" fill={C.milk} strokeWidth={1.6} />
      <path d="M190 40v14M206 40v14" fill="none" strokeWidth={1.4} />
    </>
  ),
  distribution: () => (
    <>
      <circle cx="104" cy="82" r="56" fill={C.steel} />
      <circle cx="104" cy="82" r="46" fill={C.coffee} />
      <path
        d="M104 82c6-4 2-12-6-10-10 2-10 18 2 20 16 2 20-20 8-28-14-10-36 2-34 22 2 22 30 30 46 16"
        fill="none"
        stroke={C.crema}
        strokeWidth={2}
        opacity={0.8}
      />
      <rect x="180" y="26" width="22" height="42" rx="8" fill={C.wood} />
      <path d="M184 68v46M189 68v50M194 68v50M199 68v46" fill="none" strokeWidth={1.3} />
    </>
  ),
  extraction: () => (
    <>
      <path d="M90 20v16m-5-5 5 6 5-6M120 16v20m-5-5 5 6 5-6M150 20v16m-5-5 5 6 5-6" fill="none" stroke={C.flame} strokeWidth={2.2} />
      <path d="M70 42h100l-6 30c-1 6-6 10-12 10h-64c-6 0-11-4-12-10Z" fill={C.steel} />
      <path d="M78 56h84l-3 14H81Z" fill={C.coffee} stroke="none" />
      <path d="M120 84v44" fill="none" stroke={C.coffee} strokeWidth={4} />
      <circle cx="120" cy="96" r="5" fill="#e6c34a" />
      <circle cx="120" cy="110" r="5" fill={C.crema} />
      <circle cx="120" cy="124" r="5" fill={C.coffeeDark} />
      <Cup x={120} y={152} s={0.6} />
      <circle cx="196" cy="58" r="11" fill={C.milk} />
      <path d="M196 52v6l4 3" fill="none" strokeWidth={2} />
      <path d="M196 74v54m-5-6 5 7 5-7" fill="none" strokeWidth={2} />
      <circle cx="184" cy="88" r="4" fill="#e6c34a" strokeWidth={1.6} />
      <circle cx="184" cy="104" r="4" fill={C.crema} strokeWidth={1.6} />
      <circle cx="184" cy="120" r="4" fill={C.coffeeDark} strokeWidth={1.6} />
    </>
  ),
  'under-over': () => (
    <>
      <Cup x={52} y={104} s={0.85} top="#d9b47e" />
      <Cup x={120} y={98} s={1} />
      <Cup x={188} y={104} s={0.85} top="#3b2116" />
      <Sparkle x={146} y={44} s={0.8} />
      <rect x="28" y="124" width="62" height="10" fill="#d9b47e" stroke="none" />
      <rect x="90" y="124" width="60" height="10" fill={C.crema} stroke="none" />
      <rect x="150" y="124" width="62" height="10" fill="#3b2116" stroke="none" />
      <rect x="28" y="124" width="184" height="10" rx="3" fill="none" />
      <path d="M120 140l-6 8h12Z" fill={C.line} />
    </>
  ),
  crema: () => (
    <>
      <circle cx="116" cy="82" r="58" fill={C.milk} />
      <rect x="152" y="74" width="34" height="16" rx="8" fill={C.milk} />
      <circle cx="116" cy="82" r="40" fill={C.milk} />
      <circle cx="116" cy="82" r="34" fill={C.crema} />
      <g fill={C.coffee} stroke="none" opacity={0.55}>
        <ellipse cx="104" cy="70" rx="6" ry="3" transform="rotate(-20 104 70)" />
        <ellipse cx="128" cy="76" rx="5" ry="2.5" />
        <ellipse cx="110" cy="96" rx="7" ry="3" transform="rotate(15 110 96)" />
        <ellipse cx="132" cy="94" rx="4" ry="2" />
        <ellipse cx="96" cy="86" rx="3" ry="2" />
      </g>
      <circle cx="116" cy="82" r="34" fill="none" />
      <path d="M62 120l-22 18" fill="none" stroke={C.steelDark} strokeWidth={4} />
    </>
  ),
  bloom: () => (
    <>
      <path d="M22 30c22-2 40 6 58 22" fill="none" stroke={C.steelDark} strokeWidth={6} />
      <path d="M80 52c6 4 10 8 14 14" fill="none" stroke={C.water} strokeWidth={3} />
      <Dripper x={120} y={142} s={1.6} bed={false} />
      <path d="M78 64q42-26 84 0Z" fill={C.coffee} />
      <circle cx="104" cy="52" r="3.5" fill={C.foam} strokeWidth={1.4} />
      <circle cx="124" cy="46" r="4.5" fill={C.foam} strokeWidth={1.4} />
      <circle cx="140" cy="54" r="3" fill={C.foam} strokeWidth={1.4} />
      <circle cx="132" cy="36" r="2.5" fill="none" strokeWidth={1.4} />
      <circle cx="112" cy="34" r="2" fill="none" strokeWidth={1.4} />
    </>
  ),
  'pour-stages': () => (
    <>
      <circle cx="96" cy="82" r="56" fill={C.milk} />
      <circle cx="96" cy="82" r="45" fill={C.coffee} />
      <path
        d="M96 82m0-5a5 5 0 1 1-5 5 11 11 0 1 1 11 11 18 18 0 1 1-18-18 26 26 0 1 1 26 26 33 33 0 1 1-33-33"
        fill="none"
        stroke={C.water}
        strokeWidth={3}
      />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={196} cy={40 + i * 42} r={14} fill={C.crema} />
          <text x={196} y={45 + i * 42} textAnchor="middle" fontSize="14" fontWeight="700" fill={C.ink} stroke="none">
            {i + 1}
          </text>
        </g>
      ))}
      <path d="M196 54v14M196 96v14" fill="none" strokeWidth={2} strokeDasharray="3 4" />
    </>
  ),
  'kettle-safety': () => (
    <>
      <Shadow x={96} y={134} w={100} />
      <Kettle x={96} y={134} s={1.35} />
      <Steam x={96} y={44} s={1} />
      <path d="M160 108c4-4 4-8 0-12M168 112c6-6 6-14 0-20" fill="none" stroke={C.cherry} strokeWidth={2.5} />
      <WarningSign x={196} y={58} s={1.4} />
    </>
  ),
  'steam-safety': () => (
    <>
      <rect x="10" y="18" width="70" height="120" rx="10" fill={C.machine} />
      <circle cx="66" cy="44" r="8" fill={C.coffeeDark} />
      <path d="M74 50c18 2 24 14 26 30l2 22" fill="none" stroke={C.line} strokeWidth={9} />
      <path d="M74 50c18 2 24 14 26 30l2 22" fill="none" stroke={C.steel} strokeWidth={5} />
      <g fill={C.milk} strokeWidth={2}>
        <circle cx="112" cy="104" r="12" />
        <circle cx="128" cy="96" r="14" />
        <circle cx="146" cy="104" r="11" />
        <circle cx="132" cy="112" r="11" />
      </g>
      <Pitcher x={110} y={150} s={0.6} />
      <WarningSign x={196} y={52} s={1.4} />
    </>
  ),
  'milk-texture': () => (
    <>
      <Shadow x={150} y={136} w={90} />
      <g transform="translate(76 86) rotate(32) scale(-1 1)">
        <Pitcher x={0} y={0} s={0.85} />
      </g>
      <path d="M104 60c12 6 22 16 30 34" fill="none" stroke={C.milk} strokeWidth={5} />
      <path d="M104 60c12 6 22 16 30 34" fill="none" strokeWidth={1.2} />
      <Cup x={150} y={136} s={1.35} art />
      <g fill="none" strokeWidth={1.2}>
        <circle cx="200" cy="40" r="3" />
        <circle cx="208" cy="50" r="2" />
        <circle cx="196" cy="54" r="1.5" />
      </g>
    </>
  ),
  tasting: () => (
    <>
      <Cup x={84} y={130} s={1.25} />
      <Steam x={84} y={84} s={0.8} n={2} />
      <path d="M118 124l30-26" fill="none" stroke={C.steelDark} strokeWidth={3.5} />
      <ellipse cx="153" cy="94" rx="8" ry="5" fill={C.steel} transform="rotate(-40 153 94)" />
      <circle cx="184" cy="40" r="14" fill={C.warn} />
      <path d="M184 26v28M170 40h28M174 30l20 20M194 30l-20 20" fill="none" strokeWidth={1.4} />
      <rect x="188" y="74" width="28" height="22" rx="2" fill={C.coffee} />
      <path d="M197 74v22M207 74v22M188 85h28" fill="none" strokeWidth={1.4} />
      <circle cx="166" cy="70" r="6" fill={C.cherry} />
      <circle cx="160" cy="80" r="6" fill={C.cherry} />
      <circle cx="172" cy="80" r="6" fill={C.cherry} />
      <g transform="translate(198 124)">
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="0" cy="-8" rx="5" ry="8" fill={C.foam} transform={`rotate(${a})`} strokeWidth={1.6} />
        ))}
        <circle r="4" fill={C.crema} strokeWidth={1.6} />
      </g>
    </>
  ),
  water: () => (
    <>
      <Drop x={66} y={88} s={3.4} />
      <path d="M58 74c-6 8-8 16-6 24" fill="none" stroke={C.milk} strokeWidth={4} opacity={0.8} />
      <path d="M132 46h52l-6 86h-40Z" fill={C.glass} />
      <path d="M135.5 74h45l-4 56h-37Z" fill={C.water} stroke="none" opacity={0.75} />
      <path d="M132 46h52l-6 86h-40Z" fill="none" />
      <g stroke="none">
        <circle cx="148" cy="100" r="3" fill={C.crema} />
        <circle cx="164" cy="112" r="2.5" fill={C.steelDark} />
        <circle cx="158" cy="88" r="2" fill={C.crema} />
        <circle cx="168" cy="96" r="2" fill={C.steelDark} />
      </g>
      <rect x="202" y="36" width="12" height="78" rx="6" fill={C.milk} />
      <circle cx="208" cy="120" r="10" fill={C.cherry} />
      <path d="M208 112V64" fill="none" stroke={C.cherry} strokeWidth={4} />
    </>
  ),
  cleaning: () => (
    <>
      <rect x="60" y="20" width="110" height="16" rx="5" fill={C.steelDark} />
      <path d="M74 36h82v18c0 8-6 12-14 12H88c-8 0-14-4-14-12Z" fill={C.steel} />
      <path d="M200 132l-60-52" fill="none" stroke={C.wood} strokeWidth={8} />
      <path d="M200 132l-60-52" fill="none" strokeWidth={1} opacity={0.4} />
      <rect x="120" y="66" width="26" height="14" rx="3" fill={C.coffeeDark} transform="rotate(41 133 73)" />
      <path d="M24 120l30-16 40 8-26 22Z" fill={C.water} />
      <path d="M38 118l38 8M50 112l36 8" fill="none" strokeWidth={1.4} opacity={0.6} />
      <Sparkle x={58} y={70} s={1.1} fill={C.milk} />
      <Sparkle x={190} y={46} s={0.9} fill={C.milk} />
      <Sparkle x={176} y={70} s={0.6} fill={C.milk} />
    </>
  ),
  'world-map': (uid) => (
    <>
      <defs>
        <clipPath id={`${uid}-globe`}>
          <circle cx="120" cy="80" r="60" />
        </clipPath>
      </defs>
      <circle cx="120" cy="80" r="60" fill={C.water} />
      <g clipPath={`url(#${uid}-globe)`} stroke="none">
        <rect x="56" y="64" width="128" height="34" fill={C.crema} opacity={0.45} />
        <path d="M60 36c14-6 30 0 34 14 2 10-8 14-6 24 4 14 14 22 10 38-2 10-12 18-18 26l-20-6c4-12-2-24-6-38-4-14-6-40 6-58Z" fill={C.leaf} />
        <path d="M112 32c12-6 26-4 30 6-2 8-12 8-14 14 6 4 18 4 22 14 4 12-4 26-14 40-6 8-10 14-16 12-4-10 0-22-6-30-8-10-14-20-12-32 2-10 6-20 10-24Z" fill={C.leaf} />
        <path d="M150 34c16-4 32 4 36 18-6 10-18 6-22 16 2 8 12 10 12 20 0 6-6 10-12 8-6-6-14-10-16-20-2-14-4-32 2-42Z" fill={C.leaf} />
      </g>
      <path d="M60 80h120" fill="none" strokeWidth={1.5} strokeDasharray="4 5" opacity={0.6} />
      <circle cx="120" cy="80" r="60" fill="none" />
      {[
        [130, 72],
        [80, 82],
        [168, 86],
      ].map(([x, y]) => (
        <g key={`${x}`} transform={`translate(${x} ${y})`}>
          <path d="M0 0c-6-8-8-12-8-16a8 8 0 0 1 16 0c0 4-2 8-8 16Z" fill={C.cherry} strokeWidth={2} />
          <circle cx="0" cy="-16" r="2.6" fill={C.milk} stroke="none" />
        </g>
      ))}
    </>
  ),
  coffeehouse: () => (
    <>
      <rect x="40" y="36" width="160" height="104" fill={C.paper} />
      <rect x="34" y="26" width="172" height="14" rx="3" fill={C.woodDark} />
      <path
        d="M40 40h160v16c-10 0-10 8-20 8s-10-8-20-8-10 8-20 8-10-8-20-8-10 8-20 8-10-8-20-8-10 8-20 8-10-8-20-8Z"
        fill={C.cherry}
      />
      <path d="M60 40v16M80 40v16M100 40v16M120 40v16M140 40v16M160 40v16M180 40v16" fill="none" stroke={C.milk} strokeWidth={6} />
      <path d="M40 40h160" fill="none" />
      <rect x="54" y="74" width="70" height="48" rx="4" fill={C.glass} />
      <path d="M89 74v48M54 98h70" fill="none" strokeWidth={1.6} />
      <rect x="140" y="74" width="42" height="66" rx="3" fill={C.wood} />
      <circle cx="174" cy="108" r="2.5" fill={C.line} stroke="none" />
      <Cup x={72} y={118} s={0.42} />
      <Steam x={72} y={100} s={0.4} n={2} />
      <path d="M30 140h180" fill="none" />
    </>
  ),
  'espresso-bar': () => (
    <>
      <rect x="22" y="22" width="64" height="44" rx="4" fill={C.coffeeDark} />
      <path d="M32 34h34M32 44h44M32 54h26" fill="none" stroke={C.milk} strokeWidth={2} opacity={0.85} />
      <rect x="118" y="40" width="88" height="62" rx="8" fill={C.machine} />
      <rect x="118" y="34" width="88" height="8" rx="3" fill={C.steel} />
      <path d="M150 64h24v10c0 4-4 7-8 7h-8c-4 0-8-3-8-7Z" fill={C.steel} />
      <circle cx="194" cy="56" r="6" fill={C.milk} />
      <rect x="10" y="102" width="220" height="12" rx="3" fill={C.woodDark} />
      <rect x="18" y="114" width="204" height="30" fill={C.wood} />
      <Cup x={52} y={102} s={0.55} />
      <Cup x={86} y={102} s={0.55} />
      <Steam x={52} y={78} s={0.5} n={2} />
    </>
  ),
  ceremony: () => (
    <>
      <path d="M40 132c-2-4-1-6 4-6h12c5 0 6 2 4 6Z" fill={C.clay} />
      <path d="M50 124c-6-10 6-16 0-28s6-18 2-30" fill="none" stroke={C.steelDark} strokeWidth={2} opacity={0.6} />
      <path d="M92 60c-26 4-30 34-18 48" fill="none" stroke={C.line} strokeWidth={8} />
      <path d="M92 60c-26 4-30 34-18 48" fill="none" stroke={C.clay} strokeWidth={4} />
      <path d="M118 104c10-4 16-12 22-24" fill="none" stroke={C.line} strokeWidth={8} />
      <path d="M118 104c10-4 16-12 22-24" fill="none" stroke={C.clay} strokeWidth={4} />
      <path d="M96 78l-3-36h14l-3 36Z" fill={C.clay} />
      <ellipse cx="100" cy="42" rx="9" ry="3" fill={C.coffeeDark} />
      <circle cx="100" cy="106" r="28" fill={C.clay} />
      <path d="M76 98c14 6 34 6 48 0" fill="none" strokeWidth={1.6} opacity={0.5} />
      <ellipse cx="176" cy="134" rx="42" ry="7" fill={C.wood} />
      {[152, 176, 200].map((x) => (
        <g key={x}>
          <path d={`M${x - 10} 116h20l-3 14h-14Z`} fill={C.milk} />
          <ellipse cx={x} cy={116} rx="10" ry="2.5" fill={C.coffee} />
        </g>
      ))}
      <path d="M20 140c4-8 6-8 8 0M30 140c3-10 6-10 8 0M200 146c3-8 6-8 8 0M214 146c4-6 6-6 8 0" fill="none" stroke={C.leaf} strokeWidth={2.4} />
    </>
  ),
  moka: () => (
    <>
      <ellipse cx="120" cy="140" rx="46" ry="7" fill={C.coffeeDark} />
      <Flame x={120} y={140} s={1.2} />
      <path d="M98 52c-20 0-24 32-8 36" fill="none" stroke={C.coffeeDark} strokeWidth={7} />
      <path d="M96 128l-8-42h64l-8 42Z" fill={C.steel} />
      <rect x="86" y="80" width="68" height="8" rx="2" fill={C.steelDark} />
      <path d="M94 80l8-40h36l8 40Z" fill={C.steel} />
      <path d="M100 40c4-10 36-10 40 0Z" fill={C.steelDark} />
      <circle cx="120" cy="30" r="3.5" fill={C.coffeeDark} />
      <path d="M140 42l14-6" fill="none" strokeWidth={3} />
      <path d="M106 86v42M134 86v42M114 44l-2 34M126 44l2 34" fill="none" strokeWidth={1.3} opacity={0.4} />
      <Steam x={160} y={30} s={0.55} n={2} />
    </>
  ),
  'french-press': () => (
    <>
      <Shadow x={118} y={132} w={90} />
      <path d="M144 58h14v52h-14" fill="none" stroke={C.steelDark} strokeWidth={6} />
      <rect x="90" y="48" width="54" height="80" rx="4" fill={C.glass} />
      <rect x="92" y="72" width="50" height="54" rx="2" fill={C.coffee} stroke="none" />
      <rect x="90" y="48" width="54" height="80" rx="4" fill="none" />
      <path d="M92 70h50" fill="none" strokeWidth={3} />
      <rect x="86" y="40" width="62" height="10" rx="3" fill={C.steel} />
      <path d="M117 40V20" fill="none" strokeWidth={3} />
      <circle cx="117" cy="16" r="6" fill={C.coffeeDark} />
      <rect x="86" y="124" width="62" height="8" rx="3" fill={C.steelDark} />
      <Mug x={192} y={132} s={0.75} />
    </>
  ),
  aeropress: () => (
    <>
      <Shadow x={120} y={136} w={80} />
      <Mug x={120} y={136} s={1.15} />
      <rect x="100" y="10" width="40" height="44" rx="3" fill={C.coffeeDark} />
      <rect x="96" y="36" width="48" height="44" rx="3" fill={C.glass} />
      <rect x="98" y="56" width="44" height="22" fill={C.coffee} stroke="none" />
      <rect x="96" y="36" width="48" height="44" rx="3" fill="none" />
      <rect x="86" y="78" width="68" height="7" rx="3" fill={C.coffeeDark} />
      <path d="M100 46h40" fill="none" strokeWidth={3} />
      <path d="M104 64h6M104 70h6" fill="none" stroke={C.milk} strokeWidth={1.4} />
    </>
  ),
  'cold-brew': () => (
    <>
      <Shadow x={104} y={138} w={90} />
      <path d="M68 52h72v76c0 6-4 10-10 10H78c-6 0-10-4-10-10Z" fill={C.glass} />
      <path d="M70.5 70h67v58c0 5-3 8-8 8h-51c-5 0-8-3-8-8Z" fill={C.coffee} stroke="none" />
      <path d="M70.5 118h67v10c0 5-3 8-8 8h-51c-5 0-8-3-8-8Z" fill={C.coffeeDark} stroke="none" />
      <path d="M68 52h72v76c0 6-4 10-10 10H78c-6 0-10-4-10-10Z" fill="none" />
      <rect x="64" y="40" width="80" height="14" rx="4" fill={C.steelDark} />
      <path d="M162 74h44l-5 62h-34Z" fill={C.glass} />
      <path d="M164.5 94h39l-3.5 41h-32Z" fill={C.coffee} stroke="none" opacity={0.9} />
      <rect x="168" y="82" width="15" height="15" rx="3" fill={C.ice} transform="rotate(-12 175 89)" />
      <rect x="184" y="90" width="14" height="14" rx="3" fill={C.ice} transform="rotate(16 191 97)" />
      <path d="M162 74h44l-5 62h-34Z" fill="none" />
      <circle cx="198" cy="34" r="14" fill={C.milk} />
      <path d="M198 26v8l6 4" fill="none" strokeWidth={2} />
    </>
  ),
  phin: () => (
    <>
      <Shadow x={120} y={138} w={80} />
      <path d="M90 74h60l-5 64h-50Z" fill={C.glass} />
      <path d="M93 116h54l-2 20h-50Z" fill={C.foam} stroke="none" />
      <path d="M91.7 92h56.6l-1.7 24h-53.2Z" fill={C.coffee} stroke="none" />
      <path d="M90 74h60l-5 64h-50Z" fill="none" />
      <ellipse cx="120" cy="70" rx="36" ry="5" fill={C.steelDark} />
      <path d="M98 44h44l-4 24h-36Z" fill={C.steel} />
      <path d="M100 44c0-10 40-10 40 0Z" fill={C.steel} />
      <circle cx="120" cy="34" r="3" fill={C.steelDark} />
      <Drop x={120} y={84} s={0.35} fill={C.coffee} />
    </>
  ),
  ibrik: () => (
    <>
      <path d="M40 142c22-18 140-18 162 0Z" fill={C.wood} />
      <path d="M140 92l66-30" fill="none" stroke={C.woodDark} strokeWidth={8} />
      <path d="M94 88h48l-4 36c-1 6-6 8-12 8h-16c-6 0-11-2-12-8Z" fill={C.clay} />
      <path d="M88 82h60l-6 8h-48Z" fill={C.crema} />
      <ellipse cx="118" cy="82" rx="28" ry="5" fill={C.crema} />
      <circle cx="110" cy="80" r="2" fill="none" strokeWidth={1.2} />
      <circle cx="124" cy="81" r="1.5" fill="none" strokeWidth={1.2} />
      <Steam x={118} y={68} s={0.6} n={2} />
      <path d="M44 128c-1-4 1-6 4-6h14c3 0 5 2 4 6l-2 6H46Z" fill={C.milk} />
      <ellipse cx="55" cy="122" rx="11" ry="2.5" fill={C.coffee} />
    </>
  ),
  siphon: () => (
    <>
      <rect x="78" y="130" width="84" height="8" rx="3" fill={C.coffeeDark} />
      <path d="M164 134V28M164 50h-24" fill="none" stroke={C.steelDark} strokeWidth={5} />
      <Flame x={120} y={130} s={0.8} />
      <path d="M100 22h40l-6 36c-1 4-4 6-8 6h-12c-4 0-7-2-8-6Z" fill={C.glass} />
      <path d="M102.5 36h35l-4 22c-1 3-3 4-6 4h-15c-3 0-5-1-6-4Z" fill={C.coffee} stroke="none" />
      <path d="M100 22h40l-6 36c-1 4-4 6-8 6h-12c-4 0-7-2-8-6Z" fill="none" />
      <path d="M120 64v30" fill="none" stroke={C.steelDark} strokeWidth={3} />
      <circle cx="120" cy="100" r="20" fill={C.glass} />
      <path d="M102 106a18 18 0 0 0 36 0Z" fill={C.water} stroke="none" opacity={0.8} />
      <circle cx="120" cy="100" r="20" fill="none" />
    </>
  ),
  chemex: () => (
    <>
      <Shadow x={120} y={138} w={90} />
      <path d="M86 26h68l-24 48 26 46c4 8-2 16-10 16H94c-8 0-14-8-10-16l26-46Z" fill={C.glass} />
      <path d="M99 100h42l13 22c3 6-1 12-7 12H93c-6 0-10-6-7-12Z" fill={C.coffee} stroke="none" />
      <path d="M86 26h68l-24 48 26 46c4 8-2 16-10 16H94c-8 0-14-8-10-16l26-46Z" fill="none" />
      <path d="M88 24h64l-32 44Z" fill={C.paper} />
      <path d="M104 64h32l-4 18h-24Z" fill={C.wood} />
      <path d="M120 82v12" fill="none" strokeWidth={2} />
      <circle cx="120" cy="97" r="3" fill={C.woodDark} />
    </>
  ),
  cup: () => (
    <>
      <Cup x={120} y={130} s={1.8} art />
      <Steam x={120} y={68} s={1} />
      <path d="M170 130l26-8" fill="none" stroke={C.steelDark} strokeWidth={3.5} />
    </>
  ),
  /** Extra common keys */
  'espresso-machine': () => (
    <>
      <Shadow x={120} y={134} w={150} />
      <rect x="54" y="30" width="132" height="98" rx="12" fill={C.machine} />
      <rect x="54" y="24" width="132" height="8" rx="3" fill={C.steel} />
      <rect x="66" y="40" width="108" height="22" rx="6" fill={C.steel} />
      <circle cx="150" cy="51" r="8" fill={C.milk} />
      <circle cx="82" cy="51" r="5" fill={C.coffeeDark} />
      <Portafilter x={110} y={74} s={0.8} />
      <rect x="80" y="118" width="80" height="12" rx="3" fill={C.steel} />
      <Scale x={110} y={119} w={56} s={0.8} text="36.0" />
      <Cup x={110} y={104} s={0.42} />
      <path d="M186 60c10 2 14 10 14 20v24" fill="none" stroke={C.steelDark} strokeWidth={5} />
    </>
  ),
  pourover: () => (
    <>
      <Shadow x={120} y={142} w={120} />
      <Scale x={120} y={142} w={100} text="250 g" />
      <Carafe x={120} y={124} s={0.95} />
      <Dripper x={120} y={72} s={0.85} />
      <Kettle x={44} y={84} s={0.7} pour />
      <path d="M91 45c8 2 14 5 20 10" fill="none" stroke={C.water} strokeWidth={2.5} />
    </>
  ),
  'hand-grinder': () => (
    <>
      <Shadow x={120} y={136} w={60} />
      <HandGrinder x={120} y={136} s={1.15} />
      <Bean x={168} y={128} rot={30} />
      <Bean x={182} y={131} rot={-20} />
    </>
  ),
  latte: () => (
    <>
      <circle cx="116" cy="82" r="58" fill={C.milk} />
      <rect x="152" y="74" width="36" height="16" rx="8" fill={C.milk} />
      <circle cx="116" cy="82" r="42" fill={C.milk} />
      <circle cx="116" cy="82" r="36" fill={C.crema} />
      <path d="M116 104c-22-14-24-30-12-32 6-1 10 3 12 8 2-5 6-9 12-8 12 2 10 18-12 32Z" fill={C.foam} strokeWidth={1.6} />
      <path d="M116 104v-24" fill="none" stroke={C.crema} strokeWidth={2} />
      <circle cx="116" cy="82" r="36" fill="none" />
      <path d="M60 122l-20 16" fill="none" stroke={C.steelDark} strokeWidth={4} />
    </>
  ),
};

const ALL_SCENES: Record<string, SceneFn> = { ...SCENES, ...EXTRA_SCENES };

/** Every drawn scene key (aliases resolve to one of these). */
export const ILLUSTRATION_KEYS = Object.keys(ALL_SCENES).sort();

export function normalizeIllustrationKey(name: string | undefined | null): string {
  return (name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-');
}

/** Canonical scene key for a content key, or null when it would use the fallback. */
export function resolveIllustration(name: string | undefined | null): string | null {
  const k = normalizeIllustrationKey(name);
  if (ALL_SCENES[k]) return k;
  const alias = ILLUSTRATION_ALIASES[k];
  if (alias && ALL_SCENES[alias]) return alias;
  return null;
}

export function hasIllustration(name: string | undefined | null): boolean {
  return resolveIllustration(name) !== null;
}

const fallback: SceneFn = () => (
  <>
    <Cup x={104} y={128} s={1.5} />
    <Steam x={104} y={74} s={0.9} />
    <Bean x={170} y={112} rot={30} />
    <Bean x={186} y={124} rot={-25} />
    <Bean x={160} y={128} rot={70} />
    <Sparkle x={58} y={46} s={0.9} />
    <Sparkle x={182} y={56} s={0.6} />
  </>
);

export interface IllustrationProps {
  /** Content illustration key, e.g. "bloom", "world-map". Unknown keys render a generic scene. */
  name?: string | null;
  /** Accessible description; omit when decorative (adjacent text already says it). */
  alt?: string;
  className?: string;
}

export function Illustration({ name, alt, className }: IllustrationProps) {
  const uid = `cl-ill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const key = resolveIllustration(name);
  const draw = key ? ALL_SCENES[key]! : fallback;
  return (
    <div className={cx('cl-ill', className)} data-illustration={key ?? 'fallback'}>
      <Scene label={alt}>{draw(uid)}</Scene>
    </div>
  );
}

import { useId } from 'react';
import type { DiagramPartId, LocalizedText } from '../../domain/contracts';
import { C } from './parts';
import { StationDiagram } from './StationDiagram';
import type { DiagramProps, PartSpec } from './StationDiagram';

type PourOverPart = DiagramPartId<'pourover-station'>;

export const POUROVER_PART_LABELS: Record<PourOverPart, LocalizedText> = {
  'gooseneck-kettle': { zh: '细口壶', en: 'Gooseneck kettle' },
  dripper: { zh: '滤杯', en: 'Dripper' },
  'paper-filter': { zh: '滤纸', en: 'Paper filter' },
  carafe: { zh: '分享壶', en: 'Carafe' },
  scale: { zh: '电子秤', en: 'Scale' },
  grinder: { zh: '磨豆机', en: 'Grinder' },
  'coffee-beans': { zh: '咖啡豆', en: 'Coffee beans' },
  timer: { zh: '计时器', en: 'Timer' },
};

export const POUROVER_VIEWBOX = { width: 800, height: 540 } as const;

export const POUROVER_PINS: ReadonlyArray<PartSpec<PourOverPart>> = [
  { id: 'gooseneck-kettle', pin: [125, 265], side: 'right' },
  { id: 'timer', pin: [130, 497], anchor: [130, 440], side: 'right' },
  { id: 'paper-filter', pin: [290, 110], anchor: [336, 180], side: 'left' },
  { id: 'carafe', pin: [290, 360], anchor: [352, 372], side: 'left' },
  { id: 'scale', pin: [290, 497], anchor: [330, 441], side: 'right' },
  { id: 'dripper', pin: [510, 230], anchor: [462, 220], side: 'right' },
  { id: 'coffee-beans', pin: [570, 395], side: 'bottom' },
  { id: 'grinder', pin: [630, 190], anchor: [688, 262], side: 'left' },
];

const TITLE = { zh: '手冲咖啡工作台示意图', en: 'Pour-over station diagram' };

const CARAFE = 'M352 296h96c4 18 12 46 12 74 0 34-14 60-40 60h-40c-26 0-40-26-40-60 0-28 8-56 12-74Z';

export function PourOverStationDiagram(props: DiagramProps<PourOverPart>) {
  const clipId = `cl-carafe-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <StationDiagram<PourOverPart>
      {...props}
      diagramId="pourover-station"
      width={POUROVER_VIEWBOX.width}
      height={POUROVER_VIEWBOX.height}
      parts={POUROVER_PINS}
      defaultLabels={POUROVER_PART_LABELS}
      defaultTitle={TITLE}
      art={(part) => (
        <g stroke={C.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <clipPath id={clipId}>
              <path d={CARAFE} />
            </clipPath>
          </defs>
          {/* backdrop */}
          <g stroke="none">
            <rect x="0" y="0" width="800" height="540" rx="24" fill={C.plate} />
            <path d="M0 452h800v64a24 24 0 0 1-24 24H24a24 24 0 0 1-24-24Z" fill={C.woodDark} />
            <rect x="0" y="446" width="800" height="14" fill={C.wood} />
            <rect x="540" y="96" width="220" height="8" rx="3" fill={C.woodDark} />
          </g>
          {/* shelf mugs */}
          <g strokeWidth={3}>
            <path d="M598 58h6a8 8 0 0 1 0 16h-6" fill="none" />
            <rect x="566" y="52" width="34" height="44" rx="7" fill={C.milk} />
            <path d="M656 64h6a8 8 0 0 1 0 16h-6" fill="none" />
            <rect x="624" y="58" width="34" height="38" rx="7" fill={C.crema} />
            <path d="M700 96l6-30h28l6 30Z" fill={C.clay} />
            <path d="M720 66c-6-14-18-18-24-16 2 10 12 16 24 16Zm0 0c4-14 16-20 24-18-2 10-12 18-24 18Z" fill={C.leaf} strokeWidth={2.5} />
          </g>

          {/* timer */}
          <g {...part('timer')}>
            <ellipse cx="130" cy="452" rx="44" ry="5" fill={C.shadow} stroke="none" />
            <rect x="92" y="386" width="76" height="62" rx="12" fill={C.milk} />
            <rect x="102" y="398" width="56" height="26" rx="4" fill={C.ink} stroke="none" />
            <text x="130" y="417" textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="ui-monospace, Consolas, monospace" fill="#9be38f" stroke="none">
              2:30
            </text>
            <circle cx="114" cy="436" r="4" fill={C.crema} strokeWidth={2} />
            <circle cx="146" cy="436" r="4" fill={C.coffee} strokeWidth={2} />
          </g>

          {/* gooseneck kettle, mid-pour */}
          <g {...part('gooseneck-kettle')}>
            <path d="M74 232c-36 0-40 78-4 84" fill="none" stroke={C.line} strokeWidth={16} />
            <path d="M74 232c-36 0-40 78-4 84" fill="none" stroke={C.coffeeDark} strokeWidth={9} />
            <path d="M193 304c40 6 40-30 56-70s30-54 60-60" fill="none" stroke={C.line} strokeWidth={15} />
            <path d="M193 304c40 6 40-30 56-70s30-54 60-60" fill="none" stroke={C.steelDark} strokeWidth={8} />
            <path d="M76 222h108l14 98c2 10-4 14-12 14H74c-8 0-14-4-12-14Z" fill={C.steel} />
            <path d="M96 222c0-20 14-28 34-28s34 8 34 28Z" fill={C.steelDark} />
            <circle cx="130" cy="186" r="8" fill={C.coffeeDark} />
            <rect x="70" y="288" width="126" height="10" fill={C.steelDark} stroke="none" opacity={0.35} />
          </g>
          {/* water stream (illustrative) */}
          <path d="M312 176c30 4 58 22 84 52" fill="none" stroke={C.water} strokeWidth={5} />

          {/* paper filter (edge visible above dripper) */}
          <g {...part('paper-filter')}>
            <path d="M316 190l10-16h148l10 16Z" fill={C.paper} />
            <path d="M360 174l-6 16M440 174l6 16" fill="none" strokeWidth={2} opacity={0.5} />
          </g>

          {/* dripper */}
          <g {...part('dripper')}>
            <path d="M320 192h160l-52 78h-56Z" fill={C.milk} />
            <ellipse cx="400" cy="198" rx="70" ry="6" fill={C.coffee} strokeWidth={2.5} />
            <path d="M362 214l20 40M438 214l-20 40" fill="none" strokeWidth={2.5} opacity={0.45} />
            <rect x="352" y="270" width="96" height="14" rx="5" fill={C.milk} />
          </g>
          <path d="M400 286v84" fill="none" stroke={C.coffee} strokeWidth={4} strokeDasharray="10 10" />

          {/* carafe */}
          <g {...part('carafe')}>
            <path d={CARAFE} fill={C.glass} />
            <rect x="330" y="372" width="140" height="70" fill={C.coffee} stroke="none" clipPath={`url(#${clipId})`} />
            <path d={CARAFE} fill="none" />
            <path d="M372 312v40" fill="none" stroke={C.milk} strokeWidth={6} opacity={0.7} />
          </g>

          {/* scale */}
          <g {...part('scale')}>
            <rect x="298" y="428" width="204" height="22" rx="6" fill={C.coffeeDark} />
            <rect x="434" y="433" width="56" height="12" rx="2" fill={C.ink} stroke="none" />
            <text x="462" y="443" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="ui-monospace, Consolas, monospace" fill="#9be38f" stroke="none">
              250.0
            </text>
          </g>

          {/* coffee beans (bag + a few spilled) */}
          <g {...part('coffee-beans')}>
            <ellipse cx="575" cy="452" rx="50" ry="5" fill={C.shadow} stroke="none" />
            <path d="M534 334l10-14h52l10 14v112c0 3-2 5-5 5h-62c-3 0-5-2-5-5Z" fill={C.wood} />
            <path d="M534 334h72" fill="none" strokeWidth={3} />
            <rect x="548" y="364" width="44" height="42" rx="5" fill={C.paper} />
            <ellipse cx="570" cy="385" rx="8" ry="11" fill={C.coffee} strokeWidth={2.5} transform="rotate(25 570 385)" />
            <ellipse cx="626" cy="444" rx="6" ry="8" fill={C.coffee} strokeWidth={2.5} transform="rotate(70 626 444)" />
            <ellipse cx="642" cy="446" rx="6" ry="8" fill={C.coffee} strokeWidth={2.5} transform="rotate(-50 642 446)" />
          </g>

          {/* hand grinder */}
          <g {...part('grinder')}>
            <ellipse cx="705" cy="452" rx="38" ry="5" fill={C.shadow} stroke="none" />
            <path d="M705 228v-26h46v-14" fill="none" strokeWidth={7} />
            <ellipse cx="751" cy="178" rx="9" ry="12" fill={C.wood} />
            <rect x="680" y="232" width="50" height="216" rx="10" fill={C.steel} />
            <rect x="676" y="224" width="58" height="14" rx="4" fill={C.steelDark} />
            <rect x="680" y="372" width="50" height="34" fill={C.wood} />
            <path d="M692 260v90" fill="none" stroke={C.milk} strokeWidth={5} opacity={0.6} />
          </g>
        </g>
      )}
    />
  );
}

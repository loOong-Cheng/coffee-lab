import type { DiagramPartId, LocalizedText } from '../../domain/contracts';
import { C } from './parts';
import { StationDiagram } from './StationDiagram';
import type { DiagramProps, PartSpec } from './StationDiagram';

type EspressoPart = DiagramPartId<'espresso-station'>;

export const ESPRESSO_PART_LABELS: Record<EspressoPart, LocalizedText> = {
  'espresso-machine': { zh: '意式咖啡机', en: 'Espresso machine' },
  'group-head': { zh: '冲煮头', en: 'Group head' },
  portafilter: { zh: '冲煮手柄', en: 'Portafilter' },
  basket: { zh: '粉碗', en: 'Filter basket' },
  tamper: { zh: '压粉器', en: 'Tamper' },
  grinder: { zh: '磨豆机', en: 'Grinder' },
  scale: { zh: '电子秤', en: 'Scale' },
  cup: { zh: '咖啡杯', en: 'Cup' },
  'steam-wand': { zh: '蒸汽棒', en: 'Steam wand' },
  'drip-tray': { zh: '接水盘', en: 'Drip tray' },
};

export const ESPRESSO_VIEWBOX = { width: 800, height: 540 } as const;

/** Pin layout (viewBox units), ordered left→right for a natural Tab order. Pins are ≥104 units apart (≥44px at 340px wide). */
export const ESPRESSO_PINS: ReadonlyArray<PartSpec<EspressoPart>> = [
  { id: 'grinder', pin: [95, 250], side: 'right' },
  { id: 'tamper', pin: [200, 300], anchor: [200, 368], side: 'right' },
  { id: 'espresso-machine', pin: [295, 150], side: 'right' },
  { id: 'group-head', pin: [400, 292], anchor: [400, 240], side: 'right' },
  { id: 'cup', pin: [510, 365], anchor: [432, 366], side: 'right' },
  { id: 'scale', pin: [330, 497], anchor: [362, 404], side: 'left' },
  { id: 'drip-tray', pin: [470, 497], anchor: [482, 434], side: 'right' },
  { id: 'steam-wand', pin: [640, 200], anchor: [586, 252], side: 'right' },
  { id: 'basket', pin: [760, 300], anchor: [716, 306], side: 'left' },
  { id: 'portafilter', pin: [640, 497], anchor: [662, 438], side: 'right' },
];

const TITLE = { zh: '意式咖啡工作台示意图', en: 'Espresso station diagram' };

export function EspressoStationDiagram(props: DiagramProps<EspressoPart>) {
  return (
    <StationDiagram<EspressoPart>
      {...props}
      diagramId="espresso-station"
      width={ESPRESSO_VIEWBOX.width}
      height={ESPRESSO_VIEWBOX.height}
      parts={ESPRESSO_PINS}
      defaultLabels={ESPRESSO_PART_LABELS}
      defaultTitle={TITLE}
      art={(part) => (
        <g stroke={C.line} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
          {/* backdrop: wall, shelf, counter */}
          <g stroke="none">
            <rect x="0" y="0" width="800" height="540" rx="24" fill={C.plate} />
            <path d="M0 452h800v64a24 24 0 0 1-24 24H24a24 24 0 0 1-24-24Z" fill={C.woodDark} />
            <rect x="0" y="446" width="800" height="14" fill={C.wood} />
            <rect x="610" y="78" width="170" height="8" rx="3" fill={C.woodDark} />
          </g>
          {/* shelf decor: jar of beans + small plant */}
          <g>
            <rect x="630" y="34" width="42" height="44" rx="8" fill={C.glass} />
            <circle cx="642" cy="62" r="5" fill={C.coffee} strokeWidth={2} />
            <circle cx="656" cy="66" r="5" fill={C.coffee} strokeWidth={2} />
            <circle cx="650" cy="54" r="5" fill={C.coffee} strokeWidth={2} />
            <path d="M716 78l4-26h32l4 26Z" fill={C.clay} />
            <path d="M736 52c-4-14-16-20-22-18 2 10 10 16 22 18Zm0 0c4-16 14-22 22-20-2 10-10 18-22 20Z" fill={C.leaf} strokeWidth={2.5} />
          </g>

          {/* grinder */}
          <g {...part('grinder')}>
            <ellipse cx="95" cy="452" rx="58" ry="6" fill={C.shadow} stroke="none" />
            <path d="M48 72h94l-20 88H68Z" fill={C.glass} />
            <g strokeWidth={2.5}>
              <ellipse cx="80" cy="140" rx="8" ry="11" fill={C.coffee} transform="rotate(30 80 140)" />
              <ellipse cx="100" cy="146" rx="8" ry="11" fill={C.coffee} transform="rotate(-40 100 146)" />
              <ellipse cx="112" cy="126" rx="8" ry="11" fill={C.coffee} transform="rotate(70 112 126)" />
              <ellipse cx="90" cy="120" rx="8" ry="11" fill={C.coffee} transform="rotate(-10 90 120)" />
            </g>
            <rect x="40" y="58" width="110" height="16" rx="6" fill={C.coffeeDark} />
            <rect x="60" y="160" width="70" height="214" rx="12" fill={C.coffeeDark} />
            <circle cx="95" cy="200" r="17" fill={C.steel} />
            <path d="M95 200l8-9" fill="none" strokeWidth={3} />
            <rect x="86" y="296" width="18" height="22" rx="3" fill={C.steelDark} />
            <path d="M80 334h30v22a6 6 0 0 1-6 6H86a6 6 0 0 1-6-6Z" fill={C.steel} />
            <rect x="44" y="372" width="102" height="78" rx="12" fill={C.coffeeDark} />
          </g>

          {/* tamper */}
          <g {...part('tamper')}>
            <ellipse cx="200" cy="452" rx="34" ry="5" fill={C.shadow} stroke="none" />
            <rect x="193" y="402" width="14" height="30" fill={C.steelDark} />
            <path d="M180 405c-10-28 2-62 20-62s30 34 20 62Z" fill={C.wood} />
            <rect x="170" y="430" width="60" height="18" rx="4" fill={C.steel} />
          </g>

          {/* espresso machine body */}
          <g {...part('espresso-machine')}>
            <ellipse cx="400" cy="452" rx="170" ry="8" fill={C.shadow} stroke="none" />
            <rect x="255" y="86" width="290" height="12" rx="4" fill={C.steel} />
            <path d="M318 86v-18h26v18M362 86v-18h26v18" fill={C.milk} strokeWidth={3} />
            <rect x="245" y="98" width="310" height="316" rx="18" fill={C.machine} />
            <path d="M515 98h22a18 18 0 0 1 18 18v280a18 18 0 0 1-18 18h-22Z" fill={C.machineDark} />
            <rect x="263" y="116" width="240" height="70" rx="12" fill={C.steel} />
            <circle cx="290" cy="151" r="16" fill={C.coffeeDark} />
            <path d="M285 146c4 4-3 8 1 12" fill="none" stroke={C.crema} strokeWidth={3} />
            <circle cx="350" cy="151" r="10" fill={C.coffeeDark} />
            <circle cx="384" cy="151" r="10" fill={C.coffeeDark} />
            <circle cx="458" cy="151" r="25" fill={C.milk} />
            <path d="M458 151l12-12" fill="none" strokeWidth={3.5} />
            <path d="M440 158h4M472 158h4M458 131v4" fill="none" strokeWidth={2.5} />
            <path d="M263 300h240" fill="none" stroke={C.machineDark} strokeWidth={3} />
          </g>

          {/* group head */}
          <g {...part('group-head')}>
            <rect x="348" y="194" width="104" height="16" rx="5" fill={C.steelDark} />
            <path d="M360 208h80v20c0 10-8 16-18 16h-44c-10 0-18-6-18-16Z" fill={C.steel} />
            <path d="M372 236h56" fill="none" strokeWidth={2.5} strokeDasharray="2 6" />
          </g>

          {/* steam wand */}
          <g {...part('steam-wand')}>
            <path d="M548 206c26 2 36 18 36 44l2 112" fill="none" stroke={C.line} strokeWidth={14} />
            <path d="M548 206c26 2 36 18 36 44l2 112" fill="none" stroke={C.steel} strokeWidth={8} />
            <rect x="579" y="358" width="14" height="18" rx="3" fill={C.steelDark} />
            <circle cx="545" cy="196" r="14" fill={C.coffeeDark} />
            <path d="M545 182v-10" fill="none" strokeWidth={5} />
          </g>

          {/* drip tray */}
          <g {...part('drip-tray')}>
            <rect x="290" y="412" width="220" height="38" rx="8" fill={C.steel} />
            <path d="M318 422v18M346 422v18M374 422v18M426 422v18M454 422v18M482 422v18" fill="none" strokeWidth={3} opacity={0.6} />
          </g>

          {/* scale */}
          <g {...part('scale')}>
            <rect x="346" y="394" width="108" height="20" rx="5" fill={C.coffeeDark} />
            <rect x="378" y="398" width="44" height="12" rx="2" fill={C.ink} stroke="none" />
            <text x="400" y="408" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="ui-monospace, Consolas, monospace" fill="#9be38f" stroke="none">
              36.0
            </text>
          </g>

          {/* cup */}
          <g {...part('cup')}>
            <path d="M424 352c16 0 16 24 0 24" fill="none" strokeWidth={6} />
            <path d="M375 344h50l-4 36c-1 8-8 14-16 14h-10c-8 0-15-6-16-14Z" fill={C.milk} />
            <ellipse cx="400" cy="344" rx="25" ry="5" fill={C.crema} />
          </g>

          {/* basket (lifted out, exploded view) */}
          <g {...part('basket')}>
            <path d="M636 296h78l-6 28c-1 6-6 9-12 9h-42c-6 0-11-3-12-9Z" fill={C.steel} />
            <path d="M626 296h98" fill="none" strokeWidth={7} />
            <path d="M650 326h50" fill="none" strokeWidth={2.5} strokeDasharray="1 7" />
          </g>
          <path d="M675 344v42m-9-10 9 12 9-12" fill="none" stroke={C.steelDark} strokeWidth={3} strokeDasharray="6 6" />

          {/* portafilter */}
          <g {...part('portafilter')}>
            <ellipse cx="700" cy="452" rx="80" ry="6" fill={C.shadow} stroke="none" />
            <path d="M712 418l66-16c9-2 13 12 4 15l-68 20Z" fill={C.coffeeDark} />
            <path d="M635 404h80v8c0 16-12 26-28 26h-24c-16 0-28-10-28-26Z" fill={C.steel} />
            <path d="M626 404h98" fill="none" strokeWidth={7} />
            <path d="M668 438v10M684 438v10" fill="none" strokeWidth={5} />
          </g>
        </g>
      )}
    />
  );
}

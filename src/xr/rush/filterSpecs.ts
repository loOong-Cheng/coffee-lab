/**
 * Rush-local build specs for the pour-over drinks.
 *
 * TODO(cafe-specs): move these into src/features/cafe/specs.ts BUILD_SPECS once the Café Counter
 * model gains a 'pourover' method (lead decision 2026-11-11: keep them local to Rush until then).
 * Structure only — every number shown to players still comes from src/content/drinks.ts.
 */
import type { LocalizedText } from '../../domain/contracts';
import type { CupSize } from '../../features/cafe/model';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

export interface FilterSpec {
  drinkId: string;
  ice: boolean;
  cup: readonly CupSize[];
  keyPoint: LocalizedText;
  why: { method: LocalizedText; ice: LocalizedText; cup: LocalizedText; bloom: LocalizedText };
}

const BLOOM_WHY = L(
  '先用少量热水把粉全部润湿（闷蒸），等它鼓起再继续注水——这是食谱里的一步，不要跳过。',
  'Wet all the grounds with a little hot water first (the bloom) and let it settle before the main pour — it is a step in the recipe.',
);

export const FILTER_SPECS: readonly FilterSpec[] = [
  {
    drinkId: 'pourover-cone',
    ice: false,
    cup: ['large'],
    keyPoint: L('热水分段流过滤纸上的咖啡粉：先闷蒸，再注完剩下的水。', 'Hot water poured through grounds in a paper filter: bloom first, then the rest of the pour.'),
    why: {
      method: L('手冲是滤杯里的滴滤咖啡，不是浓缩。', 'A pour-over is drip coffee from a dripper, not espresso.'),
      ice: L('这杯是热的手冲，不加冰。', 'This is a hot pour-over — no ice.'),
      cup: L('一杯手冲有两百多毫升，需要马克杯。', 'A pour-over is a couple of hundred ml — it needs a mug.'),
      bloom: BLOOM_WHY,
    },
  },
  {
    drinkId: 'japanese-iced-pourover',
    ice: true,
    cup: ['large'],
    keyPoint: L('把一部分水换成冰：热水负责萃取，直接冲在冰上降温。', 'Part of the water is swapped for ice: hot water extracts, brewed straight onto ice to chill.'),
    why: {
      method: L('日式冰手冲用滤杯冲煮，不是浓缩。', 'Japanese-style iced coffee is brewed in a dripper, not on the espresso machine.'),
      ice: L('冰是配方的一部分——咖啡直接冲在冰上。', 'The ice is part of the recipe — the coffee is brewed straight onto it.'),
      cup: L('冰加咖啡，需要高玻璃杯。', 'Ice plus coffee needs a tall glass.'),
      bloom: BLOOM_WHY,
    },
  },
];

const FILTER_INDEX = new Map(FILTER_SPECS.map((s) => [s.drinkId, s]));
export const getFilterSpec = (id: string): FilterSpec | undefined => FILTER_INDEX.get(id);

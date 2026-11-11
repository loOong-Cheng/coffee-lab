/**
 * Coffee brands as knowledge (user request U6). Owner: coffee-curriculum.
 *
 * Purpose: help a beginner recognise brands they will meet and use each one as
 * a hook to learn something real (cup sizes vs standard drinks, capsule vs
 * espresso, why a dripper's shape changes flow…).
 *
 * Rules applied: names are used only to identify (no logos/art, no affiliation
 * or endorsement); no rankings, ad language, health claims or store counts;
 * company "firsts" and origin stories are marked as claims/stories; every
 * volume is approximate and markets differ. Provenance + confidence per brand:
 * docs/CONTENT_SOURCES_BRANDS.md. Source ids: src/content/sources.brands.ts
 * (prefix `brand-`) plus a few shared `atlas-` ids.
 */
import type { Confidence, LocalizedText } from '../domain/contracts';

export type BrandKind = 'cafe-chain' | 'roaster' | 'equipment';

export interface Brand {
  id: string;
  kind: BrandKind;
  name: LocalizedText;
  country: LocalizedText;
  founded?: number;
  /** 1–2 neutral sentences. */
  knownFor: LocalizedText;
  /** 1–3 notable products/drinks/devices. */
  signature: LocalizedText[];
  /** What a beginner can learn from this brand. */
  learnFromIt: LocalizedText;
  /** Optional: chain menu terms → standard drink / approx. volume (only where sourced). */
  menuDecoder?: LocalizedText[];
  /** Optional (additive): concise safety reminder for heat/pressure/blade equipment. Never repair instructions. */
  safetyNote?: LocalizedText;
  /** Existing ids in drinks.ts only. */
  relatedDrinkIds: string[];
  /** Existing ids in equipment.ts only. */
  relatedEquipmentIds: string[];
  /** Existing lesson ids only. */
  relatedLessonIds: string[];
  /** Year the time-sensitive facts were checked. */
  asOf: number;
  /** Ids into the aggregated sources list. */
  sources: string[];
  confidence: Confidence;
}

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

const AS_OF = 2026;

export const BRAND_DISCLAIMER: LocalizedText = L(
  '品牌名称仅用于识别，Coffee Lab 与这些公司没有任何关联，也不代表推荐或背书；不使用任何商标图形。产品、杯型和公司信息会变化，这里的内容核对于标注的核对年份，请以品牌当前官方信息为准。',
  'Brand names are used only to identify them. Coffee Lab is not affiliated with, sponsored by or endorsing any of these companies, and shows no logos. Products, cup sizes and company facts change; each entry was checked in the year shown, so check the brand’s current official information.',
);

// ── shared safety notes (concise; machine-specific care → manufacturer manual) ──
const S_MACHINE = L(
  '冲煮头、蒸汽棒和热水出口都会烫伤。清洁、除垢和维修只按说明书操作，或交给专业维修人员。',
  'The group head, steam wand and hot-water outlet can burn. Clean, descale and repair only as the manual says, or use a qualified technician.',
);
const S_GRINDER = L(
  '电动磨豆机卡住或清理前先拔掉电源；手指和工具不要伸进磨盘或进豆口。',
  'Unplug an electric grinder before clearing a jam or cleaning; keep fingers and tools out of the burrs and the hopper throat.',
);
const S_HOT_WATER = L(
  '热水会烫伤：壶放稳，倒水时手远离水流，别让孩子靠近。',
  'Hot water scalds: keep the kettle stable, hands clear of the stream, children away.',
);
const S_HAND_GRINDER = L(
  '手摇磨豆机的磨盘很锋利：按说明书用刷子清理，不要把手指伸进磨盘；研磨时握稳机身。',
  'Hand-grinder burrs are sharp: clean them with a brush as the manual describes, never with your fingers, and hold the grinder steady while grinding.',
);
const S_HAND_GRINDER_HOT_WATER = L(
  '手摇磨豆机的磨盘很锋利：按说明书用刷子清理，不要把手指伸进磨盘。冲煮时热水会烫伤，秤上的杯壶要放稳。',
  'Hand-grinder burrs are sharp: clean them with a brush as the manual describes, never with your fingers. When brewing, hot water scalds — keep the vessel on the scale stable.',
);
const S_GLASS = L(
  '玻璃器具遇冷热骤变可能破裂；别把热玻璃放在冷湿台面上。',
  'Glass can crack with sudden temperature changes; don’t set hot glass on a cold, wet surface.',
);

export const brands: Brand[] = [
  // ───────────────────────────── café chains ─────────────────────────────
  {
    id: 'starbucks',
    kind: 'cafe-chain',
    name: L('星巴克', 'Starbucks'),
    country: L('美国', 'United States'),
    founded: 1971,
    knownFor: L(
      '1971 年在西雅图派克市场开出第一家店，起初只卖咖啡豆和器具，后来发展成以意式奶咖和大杯型闻名的全球连锁。',
      'Opened its first shop in Seattle’s Pike Place Market in 1971, selling beans and equipment, and later grew into a global chain known for espresso-and-milk drinks in large cups.',
    ),
    signature: [
      L('焦糖玛奇朵', 'Caramel Macchiato'),
      L('星冰乐冰沙类饮品', 'Frappuccino blended drinks'),
    ],
    learnFromIt: L(
      '连锁店的“中杯拿铁”大约 355 毫升，比意大利吧台的一杯卡布奇诺大得多——同样的名字，奶量和咖啡比例可能完全不同。另外，焦糖玛奇朵其实是加了香草糖浆的拿铁，和传统的浓缩玛奇朵不是一回事。',
      'A chain “Tall latte” is about 355 ml — far bigger than a cappuccino at an Italian bar, so the same name can mean a very different milk-to-coffee ratio. And a Caramel Macchiato is really a vanilla-syrup latte, not a traditional espresso macchiato.',
    ),
    menuDecoder: [
      L('Short：约 8 液量盎司（≈240 毫升），菜单上常不列出，可以直接问', 'Short: about 8 fl oz (≈240 ml); often not on the board — just ask'),
      L('中杯：约 12 液量盎司（≈355 毫升）', 'Tall: about 12 fl oz (≈355 ml)'),
      L('大杯：约 16 液量盎司（≈475 毫升）', 'Grande: about 16 fl oz (≈475 ml)'),
      L('超大杯：热饮约 20 液量盎司（≈590 毫升），冷饮约 24 液量盎司（≈710 毫升）', 'Venti: hot about 20 fl oz (≈590 ml), iced about 24 fl oz (≈710 ml)'),
      L('焦糖玛奇朵 = 香草糖浆 + 牛奶 + 浇在顶上的浓缩 + 焦糖淋酱，不等于浓缩玛奇朵', 'Caramel Macchiato = vanilla syrup + milk, espresso poured on top, caramel drizzle — not an espresso macchiato'),
    ],
    relatedDrinkIds: ['caffe-latte', 'espresso-macchiato', 'cappuccino', 'iced-latte'],
    relatedEquipmentIds: ['espresso-machine', 'milk-pitcher'],
    relatedLessonIds: ['esp-milk-basics', 'cul-coffeehouses', 'cul-waves-specialty'],
    asOf: AS_OF,
    sources: ['atlas-history-starbucks', 'brand-verify-starbucks-sizes', 'brand-starbucks-menu'],
    confidence: 'verified',
  },
  {
    id: 'costa',
    kind: 'cafe-chain',
    name: L('咖世家', 'Costa Coffee'),
    country: L('英国', 'United Kingdom'),
    founded: 1971,
    knownFor: L(
      '由意大利移民 Sergio 和 Bruno Costa 兄弟 1971 年在伦敦创办，最初是烘焙批发商；2019 年被可口可乐公司收购。',
      'Started in London in 1971 by Italian brothers Sergio and Bruno Costa as a roasting and wholesale business; bought by The Coca-Cola Company in 2019.',
    ),
    signature: [
      L('Mocha Italia 意式拼配（店内浓缩基底）', 'Mocha Italia house espresso blend'),
      L('澳白', 'Flat white'),
    ],
    learnFromIt: L(
      'Costa 用意大利语式的杯型名（Primo / Medio / Massimo），但并不表示意大利式的小杯。点单时看实际容量和几份浓缩，比看名字更可靠。',
      'Costa uses Italian-sounding size names (Primo / Medio / Massimo), but they don’t mean Italian-bar portions. Cup volume and number of shots tell you more than the name.',
    ),
    menuDecoder: [
      L('Primo / Medio / Massimo ≈ 小 / 中 / 大杯（具体容量因国家和饮品而异）', 'Primo / Medio / Massimo ≈ small / medium / large (exact volumes vary by country and drink)'),
    ],
    relatedDrinkIds: ['flat-white', 'caffe-latte', 'cappuccino'],
    relatedEquipmentIds: ['espresso-machine', 'milk-pitcher'],
    relatedLessonIds: ['esp-milk-basics', 'cul-coffeehouses'],
    asOf: AS_OF,
    sources: ['brand-wiki-costa'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'tim-hortons',
    kind: 'cafe-chain',
    name: L('天好咖啡', 'Tim Hortons'),
    country: L('加拿大', 'Canada'),
    founded: 1964,
    knownFor: L(
      '1964 年在加拿大安大略省汉密尔顿开业，创办人之一是冰球运动员 Tim Horton；以平价滴滤咖啡和甜甜圈出名，在中国以“Tims”名义经营门店。',
      'Opened in Hamilton, Ontario, in 1964, co-founded by ice-hockey player Tim Horton; known for affordable drip coffee and doughnuts, and operates in China as “Tims”.',
    ),
    signature: [
      L('Double-Double（双奶双糖咖啡）', 'Double-Double coffee'),
      L('Timbits 迷你甜甜圈球', 'Timbits doughnut holes'),
    ],
    learnFromIt: L(
      '在加拿大，很多人点咖啡时直接说加几份奶、几份糖——“Double-Double”就是这种说法。这提醒我们：同一杯滴滤咖啡，加奶加糖后的味道是你自己的偏好，没有对错。',
      'In Canada people often order coffee by how many creams and sugars they want — that is what “Double-Double” means. Same drip coffee, your own adjustments: preference, not right or wrong.',
    ),
    menuDecoder: [
      L('Double-Double = 滴滤咖啡 + 两份奶油 + 两份糖', 'Double-Double = drip coffee + two creams + two sugars'),
      L('Timbits = 一口大小的甜甜圈球（不是饮品）', 'Timbits = bite-sized doughnut holes (not a drink)'),
    ],
    relatedDrinkIds: ['americano'],
    relatedEquipmentIds: ['carafe', 'mug'],
    relatedLessonIds: ['lit-what-is-coffee', 'cul-coffeehouses'],
    asOf: AS_OF,
    sources: ['brand-wiki-tim-hortons'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'dunkin',
    kind: 'cafe-chain',
    name: L('唐恩都乐', 'Dunkin’'),
    country: L('美国', 'United States'),
    founded: 1950,
    knownFor: L(
      '1950 年由 William Rosenberg 在马萨诸塞州昆西开出第一家 Dunkin’ Donuts，2019 年起在美国把品牌名简化为 Dunkin’，以快取式咖啡和甜甜圈为主。',
      'William Rosenberg opened the first Dunkin’ Donuts in Quincy, Massachusetts, in 1950; in 2019 the US brand shortened its name to Dunkin’. It focuses on grab-and-go coffee and doughnuts.',
    ),
    signature: [
      L('Original Blend 热滴滤咖啡', 'Original Blend hot coffee'),
      L('冰咖啡', 'Iced coffee'),
    ],
    learnFromIt: L(
      '美国东北部有些人说“regular coffee”指的是加奶加糖的咖啡，而不是“普通黑咖啡”。地区说法会变，拿不准就直接问店员。',
      'In parts of the US Northeast, “regular coffee” can mean coffee with cream and sugar, not plain black. Regional words differ — when unsure, just ask.',
    ),
    menuDecoder: [
      L('“Regular”（美国东北部部分地区）≈ 加奶加糖的咖啡——这是地区习惯，不是统一定义', '“Regular” (parts of the US Northeast) ≈ coffee with cream and sugar — a regional habit, not a fixed definition'),
    ],
    relatedDrinkIds: ['americano', 'iced-latte'],
    relatedEquipmentIds: ['carafe'],
    relatedLessonIds: ['lit-what-is-coffee'],
    asOf: AS_OF,
    sources: ['brand-wiki-dunkin', 'brand-general-reference'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'luckin',
    kind: 'cafe-chain',
    name: L('瑞幸咖啡', 'Luckin Coffee'),
    country: L('中国', 'China'),
    founded: 2017,
    knownFor: L(
      '2017 年创立、总部在厦门的连锁品牌，以手机 App/小程序下单、到店自取或外送的小店模式和频繁推出的新口味饮品出名。',
      'Founded in 2017 and based in Xiamen, known for ordering through its app or mini-program, small pick-up or delivery stores, and a constant stream of new flavoured drinks.',
    ),
    signature: [
      L('生椰拿铁（用椰乳代替部分牛奶的拿铁）', 'Coconut latte, a latte made with coconut milk'),
      L('联名限定饮品，例如 2023 年与茅台合作的“酱香拿铁”（含少量白酒）', 'Co-branded limited drinks, e.g. the 2023 Moutai latte with Kweichow Moutai (contains a little liquor)'),
    ],
    learnFromIt: L(
      '很多新名字的饮品，其实都是“浓缩 + 奶 + 一种风味”的组合。看到新品时先问自己：底子是拿铁、美式还是别的？换掉或加上的是什么？这样就能用你学过的比例来理解它。',
      'Many new drink names are “espresso + milk + one twist”. When you see a new one, ask: is the base a latte, an Americano or something else, and what was swapped or added? Then your ratio knowledge applies.',
    ),
    relatedDrinkIds: ['caffe-latte', 'americano', 'iced-latte'],
    relatedEquipmentIds: ['espresso-machine'],
    relatedLessonIds: ['esp-milk-basics', 'lit-brewing-concepts'],
    asOf: AS_OF,
    sources: ['brand-wiki-luckin', 'brand-wcp-luckin-moutai', 'brand-xinhua-novel-coffee'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'cotti',
    kind: 'cafe-chain',
    name: L('库迪咖啡', 'Cotti Coffee'),
    country: L('中国', 'China'),
    founded: 2022,
    knownFor: L(
      '2022 年由瑞幸的两位前创始人陆正耀、钱治亚创办，第一家店据报道 2022 年 10 月在福州开业，以低价策略和快速开店著称，近年也开到海外。总部所在地各方报道不一。',
      'Founded in 2022 by two former Luckin founders, Lu Zhengyao and Qian Zhiya; its first store reportedly opened in Fuzhou in October 2022. Known for low prices and rapid expansion, including abroad. Reports differ on where it is headquartered.',
    ),
    signature: [
      L('拿铁、美式等基础意式饮品', 'Core espresso drinks such as lattes and Americanos'),
    ],
    learnFromIt: L(
      '比较不同连锁的同一款“美式”：本质都是浓缩加水，但杯子大小、浓缩份数和冰量不同，喝起来浓淡差别会很大。看份数和容量，而不是只看名字或价格。',
      'Compare the same “Americano” across chains: it is always espresso plus water, but cup size, number of shots and ice change how strong it tastes. Look at shots and volume, not just the name or price.',
    ),
    relatedDrinkIds: ['americano', 'caffe-latte'],
    relatedEquipmentIds: ['espresso-machine'],
    relatedLessonIds: ['lit-brewing-concepts', 'esp-ratio-lab'],
    asOf: AS_OF,
    sources: ['brand-wiki-cotti', 'brand-equalocean-cotti'],
    confidence: 'verified',
  },
  {
    id: 'manner',
    kind: 'cafe-chain',
    name: L('Manner Coffee', 'Manner Coffee'),
    country: L('中国', 'China'),
    founded: 2015,
    knownFor: L(
      '2015 年从上海南阳路一个约 2 平方米的小窗口起步，以小型外带门店和“自带杯减价”出名（减价金额以门店当下规则为准）。',
      'Began in 2015 as a roughly 2 m² window on Nanyang Road, Shanghai; known for tiny takeaway counters and a discount for bringing your own cup (the amount follows current store rules).',
    ),
    signature: [
      L('拿铁（菜单核心）', 'Latte (the core of the menu)'),
      L('几平方米的小窗口门店', 'Tiny counters only a few square metres in size'),
    ],
    learnFromIt: L(
      '一个小窗口就能看清意式吧台的核心装备：磨豆机、咖啡机、奶缸和杯子。自带杯时也要想到：杯子大小会影响加多少奶，记得告诉店员你要哪种杯量。',
      'A tiny counter shows the core of an espresso bar: grinder, machine, milk pitcher and cups. With your own cup, remember its size changes how much milk goes in — tell the barista which size you want.',
    ),
    relatedDrinkIds: ['caffe-latte', 'espresso-shot'],
    relatedEquipmentIds: ['espresso-machine', 'grinder', 'milk-pitcher', 'cup'],
    relatedLessonIds: ['esp-meet-the-machine', 'esp-milk-basics'],
    asOf: AS_OF,
    sources: ['brand-chinadaily-manner', 'brand-chinaproject-manner'],
    confidence: 'verified',
  },
  {
    id: 'seesaw',
    kind: 'cafe-chain',
    name: L('Seesaw Coffee', 'Seesaw Coffee'),
    country: L('中国', 'China'),
    founded: 2012,
    knownFor: L(
      '2012 年创立于上海，是国内较早的精品咖啡连锁之一，长期在云南收购和推广本地咖啡豆。',
      'Founded in Shanghai in 2012 as one of China’s early specialty coffee chains, with a long-running programme buying and promoting coffee from Yunnan.',
    ),
    signature: [
      L('云南单一产地咖啡', 'Single-origin Yunnan coffees'),
      L('“云南十年计划”产区合作项目', 'Its “Yunnan ten-year plan” sourcing project'),
    ],
    learnFromIt: L(
      '精品店的豆单会写产区、处理法（水洗、日晒、蜜处理）和风味描述。学会读这张标签，你就能把“云南保山日晒”这样的名字和你学过的产地、处理法知识联系起来。',
      'Specialty menus list region, process (washed, natural, honey) and tasting notes. Reading that label links a name like “Yunnan natural” to what you know about origin and processing.',
    ),
    relatedDrinkIds: ['pourover-cone', 'espresso-shot'],
    relatedEquipmentIds: ['dripper', 'gooseneck-kettle'],
    relatedLessonIds: ['exp-origin-processing', 'cul-waves-specialty'],
    asOf: AS_OF,
    sources: ['brand-sca-china-market', 'brand-smartshanghai-seesaw', 'atlas-yunnan-case'],
    confidence: 'verified',
  },
  {
    id: 'pacific-coffee',
    kind: 'cafe-chain',
    name: L('太平洋咖啡', 'Pacific Coffee'),
    country: L('中国香港', 'Hong Kong, China'),
    founded: 1992,
    knownFor: L(
      '1992 年由从西雅图来到香港的美国人 Thomas Neir 创办，1993 年在中环开出首店；2010 年起华润集团成为主要股东，并向内地扩展。',
      'Founded in Hong Kong in 1992 by Thomas Neir, an American who came from Seattle, with the first outlet opening in Central in 1993; China Resources became a major shareholder in 2010 and expanded it into the mainland.',
    ),
    signature: [
      L('西雅图式咖啡馆的意式饮品菜单', 'A Seattle-style coffeehouse espresso menu'),
    ],
    learnFromIt: L(
      '咖啡馆文化会“旅行”：一家受西雅图启发的连锁在香港生根，而香港本地还有茶餐厅的鸳鸯。比较两者，能看到同一种咖啡如何被不同城市重新诠释。',
      'Café culture travels: a Seattle-inspired chain took root in Hong Kong, a city that also has its own cha chaan teng yuenyeung. Comparing them shows how cities reinterpret the same coffee.',
    ),
    relatedDrinkIds: ['caffe-latte', 'yuenyeung'],
    relatedEquipmentIds: ['espresso-machine'],
    relatedLessonIds: ['cul-coffeehouses', 'cul-world-traditions'],
    asOf: AS_OF,
    sources: ['brand-wiki-pacific-coffee', 'atlas-hk-milk-tea'],
    confidence: 'verified',
  },
  {
    id: 'doutor',
    kind: 'cafe-chain',
    name: L('罗多伦咖啡', 'Doutor Coffee'),
    country: L('日本', 'Japan'),
    founded: 1962,
    knownFor: L(
      '1962 年由鸟羽博道创办，起初是咖啡烘焙和批发商；1980 年在东京原宿开出第一家 Doutor 自助式咖啡店，主打平价的现煮咖啡。',
      'Founded in 1962 by Hiromichi Toriba as a roaster and wholesaler; opened its first self-service Doutor Coffee Shop in Harajuku, Tokyo, in 1980, selling inexpensive freshly brewed coffee.',
    ),
    signature: [
      L('招牌拼配咖啡', 'House blend coffee'),
      L('米兰三明治', 'Milano sandwich'),
    ],
    learnFromIt: L(
      '日本咖啡店菜单上的“Blend（拼配）”指的是把几个产地的豆子混合，追求稳定的招牌风味；“单一产地”则突出一个地方的特点。两种都没有高低之分。',
      'On Japanese menus “blend” means beans from several origins mixed for a consistent house taste; “single origin” highlights one place. Neither is better by default.',
    ),
    relatedDrinkIds: ['caffe-latte', 'americano'],
    relatedEquipmentIds: ['carafe'],
    relatedLessonIds: ['exp-origin-processing', 'cul-coffeehouses'],
    asOf: AS_OF,
    sources: ['brand-wiki-doutor'],
    confidence: 'verified',
  },
  {
    id: 'komeda',
    kind: 'cafe-chain',
    name: L('客美多咖啡', 'Komeda’s Coffee'),
    country: L('日本', 'Japan'),
    founded: 1968,
    knownFor: L(
      '1968 年由加藤太郎在名古屋开出第一家店，店名来自他家经营的米店；以宽敞的座位、复古“喫茶店”氛围和名古屋式“早餐服务”著称。',
      'Taro Kato opened the first shop in Nagoya in 1968, naming it after his family’s rice shop; known for roomy seating, a retro kissaten feel and Nagoya-style “morning service”.',
    ),
    signature: [
      L('早餐服务：上午点饮品通常附送吐司（时段和内容以门店为准）', 'Morning service: a morning drink usually comes with toast (hours and options vary by store)'),
      L('Shiro-Noir（温热丹麦面包配软冰淇淋）', 'Shiro-Noir (warm Danish pastry topped with soft-serve)'),
    ],
    learnFromIt: L(
      '咖啡馆不只是卖饮品，也是可以久坐的“第三空间”。名古屋的早餐服务是一个很好的例子：地方习惯会改变人们喝咖啡的方式。',
      'A café can be a place to stay, not just a drink counter. Nagoya’s morning service shows how local habits shape the way people drink coffee.',
    ),
    relatedDrinkIds: [],
    relatedEquipmentIds: ['cup'],
    relatedLessonIds: ['cul-coffeehouses'],
    asOf: AS_OF,
    sources: ['brand-wiki-komeda', 'atlas-japan-kissaten'],
    confidence: 'verified',
  },
  {
    id: 'segafredo',
    kind: 'cafe-chain',
    name: L('Segafredo Zanetti', 'Segafredo Zanetti'),
    country: L('意大利', 'Italy'),
    founded: 1973,
    knownFor: L(
      '博洛尼亚的咖啡品牌；集团把起点算作 1973 年 Massimo Zanetti 买下博洛尼亚的 Segafredo 烘焙厂。除了卖豆，也在世界各地发展“Segafredo Zanetti Espresso”意式咖啡吧。',
      'A Bologna coffee brand; the group dates itself to 1973, when Massimo Zanetti bought the Segafredo roastery there. Besides beans, it franchises “Segafredo Zanetti Espresso” bars worldwide.',
    ),
    signature: [
      L('Segafredo Zanetti Espresso 咖啡吧（据公司说法，首家 1988 年开在巴黎）', 'Segafredo Zanetti Espresso bars (the first in Paris in 1988, per the company)'),
      L('意式浓缩拼配咖啡豆', 'Espresso blends'),
    ],
    learnFromIt: L(
      '在意大利式吧台点单很简单：“un caffè”就是一杯浓缩；“macchiato”是浓缩上点一小勺奶泡。很多人站在吧台喝完就走。学会这几句，你就能读懂大多数意式菜单。',
      'Italian-bar ordering is short: “un caffè” is an espresso; a “macchiato” is an espresso marked with a spoon of foam. Many people drink standing at the bar. These few words decode most Italian menus.',
    ),
    menuDecoder: [
      L('un caffè = 一杯意式浓缩', 'un caffè = an espresso'),
      L('caffè macchiato = 浓缩 + 一小勺奶泡', 'caffè macchiato = espresso + a spoon of milk foam'),
      L('caffè lungo = 出液更多、更淡的浓缩', 'caffè lungo = a longer, lighter espresso'),
    ],
    relatedDrinkIds: ['espresso-shot', 'espresso-macchiato', 'lungo', 'cappuccino'],
    relatedEquipmentIds: ['espresso-machine', 'espresso-cup'],
    relatedLessonIds: ['cul-espresso-bar'],
    asOf: AS_OF,
    sources: ['brand-wiki-mzb', 'atlas-wiki-espresso-machine'],
    confidence: 'rule-of-thumb',
  },

  // ───────────────────────── roasters / beans / capsules / instant ─────────────────────────
  {
    id: 'illy',
    kind: 'roaster',
    name: L('意利', 'illy'),
    country: L('意大利', 'Italy'),
    founded: 1933,
    knownFor: L(
      '1933 年由 Francesco Illy 在的里雅斯特创办，长期以单一的百分之百阿拉比卡拼配著称（后来也推出了其他烘焙度和单一产地系列），并用充入惰性气体的加压罐包装来延缓咖啡变陈。',
      'Founded in Trieste in 1933 by Francesco Illy; long known for one 100% arabica blend (it later added other roasts and single origins) and for pressurised tins filled with inert gas to slow staling.',
    ),
    signature: [
      L('单一的 100% 阿拉比卡拼配', 'One 100% arabica blend'),
      L('加压充气金属罐包装', 'Pressurised, gas-flushed tins'),
    ],
    learnFromIt: L(
      '咖啡豆最大的敌人是氧气、光、热和湿气。illy 的罐装方式是一个例子：包装越能隔绝氧气，风味通常保持得越久；开封后仍要尽快喝完、密封保存。',
      'Coffee’s enemies are oxygen, light, heat and moisture. illy’s tins are one answer: packaging that keeps oxygen out usually keeps flavour longer — but once opened, seal it and use it soon.',
    ),
    relatedDrinkIds: ['espresso-shot', 'cappuccino'],
    relatedEquipmentIds: ['espresso-machine', 'espresso-cup'],
    relatedLessonIds: ['lit-what-is-coffee', 'cul-espresso-bar'],
    asOf: AS_OF,
    sources: ['brand-wiki-illy'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'lavazza',
    kind: 'roaster',
    name: L('拉瓦萨', 'Lavazza'),
    country: L('意大利', 'Italy'),
    founded: 1895,
    knownFor: L(
      '1895 年由 Luigi Lavazza 在都灵开设杂货店起家，以家用和咖啡吧用的拼配咖啡出名；公司把“拼配”理念视为自己的传统。',
      'Grew from Luigi Lavazza’s grocery shop opened in Turin in 1895; known for blends for home and bar use, and the company presents blending as part of its heritage.',
    ),
    signature: [
      L('Qualità Rossa 拼配', 'Qualità Rossa blend'),
      L('A Modo Mio 胶囊系统', 'A Modo Mio capsule system'),
    ],
    learnFromIt: L(
      '很多意式拼配会混合阿拉比卡和罗布斯塔。罗布斯塔一般咖啡因更高、口感更厚重、苦味更明显。读包装上的拼配比例，比只看“意式”两个字更有用。',
      'Many Italian blends mix arabica and robusta. Robusta usually has more caffeine and tends to taste heavier and more bitter. Reading the blend on the bag tells you more than the word “Italian”.',
    ),
    relatedDrinkIds: ['espresso-shot', 'cappuccino', 'moka-pot-coffee'],
    relatedEquipmentIds: ['espresso-machine', 'moka-pot'],
    relatedLessonIds: ['exp-origin-processing', 'cul-espresso-bar'],
    asOf: AS_OF,
    sources: ['brand-wiki-lavazza', 'atlas-wcr-varieties'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'nespresso',
    kind: 'roaster',
    name: L('奈斯派索', 'Nespresso'),
    country: L('瑞士', 'Switzerland'),
    founded: 1986,
    knownFor: L(
      '雀巢旗下的胶囊咖啡品牌，1986 年推出第一代胶囊系统；后来的 Vertuo 系列靠读取胶囊上的条码、用旋转方式萃取。',
      'Nestlé’s capsule brand, which launched its first capsule system in 1986; the later Vertuo line reads a barcode on each capsule and brews by spinning it.',
    ),
    signature: [
      L('Original 原始胶囊系统', 'Original capsule system'),
      L('Vertuo 条码胶囊系统', 'Vertuo barcode-capsule system'),
    ],
    learnFromIt: L(
      '胶囊替你固定了研磨度、粉量和压粉，所以你调不了这些变量；但“浓缩”和“长萃”按钮出液量不同，正好可以用来体会：同样的粉，出液越多，味道越淡。',
      'A capsule fixes grind, dose and tamp for you, so you can’t change them; but the “espresso” and “lungo” buttons give different yields — a neat way to feel how more water from the same coffee tastes lighter.',
    ),
    relatedDrinkIds: ['espresso-shot', 'lungo'],
    relatedEquipmentIds: ['espresso-cup'],
    relatedLessonIds: ['esp-ratio-lab', 'lit-brewing-concepts'],
    asOf: AS_OF,
    sources: ['brand-wiki-nespresso'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'nescafe',
    kind: 'roaster',
    name: L('雀巢咖啡', 'Nescafé'),
    country: L('瑞士', 'Switzerland'),
    founded: 1938,
    knownFor: L(
      '雀巢 1938 年推出的速溶咖啡品牌，常见说法是研发起因于巴西咖啡过剩。在中国很多人第一次喝咖啡，喝的就是雀巢的速溶或“1+2”。',
      'Nestlé’s instant coffee brand, launched in 1938; the usual account is that it was developed in response to a Brazilian coffee surplus. For many people in China, a Nescafé instant or “1+2” mix was their first coffee.',
    ),
    signature: [
      L('雀巢咖啡醇品 / 金牌速溶咖啡', 'Nescafé Classic and Gold instant coffee'),
      L('“1+2”三合一（咖啡 + 植脂末 + 糖）', '“1+2” three-in-one mixes (coffee + creamer + sugar)'),
    ],
    learnFromIt: L(
      '速溶咖啡是先把咖啡煮好，再喷雾干燥或冷冻干燥成粉或颗粒，冲水时是“溶解”而不是“萃取”，所以研磨度和萃取时间对它不适用。三合一里还有糖和奶精，看配料表就知道。希腊冰咖啡通常就是用速溶做的。',
      'Instant coffee is brewed first, then spray-dried or freeze-dried; adding water dissolves it rather than extracting it, so grind and brew time don’t apply. Three-in-one mixes also contain sugar and creamer — check the label. A Greek frappé is usually made with instant.',
    ),
    relatedDrinkIds: ['greek-frappe'],
    relatedEquipmentIds: ['kettle', 'mug', 'shaker'],
    relatedLessonIds: ['lit-what-is-coffee', 'lit-brewing-concepts'],
    asOf: AS_OF,
    sources: ['brand-wiki-nescafe', 'atlas-wiki-instant-coffee', 'atlas-wiki-frappe'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'ucc',
    kind: 'roaster',
    name: L('悠诗诗', 'UCC Ueshima Coffee'),
    country: L('日本', 'Japan'),
    founded: 1933,
    knownFor: L(
      '1933 年由上岛忠雄在神户创办；1969 年推出罐装“UCC 牛奶咖啡”，公司称之为世界上第一款罐装咖啡（更早的罐装咖啡说法也存在，算公司自述）。',
      'Founded in Kobe in 1933 by Tadao Ueshima; in 1969 it launched canned “UCC Coffee with Milk”, which the company calls the world’s first canned coffee (other earlier claims exist, so treat it as the company’s claim).',
    ),
    signature: [
      L('UCC 牛奶咖啡罐装饮料（1969）', 'UCC Coffee with Milk can (1969)'),
    ],
    learnFromIt: L(
      '即饮罐装咖啡是在工厂里煮好、调配、灌装并加热杀菌的，和现煮咖啡是两种东西。日本自动售货机里常有热罐和冷罐，这是一种独特的咖啡文化。',
      'Ready-to-drink canned coffee is brewed, mixed, sealed and heat-treated in a factory — a different thing from a fresh brew. Japanese vending machines sell it hot or cold, a coffee culture of its own.',
    ),
    relatedDrinkIds: ['iced-latte'],
    relatedEquipmentIds: [],
    relatedLessonIds: ['cul-world-traditions', 'lit-what-is-coffee'],
    asOf: AS_OF,
    sources: ['brand-wiki-ucc', 'brand-ucc-story'],
    confidence: 'verified',
  },
  {
    id: 'saturnbird',
    kind: 'roaster',
    name: L('三顿半', 'Saturnbird Coffee'),
    country: L('中国', 'China'),
    founded: 2015,
    knownFor: L(
      '2015 年在长沙创立，最初是一家咖啡馆；2018 年推出装在小杯状罐子里的冻干速溶咖啡，可以直接溶进冷水或冷牛奶。2019 年起开展“返航计划”回收空罐。',
      'Started in Changsha in 2015 as a café; in 2018 it launched freeze-dried instant coffee in small cup-shaped pots that dissolve even in cold water or milk. Since 2019 its “Return Plan” collects the empty pots.',
    ),
    signature: [
      L('小杯装冻干速溶咖啡（2018）', 'Freeze-dried instant coffee in mini cups (2018)'),
      L('“返航计划”空罐回收（2019 起）', '“Return Plan” empty-pot collection (since 2019)'),
    ],
    learnFromIt: L(
      '冻干咖啡能在冷水里快速溶解，所以能很快做出一杯冰咖啡或“类拿铁”的冷饮。但它仍然是溶解的速溶咖啡，不是现萃浓缩——可以并排试一试，自己比较差别。',
      'Freeze-dried coffee dissolves quickly even in cold liquid, so it makes a fast iced coffee or latte-like drink. It is still dissolved instant, not a freshly pulled espresso — try them side by side and judge for yourself.',
    ),
    relatedDrinkIds: ['iced-latte', 'cold-brew'],
    relatedEquipmentIds: ['cup', 'shaker'],
    relatedLessonIds: ['lit-what-is-coffee', 'lit-brewing-concepts'],
    asOf: AS_OF,
    sources: ['brand-foodnavigator-saturnbird', 'brand-donews-saturnbird'],
    confidence: 'verified',
  },
  {
    id: 'yongpu',
    kind: 'roaster',
    name: L('永璞咖啡', 'Yongpu Coffee'),
    country: L('中国', 'China'),
    founded: 2014,
    knownFor: L(
      '2014 年在上海创立，早期以挂耳咖啡为主，2018 年推出冷萃咖啡液后打开知名度，也以大量联名包装出名。',
      'Founded in Shanghai in 2014, first selling drip bags; its cold-brew coffee concentrate (2018) made it widely known, along with many co-branded packaging designs.',
    ),
    signature: [
      L('冷萃咖啡液（浓缩液）', 'Cold-brew coffee concentrate'),
      L('挂耳咖啡', 'Drip-bag coffee'),
    ],
    learnFromIt: L(
      '咖啡液是“浓缩”的，不是直接喝的成品：要按包装写的比例兑水或兑奶。这就是比例思维——同一份浓缩液，兑得越多越淡。',
      'A concentrate is not ready to drink: dilute it with water or milk at the ratio on the pack. That is ratio thinking — the more you dilute the same concentrate, the lighter it gets.',
    ),
    relatedDrinkIds: ['cold-brew', 'iced-latte'],
    relatedEquipmentIds: ['cold-brew-jar', 'scale'],
    relatedLessonIds: ['lit-brewing-concepts'],
    asOf: AS_OF,
    sources: ['brand-thepaper-yongpu'],
    confidence: 'verified',
  },
  {
    id: 'peets',
    kind: 'roaster',
    name: L('皮爷咖啡', 'Peet’s Coffee'),
    country: L('美国', 'United States'),
    founded: 1966,
    knownFor: L(
      '1966 年由荷兰裔烘焙师 Alfred Peet 在加州伯克利开店，以深烘咖啡出名；星巴克创始人早期就向他学习烘焙并采购咖啡豆。',
      'Opened in Berkeley, California, in 1966 by Dutch-born roaster Alfred Peet, known for dark roasts; Starbucks’ founders learned from him and bought his beans in their early years.',
    ),
    signature: [
      L('Major Dickason’s Blend 深烘拼配', 'Major Dickason’s Blend (dark roast)'),
    ],
    learnFromIt: L(
      '深烘咖啡通常有更多烘烤、焦糖、可可和苦甜感，浅烘更容易喝到果酸和花香。烘焙程度是风格选择，不是好坏之分——两种都试试，记下你的偏好。',
      'Dark roasts usually taste more roasty, caramel-like and bittersweet; light roasts more often show fruity acidity and florals. Roast level is a style choice, not a quality ranking — try both and note what you like.',
    ),
    relatedDrinkIds: ['french-press-coffee', 'americano'],
    relatedEquipmentIds: ['french-press'],
    relatedLessonIds: ['exp-roast-levels', 'cul-waves-specialty'],
    asOf: AS_OF,
    sources: ['brand-wiki-peets'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'blue-bottle',
    kind: 'roaster',
    name: L('蓝瓶咖啡', 'Blue Bottle Coffee'),
    country: L('美国', 'United States'),
    founded: 2002,
    knownFor: L(
      '2002 年由 James Freeman 在加州奥克兰创办，最初在农夫市集卖现烘咖啡；2017 年雀巢成为控股股东，后来在日本和中国开店。',
      'Started by James Freeman in Oakland, California, in 2002, selling freshly roasted coffee at farmers’ markets; Nestlé became majority owner in 2017, and it later opened cafés in Japan and China.',
    ),
    signature: [
      L('吧台现做的手冲咖啡', 'Pour-over made to order at the bar'),
      L('新奥尔良式冰咖啡（加菊苣的冷萃）', 'New Orleans-style iced coffee (cold brew with chicory)'),
    ],
    learnFromIt: L(
      '在精品咖啡馆点一杯手冲，可以观察咖啡师怎么称粉、闷蒸、分段注水，再对照你在手冲课里学到的步骤。每家店的配方都不同，这很正常。',
      'Order a pour-over at a specialty café and watch the barista weigh, bloom and pour in stages, then compare with your pour-over lessons. Every café’s recipe differs, and that is normal.',
    ),
    relatedDrinkIds: ['pourover-cone', 'cold-brew'],
    relatedEquipmentIds: ['dripper', 'gooseneck-kettle', 'scale'],
    relatedLessonIds: ['po-ratio-bloom', 'cul-waves-specialty'],
    asOf: AS_OF,
    sources: ['brand-wiki-blue-bottle'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'tim-wendelboe',
    kind: 'roaster',
    name: L('Tim Wendelboe', 'Tim Wendelboe'),
    country: L('挪威', 'Norway'),
    founded: 2007,
    knownFor: L(
      '2004 年世界咖啡师大赛冠军 Tim Wendelboe 于 2007 年在奥斯陆开设的烘焙坊兼咖啡吧，以浅烘的单一产地咖啡著称，常被当作“北欧浅烘”风格的代表。',
      'An Oslo roastery and espresso bar opened in 2007 by Tim Wendelboe, the 2004 World Barista Champion; known for light-roasted single-origin coffee and often cited as an example of the Nordic light-roast style.',
    ),
    signature: [
      L('浅烘单一产地滤泡咖啡', 'Light-roasted single-origin filter coffee'),
    ],
    learnFromIt: L(
      '浅烘咖啡往往更明亮、带果酸，和深烘的厚重感很不一样。对比品尝时一次只改一个条件（例如只换豆子），才知道差别来自哪里。',
      'Light roasts often taste brighter and fruitier than heavy dark roasts. When comparing, change one thing at a time (e.g. only the beans) so you know where the difference comes from.',
    ),
    relatedDrinkIds: ['pourover-cone', 'chemex-brew'],
    relatedEquipmentIds: ['dripper', 'cupping-spoon'],
    relatedLessonIds: ['exp-roast-levels', 'exp-sensory-basics', 'cul-waves-specialty'],
    asOf: AS_OF,
    sources: ['brand-wiki-tim-wendelboe', 'atlas-wiki-wbc'],
    confidence: 'rule-of-thumb',
  },

  // ───────────────────────────── equipment ─────────────────────────────
  {
    id: 'la-marzocco',
    kind: 'equipment',
    name: L('La Marzocco', 'La Marzocco'),
    country: L('意大利', 'Italy'),
    founded: 1927,
    knownFor: L(
      '1927 年由 Bambi 兄弟在佛罗伦萨创办的商用意式咖啡机制造商，许多精品咖啡馆的吧台上都能看到它；公司称 1970 年的 GS 是早期的双锅炉机型之一。',
      'A Florence maker of commercial espresso machines founded in 1927 by the Bambi brothers and seen on many specialty café counters; the company describes its 1970 GS as an early dual-boiler design.',
    ),
    signature: [
      L('Linea 商用机', 'Linea (commercial)'),
      L('GS3 / Linea Mini 家用与小型机', 'GS3 and Linea Mini (home/small)'),
    ],
    learnFromIt: L(
      '“双锅炉”指冲煮用水和蒸汽各用一个锅炉，温度可以分开控制，所以一边萃取一边打奶也比较稳定。认识冲煮头、蒸汽棒、热水口这些部件，能帮你看懂任何一台意式机。',
      '“Dual boiler” means brew water and steam come from separate boilers, so their temperatures are controlled separately and you can brew and steam at once. Knowing the group head, steam wand and hot-water outlet helps you read any espresso machine.',
    ),
    safetyNote: S_MACHINE,
    relatedDrinkIds: ['espresso-shot', 'cappuccino'],
    relatedEquipmentIds: ['espresso-machine', 'portafilter', 'basket', 'milk-pitcher'],
    relatedLessonIds: ['esp-meet-the-machine', 'esp-milk-basics'],
    asOf: AS_OF,
    sources: ['brand-wiki-la-marzocco', 'atlas-manufacturer-manuals'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'breville',
    kind: 'equipment',
    name: L('铂富', 'Breville'),
    country: L('澳大利亚', 'Australia'),
    founded: 1932,
    knownFor: L(
      '1932 年创立于悉尼的家电公司，在英国和欧洲以 Sage 品牌销售；以带内置磨豆机的家用意式机出名，2020 年收购了美国磨豆机品牌 Baratza。',
      'A Sydney appliance company founded in 1932, sold as Sage in the UK and Europe; known for home espresso machines with built-in grinders, and in 2020 it bought the US grinder maker Baratza.',
    ),
    signature: [
      L('Barista Express（内置磨豆机）', 'Barista Express (built-in grinder)'),
      L('Bambino 小型意式机', 'Bambino compact machine'),
    ],
    learnFromIt: L(
      '很多家用机会附带“双层（加压）粉碗”和“单层粉碗”。加压粉碗能让预磨粉也打出类似油脂的泡沫，但会掩盖研磨度变化；单层粉碗对研磨更敏感，更适合练习调参。具体以说明书为准。',
      'Many home machines ship with dual-wall (pressurised) and single-wall baskets. Pressurised baskets make foam that looks like crema even with pre-ground coffee but hide grind changes; single-wall baskets respond to grind, which is better for learning to dial in. Check your manual.',
    ),
    safetyNote: S_MACHINE,
    relatedDrinkIds: ['espresso-shot', 'caffe-latte'],
    relatedEquipmentIds: ['espresso-machine', 'basket', 'grinder', 'tamper'],
    relatedLessonIds: ['esp-meet-the-machine', 'esp-diagnosis'],
    asOf: AS_OF,
    sources: ['brand-wiki-breville', 'brand-dcn-baratza', 'atlas-manufacturer-manuals', 'atlas-practice-consensus'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'delonghi',
    kind: 'equipment',
    name: L('德龙', 'De’Longhi'),
    country: L('意大利', 'Italy'),
    founded: 1902,
    knownFor: L(
      '源自 1902 年特雷维索的一家零件作坊，如今是大型家电公司，生产手动意式机和全自动“豆到杯”咖啡机。',
      'Traces back to a parts workshop in Treviso in 1902; now a large appliance maker producing manual espresso machines and fully automatic bean-to-cup machines.',
    ),
    signature: [
      L('Dedica 小型泵压意式机', 'Dedica compact pump machine'),
      L('Magnifica 全自动咖啡机', 'Magnifica bean-to-cup machine'),
    ],
    learnFromIt: L(
      '全自动咖啡机在机器内部完成磨豆、定量、压粉和萃取。对照你学过的手动流程，就能明白每个按钮背后替你做了哪一步；你仍然可以选豆子、浓度和杯量。',
      'A bean-to-cup machine grinds, doses, tamps and brews inside. Compare it with the manual workflow you learned to see which step each button does for you — you still choose the beans, strength and cup size.',
    ),
    safetyNote: S_MACHINE,
    relatedDrinkIds: ['espresso-shot', 'cappuccino'],
    relatedEquipmentIds: ['espresso-machine', 'milk-frother'],
    relatedLessonIds: ['esp-workflow', 'esp-meet-the-machine'],
    asOf: AS_OF,
    sources: ['brand-wiki-delonghi', 'atlas-manufacturer-manuals'],
    confidence: 'rule-of-thumb',
  },
  {
    id: 'bialetti',
    kind: 'equipment',
    name: L('比乐蒂', 'Bialetti'),
    country: L('意大利', 'Italy'),
    founded: 1919,
    knownFor: L(
      'Alfonso Bialetti 的金属作坊始于 1919 年；1933 年推出的八角形铝制摩卡壶 Moka Express 成了意大利家庭厨房的经典。',
      'Alfonso Bialetti’s metal workshop dates from 1919; the eight-sided aluminium Moka Express he launched in 1933 became a fixture of Italian home kitchens.',
    ),
    signature: [
      L('Moka Express 摩卡壶（1933）', 'Moka Express stovetop pot (1933)'),
    ],
    learnFromIt: L(
      '摩卡壶靠下壶水蒸气的压力把热水推过咖啡粉，压力只有意式机的一小部分，所以它做的是浓郁的炉火咖啡，而不是真正的意式浓缩。',
      'A moka pot uses steam pressure in the lower chamber to push hot water through the coffee — only a fraction of an espresso machine’s pressure — so it makes strong stovetop coffee, not true espresso.',
    ),
    safetyNote: L(
      '摩卡壶是加压容器：水位低于安全阀、不压粉、不空烧；加热时只握把手。安全阀和密封圈按说明书检查。',
      'A moka pot is a pressurised vessel: fill water below the safety valve, don’t tamp the coffee, never heat it empty, and hold only the handle. Check the valve and gasket as the manual says.',
    ),
    relatedDrinkIds: ['moka-pot-coffee'],
    relatedEquipmentIds: ['moka-pot'],
    relatedLessonIds: ['cul-espresso-bar', 'lit-tools-safety'],
    asOf: AS_OF,
    sources: ['atlas-bialetti', 'atlas-manufacturer-manuals'],
    confidence: 'verified',
  },
  {
    id: 'hario',
    kind: 'equipment',
    name: L('HARIO', 'HARIO'),
    country: L('日本', 'Japan'),
    founded: 1921,
    knownFor: L(
      '1921 年在东京创立的耐热玻璃制造商；2000 年代中期推出的 V60 锥形滤杯（带螺旋肋条、底部一个大孔）在全世界的手冲吧台上都很常见。',
      'A Tokyo heat-resistant-glass maker founded in 1921; its V60 cone dripper (spiral ribs, one large hole), launched in the mid-2000s, is common on pour-over bars worldwide.',
    ),
    signature: [
      L('V60 锥形滤杯', 'V60 cone dripper'),
      L('Buono 细口手冲壶', 'Buono gooseneck kettle'),
    ],
    learnFromIt: L(
      'V60 出口大、阻力小，水流速度主要取决于你的注水方式和研磨度。这让它很灵活，但也意味着注水手法的变化会直接影响结果。',
      'The V60’s large outlet offers little resistance, so flow depends mostly on your pouring and grind. That makes it flexible — and means changes in your pour show up directly in the cup.',
    ),
    safetyNote: S_GLASS,
    relatedDrinkIds: ['pourover-cone', 'japanese-iced-pourover'],
    relatedEquipmentIds: ['dripper', 'paper-filter', 'gooseneck-kettle'],
    relatedLessonIds: ['po-meet-the-gear', 'po-ratio-bloom'],
    asOf: AS_OF,
    sources: ['atlas-hario-v60', 'brand-general-reference'],
    confidence: 'verified',
  },
  {
    id: 'kalita',
    kind: 'equipment',
    name: L('Kalita', 'Kalita'),
    country: L('日本', 'Japan'),
    founded: 1958,
    knownFor: L(
      '1958 年在东京日本桥创立，最初做咖啡滤纸，后来扩展到各类咖啡器具；最为人熟知的是平底、三个小孔的 Wave 滤杯和配套的波纹滤纸。',
      'Founded in Nihonbashi, Tokyo, in 1958, starting with paper filters before widening into coffee gear; best known for the flat-bottomed, three-hole Wave dripper and its fluted filters.',
    ),
    signature: [
      L('Wave 平底滤杯', 'Wave flat-bottom dripper'),
      L('Wave 波纹滤纸', 'Wave fluted filters'),
    ],
    learnFromIt: L(
      '和锥形滤杯相比，平底加小孔会限制流速、让粉床更平，很多人觉得它对注水手法更宽容。这是一个常见经验，不是定律——同一包豆子分别用两种滤杯冲，自己比较。',
      'Compared with a cone, a flat bed and small holes slow the flow and keep the bed even; many people find it more forgiving of pouring. That is a common rule of thumb, not a law — brew the same beans in both and compare.',
    ),
    safetyNote: S_HOT_WATER,
    relatedDrinkIds: ['pourover-cone'],
    relatedEquipmentIds: ['dripper', 'paper-filter'],
    relatedLessonIds: ['po-meet-the-gear', 'po-taste-iterate'],
    asOf: AS_OF,
    sources: ['brand-homebarista-pourover', 'atlas-practice-consensus'],
    confidence: 'verified',
  },
  {
    id: 'melitta',
    kind: 'equipment',
    name: L('Melitta', 'Melitta'),
    country: L('德国', 'Germany'),
    founded: 1908,
    knownFor: L(
      '1908 年德累斯顿的家庭主妇 Melitta Bentz 为咖啡滤纸申请了专利，并以此创立公司；如今仍生产滤纸、滤杯和咖啡。',
      'In 1908 Dresden housewife Melitta Bentz patented a paper coffee filter and founded the company on it; it still makes filters, drippers and coffee.',
    ),
    signature: [
      L('纸质咖啡滤纸（1908）', 'Paper coffee filter (1908)'),
      L('Melitta 锥形滤杯', 'Melitta cone filter holder'),
    ],
    learnFromIt: L(
      '滤纸能拦住细粉和大部分油脂，所以纸滤咖啡通常比法压壶更清澈、口感更轻。这个一百多年前的小发明，至今仍决定着手冲的风格。',
      'Paper traps fine particles and most oils, so paper-filtered coffee is usually clearer and lighter than French press. A small invention over a century old still shapes how pour-over tastes.',
    ),
    safetyNote: S_HOT_WATER,
    relatedDrinkIds: ['pourover-cone', 'french-press-coffee'],
    relatedEquipmentIds: ['dripper', 'paper-filter'],
    relatedLessonIds: ['po-meet-the-gear', 'cul-origins-legends'],
    asOf: AS_OF,
    sources: ['atlas-melitta'],
    confidence: 'verified',
  },
  {
    id: 'chemex',
    kind: 'equipment',
    name: L('Chemex', 'Chemex'),
    country: L('美国', 'United States'),
    founded: 1941,
    knownFor: L(
      '化学家 Peter Schlumbohm 1941 年发明的沙漏形玻璃咖啡壶，配木质腰圈和皮绳，被纽约现代艺术博物馆收藏。',
      'An hourglass glass brewer with a wooden collar and leather tie, invented by chemist Peter Schlumbohm in 1941 and held in the collection of New York’s Museum of Modern Art.',
    ),
    signature: [
      L('Chemex 玻璃咖啡壶', 'Chemex glass coffeemaker'),
      L('加厚的专用滤纸', 'Thick bonded filters'),
    ],
    learnFromIt: L(
      'Chemex 的滤纸比一般滤纸厚，拦得住更多油脂和细粉，所以常被形容为特别干净。同样的豆子，换一种滤纸就能尝到口感差别。',
      'Chemex filters are thicker than most, holding back more oils and fines, so the cup is often described as especially clean. Same beans, different paper — you can taste the difference.',
    ),
    safetyNote: S_GLASS,
    relatedDrinkIds: ['chemex-brew'],
    relatedEquipmentIds: ['chemex', 'paper-filter', 'gooseneck-kettle'],
    relatedLessonIds: ['po-meet-the-gear'],
    asOf: AS_OF,
    sources: ['atlas-moma-chemex'],
    confidence: 'verified',
  },
  {
    id: 'aeropress',
    kind: 'equipment',
    name: L('爱乐压', 'AeroPress'),
    country: L('美国', 'United States'),
    founded: 2005,
    knownFor: L(
      '发明家 Alan Adler 设计的手压式咖啡器，2005 年 11 月面市；结合浸泡和轻微加压，轻便耐用，常被带去旅行。',
      'A hand-pressed brewer designed by inventor Alan Adler and released in November 2005; it combines steeping with gentle pressure and is light and sturdy enough to travel.',
    ),
    signature: [
      L('AeroPress 原版', 'AeroPress Original'),
    ],
    learnFromIt: L(
      '爱乐压有正放、倒置、不同粉水比和浸泡时间等许多做法，爱好者甚至办比赛比较各种配方。这正说明：没有唯一正确的配方，只有你喜欢的那个起点。',
      'People brew the AeroPress upright or inverted, with many ratios and steep times, and enthusiasts even hold contests comparing recipes. It proves the point: there is no single correct recipe, only a starting point you like.',
    ),
    safetyNote: L(
      '按压时把杯子放稳、慢慢压；热水和热的筒身会烫手。',
      'Press slowly onto a sturdy mug; the hot water and chamber can scald.',
    ),
    relatedDrinkIds: ['aeropress-coffee'],
    relatedEquipmentIds: ['aeropress', 'kettle', 'scale'],
    relatedLessonIds: ['lit-brewing-concepts', 'po-taste-iterate'],
    asOf: AS_OF,
    sources: ['atlas-aeropress'],
    confidence: 'verified',
  },
  {
    id: 'comandante',
    kind: 'equipment',
    name: L('Comandante', 'Comandante'),
    country: L('德国', 'Germany'),
    founded: 2012,
    knownFor: L(
      '慕尼黑附近的手摇磨豆机品牌，2012 年由经营精品烘焙坊的 Braune 家族创立；C40 是它的代表型号。',
      'A hand-grinder brand near Munich, founded in 2012 by the Braune family, who also run a specialty roastery; the C40 is its best-known model.',
    ),
    signature: [
      L('C40 手摇磨豆机', 'C40 hand grinder'),
    ],
    learnFromIt: L(
      '网上的配方常写“磨豆机第 N 格”，但格数只在同一型号的磨豆机之间有参考意义，换一台磨豆机就不能照搬。真正要学的是：太快太酸调细一点，太慢太苦调粗一点，一次只改一个变量。',
      'Recipes online often say “N clicks”, but clicks only mean something on the same grinder model. What transfers is the habit: too fast/sour → a bit finer, too slow/bitter → a bit coarser, one change at a time.',
    ),
    safetyNote: S_HAND_GRINDER,
    relatedDrinkIds: ['pourover-cone', 'aeropress-coffee'],
    relatedEquipmentIds: ['burr-grinder-hand'],
    relatedLessonIds: ['exp-dialing-in', 'lit-brewing-concepts'],
    asOf: AS_OF,
    sources: ['brand-comandante-about', 'brand-ambiente-comandante'],
    confidence: 'verified',
  },
  {
    id: 'baratza',
    kind: 'equipment',
    name: L('Baratza', 'Baratza'),
    country: L('美国', 'United States'),
    founded: 1999,
    knownFor: L(
      '1999 年由 Kyle Anderson 和 Kyra Kennedy 在西雅图地区创办，专做家用电动磨豆机；2020 年被 Breville 集团收购。',
      'Founded in the Seattle area in 1999 by Kyle Anderson and Kyra Kennedy to make home electric grinders; acquired by Breville Group in 2020.',
    ),
    signature: [
      L('Encore 入门电动磨豆机', 'Encore entry-level grinder'),
      L('Sette 与 Vario 系列', 'Sette and Vario series'),
    ],
    learnFromIt: L(
      '刀片式“打豆机”会把豆子打成粗细不一的碎块，而磨盘式磨豆机磨出的颗粒更均匀，萃取也更好控制。对新手来说，磨豆机往往比咖啡机更值得先投入。',
      'A blade “grinder” chops beans into uneven pieces; a burr grinder makes more even particles, so extraction is easier to control. For beginners, the grinder is often a better first investment than the brewer.',
    ),
    safetyNote: S_GRINDER,
    relatedDrinkIds: ['pourover-cone', 'french-press-coffee'],
    relatedEquipmentIds: ['grinder'],
    relatedLessonIds: ['lit-tools-safety', 'exp-dialing-in'],
    asOf: AS_OF,
    sources: ['brand-dcn-baratza', 'atlas-practice-consensus'],
    confidence: 'verified',
  },
  {
    id: 'fellow',
    kind: 'equipment',
    name: L('Fellow', 'Fellow'),
    country: L('美国', 'United States'),
    founded: 2013,
    knownFor: L(
      '2013 年由 Jake Miller 在旧金山创办，第一款产品来自众筹；以可控温的细口电热水壶和外观简洁的家用器具出名，2019 年推出 Ode 磨豆机。',
      'Founded in San Francisco in 2013 by Jake Miller, with a crowdfunded first product; known for temperature-controlled gooseneck kettles and minimalist home gear, and launched the Ode grinder in 2019.',
    ),
    signature: [
      L('Stagg EKG 控温细口电水壶', 'Stagg EKG electric gooseneck kettle'),
      L('Ode 磨豆机', 'Ode grinder'),
    ],
    learnFromIt: L(
      '细口壶让你能控制水流的粗细和落点，控温功能让你能一次只改一个变量（比如只改水温）。工具不会替你做决定，但能让对比更公平。',
      'A gooseneck lets you control the size and placement of the stream, and temperature control lets you change one variable at a time (e.g. only water temperature). Tools don’t decide for you, but they make comparisons fairer.',
    ),
    safetyNote: S_HOT_WATER,
    relatedDrinkIds: ['pourover-cone'],
    relatedEquipmentIds: ['gooseneck-kettle', 'grinder', 'thermometer'],
    relatedLessonIds: ['po-ratio-bloom', 'exp-water'],
    asOf: AS_OF,
    sources: ['brand-builtin-fellow'],
    confidence: 'verified',
  },
  {
    id: 'timemore',
    kind: 'equipment',
    name: L('泰摩', 'Timemore'),
    country: L('中国', 'China'),
    founded: 2012,
    knownFor: L(
      '2012 年 7 月正式成立的手冲器具品牌（多数资料称总部在上海），以栗子系列手摇磨豆机和带计时功能的电子秤出名。',
      'A pour-over gear brand officially founded in July 2012 (most sources place it in Shanghai), known for its Chestnut hand grinders and scales with built-in timers.',
    ),
    signature: [
      L('栗子 C2 等手摇磨豆机（2018 年起）', 'Chestnut C2 and related hand grinders (from 2018)'),
      L('黑镜计时电子秤', 'Black Mirror timing scale'),
    ],
    learnFromIt: L(
      '一台带计时的秤能同时告诉你粉量、水量和时间，这正是计算粉水比和复盘一杯咖啡所需的三项数据。平价的好工具让更多人能在家练手冲。',
      'A scale with a timer gives you dose, water and time at once — the three numbers you need to work out a ratio and review a brew. Affordable, decent tools let more people practise pour-over at home.',
    ),
    safetyNote: S_HAND_GRINDER_HOT_WATER,
    relatedDrinkIds: ['pourover-cone'],
    relatedEquipmentIds: ['scale', 'timer', 'burr-grinder-hand'],
    relatedLessonIds: ['po-ratio-bloom', 'lit-brewing-concepts'],
    asOf: AS_OF,
    sources: ['brand-timemore-faq', 'brand-coffeegeek-timemore'],
    confidence: 'verified',
  },
];

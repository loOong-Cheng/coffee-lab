/**
 * Equipment catalog. Owner: coffee-curriculum (atlas).
 *
 * Defines every baseline id from docs/CONTRACTS.md §2 plus a few extras used by
 * the Drink Atlas / explore track (saucepan, jebena, dallah, shaker,
 * fine-strainer, tds-meter, cleaning-brush, cupping-spoon).
 *
 * `essentialFor` convention: TrackId values ('espresso' | 'pourover') meaning
 * "needed for that core path's real-world practice". Omitted = optional upgrade.
 * Safety text is short and visible; machine-specific procedures always defer
 * to the manufacturer's manual.
 */
import type { Equipment, LocalizedText } from '../domain/contracts';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

const HOT_WATER = L(
  '热水和沸水会造成烫伤：倒水时手远离出水口，壶放稳，别让儿童靠近。',
  'Hot and boiling water can scald: keep hands clear of the spout, set kettles down on a stable surface, keep children away.',
);

export const equipment: Equipment[] = [
  // ── espresso ──
  {
    id: 'espresso-machine',
    category: 'espresso',
    name: L('意式咖啡机', 'Espresso machine'),
    description: L(
      '用加压热水快速穿过压实的细咖啡粉，做出浓缩咖啡。家用机型差别很大（单锅炉、双锅炉、热交换、胶囊），按键与预热时间请看说明书。',
      'Pushes pressurised hot water through a compact bed of fine coffee to make espresso. Home machines vary a lot (single boiler, dual boiler, heat exchanger, pods) — check your manual for controls and warm-up time.',
    ),
    safety: L(
      '冲煮头、蒸汽棒和金属部件都很烫；蒸汽可在瞬间烫伤。机器带电带压——只做说明书允许的日常清洁，除垢、反冲洗和任何拆卸都请严格按厂家说明。',
      'The group head, steam wand and metal parts get very hot; steam burns instantly. The machine is electrical and pressurised — do only the daily cleaning your manual allows; descaling, backflushing and any disassembly: follow the manufacturer’s instructions.',
    ),
    essentialFor: ['espresso'],
  },
  {
    id: 'portafilter',
    category: 'espresso',
    name: L('冲煮手柄（手柄）', 'Portafilter'),
    description: L(
      '带把手的金属座，装着粉碗，锁进冲煮头里。冲煮后会很烫。',
      'The handled metal holder that carries the basket and locks into the group head. It is hot after brewing.',
    ),
    safety: L('刚冲煮完的手柄金属部分很烫，只握把手。', 'Right after brewing the metal is hot — hold it by the handle only.'),
    essentialFor: ['espresso'],
  },
  {
    id: 'basket',
    category: 'espresso',
    name: L('粉碗', 'Filter basket'),
    description: L(
      '放在手柄里、底部有细孔的金属碗，决定大致的粉量（单份、双份）。粉量最好参考粉碗的标称容量。',
      'The perforated metal cup inside the portafilter; its size sets the rough dose range (single, double). Start from the basket’s rated dose.',
    ),
    essentialFor: ['espresso'],
  },
  {
    id: 'tamper',
    category: 'espresso',
    name: L('压粉锤', 'Tamper'),
    description: L(
      '把粉饼压平压实的工具，直径应与粉碗匹配。目标是“平整、一致”，不是“越用力越好”。',
      'Presses the coffee bed level and compact; its diameter should match your basket. The goal is level and consistent, not maximum force.',
    ),
    essentialFor: ['espresso'],
  },
  {
    id: 'distribution-tool',
    category: 'espresso',
    name: L('布粉器', 'Distribution tool'),
    description: L(
      '在压粉前把粉打散、铺匀的工具（如针式布粉器或旋转布粉器）。可选，用手指轻敲也能起步。',
      'Breaks up clumps and evens the grounds before tamping (needle or spinning style). Optional — gentle tapping works to start.',
    ),
    safety: L('针式工具很尖，用后收好。', 'Needle tools are sharp — store them safely.'),
  },
  // ── grinding ──
  {
    id: 'grinder',
    category: 'grinding',
    name: L('电动磨豆机', 'Electric grinder'),
    description: L(
      '把咖啡豆磨成需要的粗细。锥刀或平刀的“磨盘式”磨豆机比刀片式更均匀。研磨刻度只在同一台磨豆机上有参考意义。',
      'Grinds beans to the size each method needs. Burr grinders (conical or flat) give more even particles than blade grinders. Grind numbers only mean something on that same grinder.',
    ),
    safety: L(
      '刀盘锋利且转速很高：手指和工具绝不伸进进豆口或出粉口；清理前先断电拔插头，清洁方法按厂家说明。',
      'Burrs are sharp and spin fast: never put fingers or tools into the hopper throat or chute; unplug before any cleaning, and clean only as the manufacturer describes.',
    ),
    essentialFor: ['espresso', 'pourover'],
  },
  {
    id: 'burr-grinder-hand',
    category: 'grinding',
    name: L('手摇磨豆机', 'Hand burr grinder'),
    description: L(
      '手摇的磨盘式磨豆机，安静、便携，适合手冲；部分型号也能磨意式粉，但会比较费力。',
      'A hand-cranked burr grinder: quiet and portable, great for pour-over; some models can reach espresso fineness, with more effort.',
    ),
    safety: L('刀盘锋利，清理时不要用手指摸刀刃。', 'Burrs are sharp — don’t run fingers over the cutting edges when cleaning.'),
  },
  // ── measuring ──
  {
    id: 'scale',
    category: 'measuring',
    name: L('咖啡秤（电子秤）', 'Scale'),
    description: L(
      '精确到 0.1 克的秤最理想。咖啡粉和出液都按“克”称，比用勺子和刻度准确得多。',
      'Ideally reads to 0.1 g. Weighing coffee and beverage in grams is far more repeatable than scoops or volume marks.',
    ),
    safety: L('电子秤别放在冲煮头或蒸汽下长期受潮，溅水后擦干。', 'Keep electronic scales out of constant steam and drips; wipe spills dry.'),
    essentialFor: ['espresso', 'pourover'],
  },
  {
    id: 'timer',
    category: 'measuring',
    name: L('计时器', 'Timer'),
    description: L(
      '记录萃取或浸泡时间。手机计时器、带计时功能的咖啡秤都可以。时间是观察结果，不是唯一目标。',
      'Tracks extraction or steep time. A phone or a timer-scale works. Time is an observation, not the only goal.',
    ),
    essentialFor: ['espresso', 'pourover'],
  },
  {
    id: 'thermometer',
    category: 'measuring',
    name: L('温度计', 'Thermometer'),
    description: L(
      '测量水温或奶温。可选：很多人用“刚离火的沸水”或手摸拉花缸外壁来估计。',
      'Measures water or milk temperature. Optional — many people use “just off the boil” or the feel of the pitcher wall.',
    ),
  },
  {
    id: 'tds-meter',
    category: 'measuring',
    name: L('TDS 水质笔', 'TDS meter (water pen)'),
    description: L(
      '估测水中溶解固体总量（TDS）的便宜小工具，能帮你比较不同的水。它不能告诉你具体是哪些矿物质。',
      'An inexpensive pen that estimates total dissolved solids in water, useful for comparing waters. It cannot tell you which minerals are present.',
    ),
  },
  // ── water ──
  {
    id: 'kettle',
    category: 'water',
    name: L('烧水壶', 'Kettle'),
    description: L(
      '烧热水用。普通水壶可用于法压壶、美式加水等；手冲最好用细口壶控制水流。',
      'Heats water. A regular kettle is fine for French press or topping up an americano; pour-over is easier with a gooseneck.',
    ),
    safety: HOT_WATER,
  },
  {
    id: 'gooseneck-kettle',
    category: 'water',
    name: L('细口手冲壶', 'Gooseneck kettle'),
    description: L(
      '细长壶嘴让水流可控，便于手冲时稳定、分段注水。有些型号可以设定温度。',
      'A slim spout gives a controllable stream for steady, staged pour-over pours. Some models hold a set temperature.',
    ),
    safety: HOT_WATER,
    essentialFor: ['pourover'],
  },
  {
    id: 'water-filter',
    category: 'water',
    name: L('净水滤芯 / 滤水壶', 'Water filter'),
    description: L(
      '去除余氯等异味，部分滤芯还能调节硬度，减少咖啡机结垢。适合什么滤芯取决于当地水质和机器说明书。',
      'Removes chlorine and other off-tastes; some cartridges also reduce hardness to limit machine scale. The right choice depends on your local water and your machine manual.',
    ),
  },
  // ── brewers ──
  {
    id: 'dripper',
    category: 'brewer',
    name: L('手冲滤杯', 'Pour-over dripper'),
    description: L(
      '放滤纸、承接咖啡粉的漏斗，常见有锥形（如 V60 式）和平底（如蛋糕杯式）。形状和出水孔会影响流速，但没有“唯一正确”的滤杯。',
      'The cone or flat-bottom funnel that holds the filter and grounds (cone “V60-style”, flat “wave-style”, etc.). Shape and holes affect flow, but no single dripper is “correct”.',
    ),
    essentialFor: ['pourover'],
  },
  {
    id: 'paper-filter',
    category: 'brewer',
    name: L('滤纸', 'Paper filter'),
    description: L(
      '拦住咖啡粉和部分油脂，让杯子更干净。尺寸和形状要与滤杯匹配；冲煮前用热水润湿可减少纸味并预热器具。',
      'Holds back grounds and some oils for a clean cup. Match size and shape to your dripper; rinsing with hot water reduces papery taste and preheats the gear.',
    ),
    essentialFor: ['pourover'],
  },
  {
    id: 'chemex',
    category: 'brewer',
    name: L('Chemex 手冲壶', 'Chemex'),
    description: L(
      '一体式玻璃手冲壶，配较厚的专用滤纸，杯感通常很干净。由化学家 Peter Schlumbohm 于 1941 年设计。',
      'A one-piece glass pour-over brewer with thick bonded filters, usually giving a very clean cup. Designed by chemist Peter Schlumbohm in 1941.',
    ),
    safety: L('玻璃器具遇冷热骤变可能破裂；倒咖啡时握木质腰箍或把手部位。', 'Glass can crack with sudden temperature changes; hold it by the wooden collar when pouring.'),
  },
  {
    id: 'french-press',
    category: 'brewer',
    name: L('法压壶', 'French press'),
    description: L(
      '浸泡式冲煮：粗粉与热水一起浸泡几分钟，再用金属滤网压下分离。杯中油脂和细粉较多，口感厚。',
      'Immersion brewing: coarse coffee steeps in hot water for a few minutes, then a mesh plunger separates it. More oils and fines reach the cup, so it feels fuller.',
    ),
    safety: L(
      '缓慢下压；若压不动，别硬压——提起滤网、搅一下再慢压，否则热咖啡可能喷出或玻璃破裂。',
      'Press slowly. If it resists, don’t force it — lift, stir, and press gently again; forcing can spray hot coffee or crack the glass.',
    ),
  },
  {
    id: 'aeropress',
    category: 'brewer',
    name: L('爱乐压（AeroPress）', 'AeroPress'),
    description: L(
      '先浸泡、再用手的轻压力把咖啡推过滤纸的小型冲煮器。耐摔、便携，配方变化极多。2005 年由发明家 Alan Adler 推出。',
      'A small brewer that steeps, then uses gentle hand pressure to push coffee through a paper filter. Sturdy, portable and endlessly tweakable. Introduced by inventor Alan Adler in 2005.',
    ),
    safety: L(
      '杯子要结实、放稳，下压要轻而稳。新手先用正放法；倒置法翻转时容易打翻热水。',
      'Use a sturdy mug on a stable surface and press gently. Beginners should start upright — the inverted method can tip over while flipping.',
    ),
  },
  {
    id: 'moka-pot',
    category: 'brewer',
    name: L('摩卡壶', 'Moka pot'),
    description: L(
      '炉上加热的三段式金属壶：下壶水受热产生压力，把水推过粉槽进入上壶。做出的咖啡浓郁，但压力远低于意式咖啡机。',
      'A three-part stovetop pot: heating the base builds pressure that pushes water up through the coffee into the top chamber. Strong coffee, but at far lower pressure than an espresso machine.',
    ),
    safety: L(
      '下壶有压力：加水不要超过安全阀，绝不堵住安全阀，粉不要压实；壶体滚烫，只握把手；加热中和刚离火时不要拧开。密封圈与安全阀的检查按厂家说明。',
      'The base is pressurised: fill no higher than the safety valve, never block the valve, don’t tamp the coffee; the body is very hot — hold the handle only; never unscrew it while heating or just off the heat. Check gasket and valve per the manufacturer.',
    ),
  },
  {
    id: 'cold-brew-jar',
    category: 'brewer',
    name: L('冷萃瓶', 'Cold brew jar'),
    description: L(
      '带滤网或滤袋的大瓶子，用于冷水长时间浸泡咖啡。普通干净的密封罐加滤纸也可以。',
      'A large jar with a mesh or filter bag for long cold-water steeping. A clean lidded jar plus a filter also works.',
    ),
    safety: L('冷萃要冷藏、用干净容器，几天内喝完。', 'Keep cold brew refrigerated, use clean containers, and finish it within a few days.'),
  },
  {
    id: 'ibrik',
    category: 'brewer',
    name: L('土耳其咖啡壶（cezve / ibrik）', 'Cezve / ibrik'),
    description: L(
      '长柄小铜壶或不锈钢壶，用来在小火上煮极细的咖啡粉，形成泡沫。',
      'A small long-handled pot (often copper or steel) for slowly heating very finely ground coffee on low heat to form foam.',
    ),
    safety: L('起泡后几秒内就会溢出，全程看着火；只握长柄。', 'Foam can boil over within seconds — never leave it unattended; hold only the long handle.'),
  },
  {
    id: 'phin',
    category: 'brewer',
    name: L('越南滴滤壶（phin）', 'Vietnamese phin filter'),
    description: L(
      '放在杯口上的金属小滤器，带压片和盖子，咖啡缓慢滴入杯中，通常 4–5 分钟。',
      'A small metal filter that sits on the cup, with a press plate and lid; coffee drips slowly into the cup, usually over 4–5 minutes.',
    ),
    safety: L('金属滤器注水后很烫，移开时用盖子当垫子或用隔热夹。', 'The metal gets hot once filled — use the lid as a coaster or a heat-safe grip when lifting it off.'),
  },
  {
    id: 'siphon',
    category: 'brewer',
    name: L('虹吸壶', 'Siphon (vacuum brewer)'),
    description: L(
      '上下两个玻璃球：加热下壶，蒸汽压力把水推上去浸泡咖啡；离火冷却后形成负压，咖啡被吸回下壶。冲煮过程很有观赏性。',
      'Two glass chambers: heating the lower one pushes water up to steep the coffee; when heat is removed, cooling creates a vacuum that pulls the coffee back down. A theatrical brew.',
    ),
    safety: L(
      '使用明火或卤素炉、玻璃和热水：放在稳固处，下壶外壁必须干燥，不要空烧，冷却前不要拆开；炉具使用按厂家说明。',
      'Open flame or halogen burner, glass and hot water: keep it on a stable surface, the lower bowl must be dry outside, never heat it empty, and don’t separate parts until cooled. Follow the manufacturer for burner use.',
    ),
  },
  {
    id: 'saucepan',
    category: 'brewer',
    name: L('小锅', 'Saucepan'),
    description: L(
      '普通小奶锅，可以用来煮墨西哥陶罐咖啡、港式奶茶底或简化版的煮咖啡。',
      'An ordinary small pot — handy for café de olla, Hong Kong-style tea base or simple boiled coffee.',
    ),
    safety: HOT_WATER,
  },
  {
    id: 'jebena',
    category: 'brewer',
    name: L('埃塞俄比亚陶壶（jebena）', 'Jebena (Ethiopian clay pot)'),
    description: L(
      '圆肚、细长颈的陶制咖啡壶，埃塞俄比亚和厄立特里亚咖啡仪式的核心器具。家里也可以用小锅做简化版。',
      'A round-bellied, long-necked clay coffee pot at the centre of Ethiopian and Eritrean coffee ceremonies. A saucepan works for a simplified home version.',
    ),
    safety: L('陶壶加热后整体都烫，倒咖啡时用布垫着握颈部。', 'The whole clay pot gets hot — hold the neck with a cloth when pouring.'),
  },
  {
    id: 'dallah',
    category: 'brewer',
    name: L('阿拉伯咖啡壶（dallah）', 'Dallah (Arabic coffee pot)'),
    description: L(
      '有弯曲长嘴的金属咖啡壶，用来冲煮和倒阿拉伯咖啡（常加豆蔻），也是待客的象征。保温壶也常被用来盛装。',
      'A metal pot with a long curved spout used to brew and pour Arabic coffee (often with cardamom) and a symbol of hospitality. A thermos is also commonly used to serve.',
    ),
    safety: L('金属壶身很烫，只握把手。', 'The metal body gets hot — hold the handle only.'),
  },
  {
    id: 'fine-strainer',
    category: 'brewer',
    name: L('细网筛', 'Fine-mesh strainer'),
    description: L(
      '过滤浸泡后的咖啡粉或茶叶（陶罐咖啡、冷萃、港式茶底）。叠一张滤纸会更干净。',
      'Strains grounds or tea leaves after steeping (café de olla, cold brew, Hong Kong-style tea). Line it with a paper filter for a cleaner cup.',
    ),
  },
  // ── milk ──
  {
    id: 'milk-pitcher',
    category: 'milk',
    name: L('拉花缸（奶缸）', 'Milk pitcher'),
    description: L(
      '不锈钢尖嘴奶缸，用来打奶泡和倒奶。奶量通常不超过缸体的三分之一到一半，给奶泡膨胀留空间。',
      'A stainless steel spouted jug for steaming and pouring milk. Fill it only about a third to half full so the milk has room to expand.',
    ),
    safety: L('打完奶后奶缸很烫；蒸汽棒使用前后都要短暂排气并擦拭。', 'The pitcher gets hot after steaming; purge and wipe the steam wand before and after use.'),
  },
  {
    id: 'milk-frother',
    category: 'milk',
    name: L('奶泡器', 'Milk frother'),
    description: L(
      '没有蒸汽棒时的打奶方式：电动打奶器、手持搅拌棒或手动打奶壶。奶泡质地与蒸汽打发不同，但适合入门。',
      'Ways to froth without a steam wand: electric frothing jug, handheld whisk or manual plunger jug. The foam differs from steamed milk but is fine to start.',
    ),
    safety: L('电动款不要浸水，按说明书清洗；加热后的奶和容器都烫。', 'Don’t immerse electric bases in water — clean per the manual; heated milk and jugs are hot.'),
  },
  // ── serving ──
  {
    id: 'cup',
    category: 'serving',
    name: L('杯子', 'Cup'),
    description: L(
      '任何耐热杯子都可以。预热杯子能让咖啡保温更久。',
      'Any heat-safe cup. Warming it first keeps the coffee hot longer.',
    ),
    essentialFor: ['espresso', 'pourover'],
  },
  {
    id: 'espresso-cup',
    category: 'serving',
    name: L('浓缩咖啡杯', 'Espresso cup'),
    description: L(
      '容量约 60–90 毫升的厚壁小杯，保温好。也可以直接用量杯或小玻璃杯接液称重。',
      'A small thick-walled cup (about 60–90 ml) that holds heat. A shot glass or small jug on the scale works too.',
    ),
  },
  {
    id: 'mug',
    category: 'serving',
    name: L('马克杯', 'Mug'),
    description: L('容量较大的杯子，适合手冲、美式、拿铁和法压壶咖啡。', 'A larger cup for filter coffee, americanos, lattes and French press.'),
  },
  {
    id: 'carafe',
    category: 'serving',
    name: L('分享壶', 'Carafe / server'),
    description: L(
      '承接手冲咖啡的玻璃壶，方便称重、混匀后再分杯。也可以直接把滤杯放在马克杯上。',
      'A glass server that catches pour-over so you can weigh, swirl and share. You can also brew straight into a mug.',
    ),
    safety: L('玻璃壶装热咖啡时握把手，不要直接放在冷湿台面上。', 'Hold a hot glass carafe by its handle, and don’t set it on a cold, wet surface.'),
  },
  {
    id: 'shaker',
    category: 'serving',
    name: L('雪克杯（摇杯）', 'Shaker'),
    description: L(
      '带盖子的摇杯，用来摇出希腊冰咖啡（frappé）那样的泡沫。带紧盖子的罐子也可以。',
      'A lidded shaker for whipping up foam, as in Greek frappé. A tightly lidded jar works too.',
    ),
    safety: L('只摇冷饮，热液体摇晃会产生压力喷出。', 'Shake cold liquids only — shaking hot liquid can build pressure and spray.'),
  },
  {
    id: 'cupping-spoon',
    category: 'serving',
    name: L('杯测勺', 'Cupping spoon'),
    description: L(
      '深一点的圆勺，用来舀咖啡做对比品尝。普通汤勺也可以，每人用自己的勺子更卫生。',
      'A deep round spoon for side-by-side tasting. An ordinary soup spoon works; give each taster their own for hygiene.',
    ),
  },
  // ── cleaning ──
  {
    id: 'knock-box',
    category: 'cleaning',
    name: L('敲渣桶', 'Knock box'),
    description: L(
      '敲掉手柄里用过的粉饼的小桶，中间有包胶横杆。用过的咖啡渣可以堆肥。',
      'A bin with a padded bar for knocking out spent pucks. Used grounds can be composted.',
    ),
  },
  {
    id: 'towel',
    category: 'cleaning',
    name: L('抹布（吧台巾）', 'Bar towel'),
    description: L(
      '准备两块：一块干的擦手柄和粉碗，一块湿的专门擦蒸汽棒，避免交叉污染。',
      'Keep two: a dry one for the portafilter and basket, and a damp one used only for the steam wand to avoid cross-contamination.',
    ),
    essentialFor: ['espresso'],
  },
  {
    id: 'cleaning-brush',
    category: 'cleaning',
    name: L('清洁刷', 'Cleaning brush'),
    description: L(
      '清理冲煮头周围残粉、磨豆机出粉口的小刷子。用于磨豆机时一定先断电。',
      'A small brush for grounds around the group head and the grinder chute. Unplug the grinder first.',
    ),
    safety: L('刷磨豆机前务必拔掉电源；冲煮头刚用过很烫。', 'Always unplug a grinder before brushing it; the group head is hot right after use.'),
  },
];

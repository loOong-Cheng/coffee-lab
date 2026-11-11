/**
 * Track A — Coffee literacy (absolute beginner). Brief §4 Track A.
 * Content describes WHAT is learned; Desktop/Mobile/XR adapters decide HOW.
 * All numbers are illustrative starting points unless marked otherwise.
 */
import type { Activity, Lesson, LocalizedText, Mode, Track } from '../../domain/contracts';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

/** Knowledge activities any 2D adapter can render. */
const CONCEPT: Mode[] = ['desktop', 'mobile'];
/** Reflection can also be done right after a real-world session. */
const REFLECT: Mode[] = ['desktop', 'mobile', 'real-world-guide'];

export const track: Track = {
  id: 'literacy',
  order: 1,
  title: L('咖啡入门', 'Coffee Basics'),
  summary: L(
    '从零开始：咖啡是什么、需要哪些工具、如何安全操作，以及粉量、液重、粉水比这些冲煮的基本词汇。',
    'Start from zero: what coffee is, which tools you need, how to stay safe, and the basic brewing words — dose, yield and ratio.',
  ),
  lessonIds: ['lit-what-is-coffee', 'lit-tools-safety', 'lit-brewing-concepts'],
};

export const lessons: Lesson[] = [
  // ───────────────────────── A1 ─────────────────────────
  {
    id: 'lit-what-is-coffee',
    track: 'literacy',
    level: 'beginner',
    title: L('咖啡是什么？', 'What Is Coffee?'),
    goal: L(
      '说出咖啡豆从哪里来、烘焙和新鲜度如何影响味道，并能用几个简单的词描述一杯咖啡。',
      'Explain where coffee beans come from, how roast and freshness shape flavor, and describe a cup with a few simple words.',
    ),
    prerequisites: [],
    keyConcepts: [
      L('咖啡豆是咖啡樱桃（果实）里的种子', 'A coffee bean is the seed of a fruit, the coffee cherry'),
      L('两大主要品种：阿拉比卡与罗布斯塔', 'Two main species: Arabica and Robusta (Canephora)'),
      L('烘焙程度改变风味侧重，没有绝对的“更好”', 'Roast level shifts flavor emphasis; neither light nor dark is "better"'),
      L('新鲜度：看烘焙日期，喝前再研磨', 'Freshness: check the roast date, grind just before brewing'),
      L('基础风味词：酸质、甜感、苦味、醇厚度、香气', 'Basic taste words: acidity, sweetness, bitterness, body, aroma'),
    ],
    activityIds: [
      'lit-what-is-coffee-cards',
      'lit-what-is-coffee-journey',
      'lit-what-is-coffee-quiz',
      'lit-what-is-coffee-reflect',
    ],
    checkForUnderstanding: ['lit-what-is-coffee-journey', 'lit-what-is-coffee-quiz'],
    safetyNotes: [],
    estimatedMinutes: 12,
    sources: ['nca-what-is-coffee', 'sca-csp', 'sca-csp-catalog', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['lit-tools-safety'],
  },
  // ───────────────────────── A2 ─────────────────────────
  {
    id: 'lit-tools-safety',
    track: 'literacy',
    level: 'beginner',
    title: L('工具与安全', 'Tools & Safety'),
    goal: L(
      '认识家庭冲煮的基本工具及其用途，识别热水、蒸汽、磨豆机和用电的主要风险，并养成防止受伤的习惯。',
      'Name the basic home-brewing tools and what each is for, recognise the main hazards — hot water, steam, grinders, electricity — and build habits that prevent injury.',
    ),
    prerequisites: ['lit-what-is-coffee'],
    keyConcepts: [
      L('电子秤和计时器让冲煮可以重复', 'A scale and a timer make brewing repeatable'),
      L('磨豆机：锥刀/平刀比刀片式更均匀、可调', 'Grinders: burr grinders are more even and adjustable than blade grinders'),
      L('水占一杯咖啡的绝大部分，水质影响味道', 'Water is most of the cup; its quality affects taste'),
      L('热水与蒸汽会烫伤；磨豆机清理前先断电', 'Hot water and steam burn; unplug a grinder before clearing it'),
      L('机器维修交给厂家或专业人员，按说明书清洁', 'Leave repairs to the manufacturer or qualified service; clean per the manual'),
    ],
    activityIds: [
      'lit-tools-safety-cards',
      'lit-tools-safety-routine',
      'lit-tools-safety-quiz',
      'lit-tools-safety-reflect',
    ],
    checkForUnderstanding: ['lit-tools-safety-routine', 'lit-tools-safety-quiz'],
    safetyNotes: [
      L(
        '热水和蒸汽会在一瞬间造成烫伤：壶柄朝内，倒水时远离身体，儿童和宠物远离操作区。',
        'Hot water and steam can scald in an instant: turn handles inward, pour away from your body, keep children and pets clear.',
      ),
      L(
        '磨豆机在清理、卡豆或伸手进去之前必须先拔掉电源，并等刀盘完全停止。绝不要把手指伸进刀盘或豆仓。',
        'Unplug a grinder and wait for the burrs to stop before clearing a jam or reaching in. Never put fingers into the burrs or hopper.',
      ),
      L(
        '电线、插头远离水；手湿时不要插拔电源。设备损坏或漏电时停止使用，交给厂家或专业维修，不要自行拆机。',
        'Keep cords and plugs away from water and never handle plugs with wet hands. If a device is damaged or leaking, stop using it and contact the manufacturer or a qualified technician — do not open it yourself.',
      ),
    ],
    estimatedMinutes: 12,
    sources: ['sca-csp-catalog', 'sca-water-handbook', 'manufacturer-manual', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['lit-brewing-concepts'],
  },
  // ───────────────────────── A3 ─────────────────────────
  {
    id: 'lit-brewing-concepts',
    track: 'literacy',
    level: 'beginner',
    title: L('冲煮的核心概念', 'Brewing Concepts'),
    goal: L(
      '正确使用粉量、液重、比例（粉液比/粉水比）、时间和研磨度这些词；会计算比例；分清“浓度”和“萃取”，并理解任何配方都只是起点。',
      'Use dose, yield, ratio, time and grind correctly; calculate a ratio; tell strength apart from extraction; and understand why every recipe is only a starting point.',
    ),
    prerequisites: ['lit-tools-safety'],
    keyConcepts: [
      L('粉量：放入的干咖啡粉重量', 'Dose: the weight of dry ground coffee'),
      L('液重/注水量：意式看杯中液重，手冲看注水量', 'Yield vs water: espresso counts what lands in the cup; pour-over counts the water poured'),
      L('比例 = 输出 ÷ 粉量（例：18 g → 36 g = 1:2）', 'Ratio = output ÷ dose (e.g. 18 g → 36 g = 1:2)'),
      L('浓度（有多浓）≠ 萃取（溶出了多少）', 'Strength (how concentrated) ≠ extraction (how much dissolved)'),
      L('研磨越细，流速越慢、萃取越多（大致规律）', 'Finer grind → slower flow and more extraction (as a general tendency)'),
      L('口味因人而异：配方是起点，不是标准答案', 'Taste is personal: a recipe is a starting point, not the answer'),
    ],
    activityIds: [
      'lit-brewing-concepts-cards',
      'lit-brewing-concepts-explorer',
      'lit-brewing-concepts-quiz',
      'lit-brewing-concepts-reflect',
    ],
    checkForUnderstanding: ['lit-brewing-concepts-explorer', 'lit-brewing-concepts-quiz'],
    safetyNotes: [],
    estimatedMinutes: 15,
    sources: ['sca-dialing-in', 'ucdavis-ccc-2023', 'sca-immersion-strength', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['esp-meet-the-machine', 'po-meet-the-gear'],
  },
];

export const activities: Activity[] = [
  // ═════════════════════ lit-what-is-coffee ═════════════════════
  {
    id: 'lit-what-is-coffee-cards',
    lessonId: 'lit-what-is-coffee',
    kind: 'explain',
    title: L('从果实到杯子', 'From Fruit to Cup'),
    intro: L('五张卡片，不需要任何术语基础。', 'Five short cards. No jargon needed.'),
    objectiveIds: ['lit.coffee-basics'],
    supportedModes: CONCEPT,
    cards: [
      {
        heading: L('咖啡豆其实是种子', 'A bean that is really a seed'),
        body: L(
          '咖啡树结出红色或黄色的小果实，叫“咖啡樱桃”。大多数果实里有两颗种子，去掉果肉、干燥之后就是生豆。生豆是浅绿色的，几乎没有咖啡香，要经过烘焙才变成我们熟悉的棕色咖啡豆。',
          'Coffee trees grow small red or yellow fruits called coffee cherries. Most cherries hold two seeds. Remove the fruit, dry the seeds, and you have green coffee — pale, grassy and not yet "coffee-smelling". Roasting turns them into the brown beans you know.',
        ),
        illustration: 'coffee-cherry',
        callout: {
          kind: 'culture',
          text: L(
            '约 5% 的果实只有一颗圆形种子，叫“圆豆”。',
            'About 5% of cherries hold a single round seed, called a peaberry.',
          ),
        },
      },
      {
        heading: L('两大品种', 'Two main species'),
        body: L(
          '阿拉比卡（小粒种）通常种在较高海拔、气候较温和的地方，风味常更细腻、酸质更明显。罗布斯塔（中粒种）更耐病、种在较低较热的地方，咖啡因更多，口感常更厚重、苦味更突出，很多意式拼配会用到它。',
          'Arabica usually grows at higher, milder altitudes and often tastes more delicate and acidic. Robusta (Canephora) is hardier, grows lower and warmer, carries more caffeine and tends to taste heavier and more bitter — many espresso blends include some.',
        ),
        illustration: 'arabica-robusta',
        callout: {
          kind: 'tip',
          text: L('“常常”不等于“总是”：同一品种因产地和处理不同，风味差别很大。', '"Often" is not "always": origin and processing change flavor a lot within a species.'),
        },
      },
      {
        heading: L('烘焙决定风味侧重', 'Roast shifts the flavor emphasis'),
        body: L(
          '浅烘焙往往保留更多水果般的酸质和产地特色；深烘焙则偏向焦糖、可可、烘烤和苦甜的味道，酸质较低。两者没有高下之分，只是风格不同——选你喜欢的就好。',
          'Lighter roasts often keep more fruit-like acidity and origin character. Darker roasts lean toward caramel, cocoa, roasty and bittersweet notes, with less acidity. Neither is better — they are different styles, so pick what you enjoy.',
        ),
        illustration: 'roast-levels',
        callout: {
          kind: 'myth',
          text: L(
            '误区：“深烘咖啡因多得多”。按重量算，烘焙度对咖啡因的影响很小；品种和用粉量影响更大。',
            'Myth: "dark roast has far more caffeine." By weight, roast level changes caffeine only slightly; species and how much coffee you use matter more.',
          ),
        },
      },
      {
        heading: L('新鲜度很重要', 'Freshness matters'),
        body: L(
          '烘焙后的豆子会慢慢释放二氧化碳和香气。很多人觉得整豆在烘焙后几天到几周内最好喝；磨成粉后香气流失快得多，所以最好喝之前再磨。用密封、避光、阴凉的容器保存，避免冰箱里的湿气。',
          'Roasted beans slowly release carbon dioxide and aroma. Many people find whole beans taste best from a few days to a few weeks after roasting. Ground coffee loses aroma much faster, so grind just before brewing. Store beans airtight, cool and dark, away from fridge moisture.',
        ),
        illustration: 'bean-bag-roast-date',
        callout: {
          kind: 'tip',
          text: L('买豆时找“烘焙日期”，而不只是“保质期”。', 'Look for a roast date on the bag, not just a best-before date.'),
        },
      },
      {
        heading: L('描述味道的五个词', 'Five words for what you taste'),
        body: L(
          '酸质：明亮、多汁，像水果，不等于变质的“酸”。甜感：像焦糖或熟果。苦味：适量是正常的，像黑巧克力。醇厚度：在嘴里的重量和质感，像脱脂奶与全脂奶的区别。香气：闻到的气味，构成了大部分“风味”。',
          'Acidity: bright and juicy, like fruit — not the same as "gone off". Sweetness: like caramel or ripe fruit. Bitterness: some is normal, like dark chocolate. Body: weight and texture in the mouth, like skim versus whole milk. Aroma: what you smell — most of what we call flavor.',
        ),
        illustration: 'taste-wheel-simple',
        callout: {
          kind: 'tip',
          text: L('没有标准答案：你喜欢的味道就是有效的偏好。', 'There are no wrong answers: what you enjoy is a valid preference.'),
        },
      },
    ],
  },
  {
    id: 'lit-what-is-coffee-journey',
    lessonId: 'lit-what-is-coffee',
    kind: 'sequence',
    title: L('一颗豆子的旅程', "A Bean's Journey"),
    objectiveIds: ['lit.coffee-basics'],
    supportedModes: CONCEPT,
    prompt: L('把咖啡从树上到杯中的过程排好顺序。', 'Put coffee’s journey from tree to cup in order.'),
    hint: L(
      '想一想：哪一步之后咖啡才第一次闻起来像“咖啡”？哪一步会让香气流失最快？',
      'Ask yourself: after which step does coffee first smell like "coffee"? Which step makes aroma fade fastest?',
    ),
    steps: [
      {
        id: 'harvest',
        text: L('采摘成熟的咖啡樱桃', 'Harvest ripe coffee cherries'),
        why: L('成熟度影响甜感，一切从果实开始。', 'Ripeness affects sweetness — everything starts with the fruit.'),
      },
      {
        id: 'process',
        text: L('处理：去除果肉并干燥种子', 'Process: remove the fruit and dry the seeds'),
        why: L('干燥后的生豆才能稳定保存和运输。', 'Dried green coffee can be stored and shipped safely.'),
      },
      {
        id: 'ship',
        text: L('生豆运往烘焙商', 'Ship green coffee to a roaster'),
        why: L('生豆比熟豆稳定得多，所以通常在消费地附近烘焙。', 'Green beans keep far longer than roasted ones, so roasting usually happens near where coffee is drunk.'),
      },
      {
        id: 'roast',
        text: L('烘焙', 'Roast'),
        why: L('烘焙产生了咖啡的香气和颜色。', 'Roasting creates coffee’s aroma and colour.'),
      },
      {
        id: 'rest',
        text: L('静置几天（养豆），然后在几周内喝完', 'Rest a few days, then use within a few weeks'),
        why: L('刚烘好的豆子会大量排气；放太久香气又会变淡。', 'Fresh beans release lots of gas; left too long, aroma fades.'),
      },
      {
        id: 'grind',
        text: L('冲煮前研磨', 'Grind just before brewing'),
        why: L('磨成粉后表面积变大，香气流失很快。', 'Grinding multiplies surface area, so aroma escapes quickly.'),
      },
      {
        id: 'brew',
        text: L('冲煮并品尝', 'Brew and taste'),
        why: L('热水把风味物质溶解出来，进到你的杯子里。', 'Hot water dissolves flavor compounds into your cup.'),
      },
    ],
    misconceptions: [
      {
        earlierStep: 'roast',
        laterStep: 'grind',
        feedback: L(
          '生豆非常坚硬，几乎没有咖啡香——要先烘焙，研磨才有意义。',
          'Green beans are rock-hard and barely smell of coffee — they must be roasted before grinding makes sense.',
        ),
      },
      {
        earlierStep: 'rest',
        laterStep: 'grind',
        feedback: L(
          '先磨粉再长时间存放，香气会很快流失。保存整豆，喝之前再磨。',
          'Grinding first and storing the powder loses aroma fast. Store whole beans and grind right before brewing.',
        ),
      },
      {
        earlierStep: 'process',
        laterStep: 'roast',
        feedback: L('烘焙的是干燥后的种子，不是整颗湿果实。', 'Roasting is done on dried seeds, not on whole wet fruit.'),
      },
    ],
  },
  {
    id: 'lit-what-is-coffee-quiz',
    lessonId: 'lit-what-is-coffee',
    kind: 'quiz',
    title: L('小测：咖啡基础', 'Quick Check: Coffee Basics'),
    objectiveIds: ['lit.coffee-basics'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-bean',
        prompt: L('咖啡豆在植物学上是什么？', 'Botanically, what is a coffee bean?'),
        options: [
          {
            id: 'seed',
            text: L('咖啡樱桃里的种子', 'The seed inside a coffee cherry'),
            correct: true,
            feedback: L('没错！我们烘焙和研磨的是种子。', 'Right — we roast and grind the seed.'),
          },
          {
            id: 'legume',
            text: L('一种豆科植物的豆子', 'A legume, like a kidney bean'),
            correct: false,
            feedback: L('名字里有“豆”，但它不是豆科植物，而是果实的种子。', 'It is called a "bean", but it is not a legume — it is the seed of a fruit.'),
          },
          {
            id: 'whole-fruit',
            text: L('整颗晒干的果实', 'A whole dried berry'),
            correct: false,
            feedback: L('果肉在处理时就被去掉了，只留下种子。', 'The fruit flesh is removed during processing; only the seed remains.'),
          },
        ],
        explanation: L('咖啡豆 = 咖啡樱桃的种子，大多数果实有两颗。', 'Coffee bean = seed of the coffee cherry; most cherries have two.'),
      },
      {
        id: 'q-fresh',
        prompt: L(
          'A 袋：两周前烘焙；B 袋：没有烘焙日期，在柜子里放了一年。哪一袋更可能香气饱满？',
          'Bag A was roasted two weeks ago. Bag B has no roast date and has sat in a cupboard for a year. Which is more likely to smell vibrant?',
        ),
        options: [
          {
            id: 'a',
            text: L('A 袋', 'Bag A'),
            correct: true,
            feedback: L('对。烘焙后几周内的豆子通常香气最明显。', 'Yes. Beans within a few weeks of roasting usually have the most aroma.'),
          },
          {
            id: 'b',
            text: L('B 袋，放越久越醇', 'Bag B — coffee matures like wine'),
            correct: false,
            feedback: L('熟豆不像葡萄酒那样越陈越香，香气会随时间流失。', 'Roasted coffee does not age like wine; its aroma fades over time.'),
          },
          {
            id: 'same',
            text: L('一样，咖啡不会变', 'No difference — coffee does not change'),
            correct: false,
            feedback: L('熟豆会持续排气、氧化，风味会变化。', 'Roasted beans keep degassing and oxidising, so flavor changes.'),
          },
        ],
        explanation: L('看烘焙日期，几周内用完；整豆保存，喝前研磨。', 'Check the roast date and use within a few weeks; keep beans whole until brewing.'),
      },
      {
        id: 'q-roast',
        prompt: L('关于烘焙度，哪种说法最准确？', 'Which statement about roast level is most accurate?'),
        options: [
          {
            id: 'flavor',
            text: L('烘焙度主要改变风味侧重；咖啡因差别很小', 'Roast mainly changes flavor emphasis; caffeine differences are small'),
            correct: true,
            feedback: L('对。“浓不浓”主要取决于你用多少粉、加多少水。', 'Correct. How "strong" a cup is depends mostly on how much coffee and water you use.'),
          },
          {
            id: 'dark-caffeine',
            text: L('深烘咖啡因多得多，所以更提神', 'Dark roast has much more caffeine, so it wakes you up more'),
            correct: false,
            feedback: L('常见误区。深烘味道更“重”，但按重量算咖啡因几乎一样。', 'A common myth. Dark roast tastes "heavier", but by weight caffeine is about the same.'),
          },
          {
            id: 'light-weak',
            text: L('浅烘一定更淡、更没味道', 'Light roast is always weaker and less flavorful'),
            correct: false,
            feedback: L('浅烘往往酸质和香气更突出，冲得浓或淡取决于比例。', 'Light roasts often have more acidity and aroma; strength depends on the ratio you brew.'),
          },
        ],
        explanation: L('烘焙＝风格；浓度＝比例。别把两者混为一谈。', 'Roast = style; strength = ratio. Don’t mix them up.'),
      },
      {
        id: 'q-acidity',
        prompt: L('一杯咖啡喝起来明亮、像柑橘，这最可能在描述什么？', 'A cup tastes bright, like citrus. Which word fits best?'),
        options: [
          {
            id: 'acidity',
            text: L('酸质', 'Acidity'),
            correct: true,
            feedback: L('对！讨喜的酸质常被形容为明亮、多汁。', 'Yes! Pleasant acidity is often described as bright or juicy.'),
          },
          {
            id: 'defect',
            text: L('咖啡坏了', 'The coffee has gone bad'),
            correct: false,
            feedback: L('明亮的果酸不是缺陷，而是很多咖啡的特色。', 'Bright, fruity acidity is not a defect — it is a feature of many coffees.'),
          },
          {
            id: 'body',
            text: L('醇厚度', 'Body'),
            correct: false,
            feedback: L('醇厚度是口感的重量和质感，不是“明亮”的味道。', 'Body is weight and texture in the mouth, not brightness.'),
          },
          {
            id: 'bitter',
            text: L('苦味', 'Bitterness'),
            correct: false,
            feedback: L('苦味更像黑巧克力或烤焦的面包，不是柑橘。', 'Bitterness is more like dark chocolate or toast, not citrus.'),
          },
        ],
        explanation: L('酸质 ≠ 变质。它是一种风味特征。', 'Acidity ≠ spoiled. It is a flavor characteristic.'),
      },
    ],
  },
  {
    id: 'lit-what-is-coffee-reflect',
    lessonId: 'lit-what-is-coffee',
    kind: 'reflect',
    title: L('你的咖啡', 'Your Coffee'),
    supportedModes: REFLECT,
    prompts: [
      L('你平时喝什么咖啡？你喜欢它的哪一点？', 'What coffee do you usually drink, and what do you like about it?'),
      L('用今天学的两个词（酸质、甜感、苦味、醇厚度、香气）描述它。', 'Describe it with two words from today: acidity, sweetness, bitterness, body, aroma.'),
      L('看看家里的咖啡袋：能找到烘焙日期、产地或烘焙度吗？', 'Check a bag at home: can you find the roast date, origin or roast level?'),
    ],
  },

  // ═════════════════════ lit-tools-safety ═════════════════════
  {
    id: 'lit-tools-safety-cards',
    lessonId: 'lit-tools-safety',
    kind: 'explain',
    title: L('工具与安全要点', 'Tools and Safety Essentials'),
    objectiveIds: ['lit.tools', 'lit.safety'],
    supportedModes: CONCEPT,
    safetyNotes: [
      L('热水、蒸汽、磨豆机和用电都有真实风险，请认真读完安全卡片。', 'Hot water, steam, grinders and electricity are real hazards — read the safety cards carefully.'),
    ],
    cards: [
      {
        heading: L('称重，不要估', 'Weigh, don’t guess'),
        body: L(
          '一台精确到 0.1 克的电子秤和一个计时器，是让咖啡可以“重复”的关键。不同豆子密度不同，同样一勺的重量可能差很多。放上容器后按“去皮”归零，只称咖啡或水。',
          'A scale that reads to 0.1 g and a timer are what make coffee repeatable. Beans differ in density, so the same scoop can weigh quite differently. Put your container on, press "tare" to zero it, then weigh only the coffee or water.',
        ),
        illustration: 'scale-timer',
      },
      {
        heading: L('磨豆机：最被低估的工具', 'The grinder: the most underrated tool'),
        body: L(
          '刀盘式磨豆机（锥刀或平刀）把豆子碾磨成大小较均匀的颗粒，并能调粗细；刀片式更像搅碎，粗细不均。研磨度直接影响水流速度和萃取，所以可调、稳定的磨豆机非常重要。',
          'Burr grinders (conical or flat) crush beans into fairly even particles and let you adjust size. Blade grinders chop, leaving a mix of dust and chunks. Grind size directly controls flow and extraction, so an adjustable, consistent grinder matters a lot.',
        ),
        illustration: 'burr-vs-blade',
      },
      {
        heading: L('水与水壶', 'Water and kettles'),
        body: L(
          '一杯冲煮咖啡里绝大部分是水，所以用干净、好喝的水（常用过滤水）。手冲常用细口壶，便于控制水流；意式咖啡机自带加热。水质还会影响机器结垢，按说明书除垢。',
          'Brewed coffee is almost all water, so use clean, good-tasting water — often filtered. A gooseneck kettle gives control for pour-over; espresso machines heat their own water. Water hardness also affects scale build-up in machines — descale as your manual says.',
        ),
        illustration: 'kettle-water',
      },
      {
        heading: L('高温：热水与蒸汽', 'Heat: hot water and steam'),
        body: L(
          '接近沸腾的水几秒钟就能造成烫伤，蒸汽更烫且看不太清。冲煮头、手柄金属部分、蒸汽棒在使用中都很烫。手持把手，倒水时远离身体，壶柄朝内。',
          'Near-boiling water can scald within seconds, and steam is hotter and harder to see. Group heads, metal portafilter parts and steam wands all get hot in use. Hold things by their handles, pour away from your body and turn handles inward.',
        ),
        illustration: 'hazard-heat',
        callout: {
          kind: 'safety',
          text: L(
            '释放蒸汽（排气）时，蒸汽棒朝向接水盘或用湿布包住，永远不要对着人。',
            'When purging a steam wand, aim it into the drip tray or a damp cloth — never toward anyone.',
          ),
        },
      },
      {
        heading: L('磨豆机与用电', 'Grinders and electricity'),
        body: L(
          '磨豆机的刀盘力量很大。清理、卡豆或伸手进豆仓之前，先关机、拔掉插头，等完全停止。电线和插头远离水，手湿时不要碰电源。',
          'Grinder burrs are powerful. Before cleaning, clearing a jam or reaching into the hopper: switch off, unplug and wait until everything stops. Keep cords and plugs away from water and never touch them with wet hands.',
        ),
        illustration: 'hazard-grinder',
        callout: {
          kind: 'safety',
          text: L(
            '漏水、冒烟、异响或线缆破损：立即停用并拔电，联系厂家或专业维修。不要自行打开机壳。',
            'Leaks, smoke, strange noises or damaged cords: stop, unplug and contact the manufacturer or a qualified technician. Never open the housing yourself.',
          ),
        },
      },
      {
        heading: L('随手清洁', 'Clean as you go'),
        body: L(
          '残留的咖啡油脂会变质，让下一杯带出陈旧、哈喇味。每次用完冲洗、擦干工具；更深入的清洁和除垢周期请按产品说明书进行。',
          'Leftover coffee oils go rancid and make the next cup taste stale. Rinse and dry your tools after each use; follow your product manuals for deeper cleaning and descaling schedules.',
        ),
        illustration: 'clean-tools',
      },
    ],
  },
  {
    id: 'lit-tools-safety-routine',
    lessonId: 'lit-tools-safety',
    kind: 'sequence',
    title: L('一次安全、干净的冲煮', 'A Safe, Clean Session'),
    objectiveIds: ['lit.safety'],
    supportedModes: CONCEPT,
    prompt: L('把一次冲煮从开始到收尾的安全习惯排好顺序。', 'Order these habits for a brewing session, from start to clean-up.'),
    hint: L('先检查环境，最后才清洁——而且清洁前要先断电、降温。', 'Check your space first; clean last — and only after switching off and cooling down.'),
    steps: [
      {
        id: 'check',
        text: L('检查：手和电线是干的，台面稳固，工具无损坏', 'Check: dry hands and cords, a stable surface, no damaged tools'),
        why: L('大多数事故在开始之前就能避免。', 'Most accidents can be prevented before you start.'),
      },
      {
        id: 'weigh',
        text: L('称好要用的咖啡豆', 'Weigh the beans you need'),
        why: L('只磨需要的量，剩下的粉不会浪费变质。', 'You grind only what you need, so no leftover powder goes stale.'),
      },
      {
        id: 'grind',
        text: L('盖好盖子研磨，手指远离刀盘', 'Grind with the lid on and fingers clear of the burrs'),
        why: L('刀盘力量很大，盖子能防止豆子飞溅。', 'Burrs are powerful, and the lid stops beans flying out.'),
      },
      {
        id: 'brew',
        text: L('握住把手冲煮，倒水方向远离身体', 'Brew holding handles, pouring away from your body'),
        why: L('热水溅出或打翻时，不会直接烫到你。', 'If hot water splashes or tips, it won’t land on you.'),
      },
      {
        id: 'off',
        text: L('关闭并拔掉水壶、磨豆机的电源', 'Switch off and unplug the kettle and grinder'),
        why: L('断电后再清洁，避免意外启动或触电。', 'Unplugging before cleaning prevents accidental starts and shocks.'),
      },
      {
        id: 'clean',
        text: L('等发烫的部件降温，再冲洗、擦干', 'Let hot parts cool, then rinse and dry'),
        why: L('降温避免烫伤，擦干能防止水接触电器和生锈。', 'Cooling prevents burns; drying keeps water off electrics and prevents rust.'),
      },
    ],
    misconceptions: [
      {
        earlierStep: 'off',
        laterStep: 'clean',
        feedback: L(
          '永远不要清洁通着电或还很烫的设备——先关机拔电、降温。',
          'Never clean an appliance that is still plugged in or hot — switch off, unplug and let it cool first.',
        ),
      },
      {
        earlierStep: 'weigh',
        laterStep: 'grind',
        feedback: L(
          '先称整豆，只磨需要的量；否则多出来的粉很快变质。',
          'Weigh whole beans first and grind only what you need; extra powder goes stale fast.',
        ),
      },
      {
        earlierStep: 'check',
        laterStep: 'brew',
        feedback: L('检查要在接触热水之前完成，而不是之后。', 'Safety checks belong before you handle hot water, not after.'),
      },
    ],
  },
  {
    id: 'lit-tools-safety-quiz',
    lessonId: 'lit-tools-safety',
    kind: 'quiz',
    title: L('小测：遇到情况怎么办？', 'Quick Check: What Would You Do?'),
    objectiveIds: ['lit.tools', 'lit.safety'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-jam',
        prompt: L('磨豆机卡住了，第一步应该做什么？', 'Your grinder jams. What do you do first?'),
        options: [
          {
            id: 'unplug',
            text: L('关机、拔插头，等刀盘完全停止', 'Switch off, unplug, and wait for the burrs to stop'),
            correct: true,
            feedback: L('对。断电后再按说明书处理卡豆。', 'Right. Once it is unplugged, follow the manual to clear it.'),
          },
          {
            id: 'finger',
            text: L('开着机器用手指把豆子拨下去', 'Push the beans down with a finger while it runs'),
            correct: false,
            feedback: L('非常危险！刀盘可能突然转动，造成严重割伤。', 'Very dangerous — the burrs can suddenly catch and cause serious cuts.'),
          },
          {
            id: 'spoon',
            text: L('开着机器用勺子捅一捅', 'Poke it with a spoon while it runs'),
            correct: false,
            feedback: L('金属卷进刀盘会损坏机器并可能飞溅伤人。先断电。', 'Metal caught in the burrs can damage the grinder and fly out. Unplug first.'),
          },
        ],
        explanation: L('任何伸手进去的操作，都从“断电”开始。', 'Anything that involves reaching in starts with unplugging.'),
      },
      {
        id: 'q-purge',
        prompt: L('排放蒸汽棒里的冷凝水时，蒸汽棒应该朝向哪里？', 'When purging a steam wand, where should it point?'),
        options: [
          {
            id: 'tray',
            text: L('接水盘，或用湿布松松包住', 'Into the drip tray, or loosely wrapped in a damp cloth'),
            correct: true,
            feedback: L('对，这样热蒸汽和水不会喷到人。', 'Correct — hot steam and water stay away from people.'),
          },
          {
            id: 'face',
            text: L('朝向自己，方便看清楚', 'Toward yourself so you can see it'),
            correct: false,
            feedback: L('蒸汽能瞬间烫伤皮肤和眼睛，绝不要对着人。', 'Steam can burn skin and eyes instantly — never aim it at anyone.'),
          },
          {
            id: 'air',
            text: L('随便朝空中', 'Anywhere into the air'),
            correct: false,
            feedback: L('喷出的热水可能溅到人或电器上，要有明确的方向。', 'Spitting hot water can hit people or electrics; aim it deliberately.'),
          },
        ],
        explanation: L('蒸汽看不太清，但比沸水更容易烫伤。', 'Steam is hard to see, but it burns more readily than boiling water.'),
      },
      {
        id: 'q-scale',
        prompt: L('为什么建议用电子秤，而不是用勺子量？', 'Why use a scale instead of a scoop?'),
        options: [
          {
            id: 'repeat',
            text: L('不同豆子密度不同，称重才能每次一致', 'Beans vary in density; weighing is the way to repeat a result'),
            correct: true,
            feedback: L('对。能重复，才能知道改了什么带来了什么变化。', 'Yes. If you can repeat it, you can learn what a change actually did.'),
          },
          {
            id: 'scoop-same',
            text: L('其实勺子一样准', 'A scoop is just as accurate'),
            correct: false,
            feedback: L('同一勺浅烘豆和深烘豆的重量可能差不少。', 'A scoop of light-roast and dark-roast beans can weigh noticeably different amounts.'),
          },
          {
            id: 'taste',
            text: L('秤能告诉你咖啡好不好喝', 'A scale tells you whether coffee tastes good'),
            correct: false,
            feedback: L('秤只负责测量，好不好喝由你来判断。', 'A scale only measures; whether it tastes good is your call.'),
          },
        ],
        explanation: L('秤和计时器让你的实验有据可查。', 'A scale and timer turn your brewing into a traceable experiment.'),
      },
      {
        id: 'q-leak',
        prompt: L('你发现咖啡机机身内部在漏水，应该怎么做？', 'You notice water leaking from inside your machine’s housing. What should you do?'),
        options: [
          {
            id: 'service',
            text: L('停用、拔电，查说明书或联系厂家维修', 'Stop, unplug, and check the manual or contact the manufacturer'),
            correct: true,
            feedback: L('对。内部漏水涉及电和高压热水，交给专业人员。', 'Correct. Internal leaks involve electricity and pressurised hot water — leave it to professionals.'),
          },
          {
            id: 'open',
            text: L('自己拆开机壳拧紧接头', 'Open the casing and tighten the fittings yourself'),
            correct: false,
            feedback: L('不安全：机内有电、高温和压力。Coffee Lab 不提供拆机指导。', 'Unsafe: there is electricity, heat and pressure inside. Coffee Lab never gives disassembly instructions.'),
          },
          {
            id: 'ignore',
            text: L('垫块毛巾继续用', 'Put a towel under it and keep using it'),
            correct: false,
            feedback: L('水靠近电路有触电和短路风险，应立即停用。', 'Water near electrics risks shock and short circuits — stop using it now.'),
          },
        ],
        explanation: L('日常清洁可以自己做；维修交给厂家。', 'Daily cleaning is yours; repairs belong to the manufacturer.'),
      },
      {
        id: 'q-burr',
        prompt: L('刀盘磨豆机相比刀片磨豆机的主要优势是？', 'What is the main advantage of a burr grinder over a blade grinder?'),
        options: [
          {
            id: 'even',
            text: L('颗粒更均匀，而且可以调整粗细', 'More even particles and an adjustable grind size'),
            correct: true,
            feedback: L('对。均匀、可调让你能有目的地调整萃取。', 'Right — even, adjustable grinding lets you steer extraction on purpose.'),
          },
          {
            id: 'blade-better',
            text: L('刀片式更精确', 'Blade grinders are more precise'),
            correct: false,
            feedback: L('刀片是“切碎”，时间越长越细，但粗细很不均匀。', 'Blades chop: longer means finer, but the result is very uneven.'),
          },
          {
            id: 'espresso-only',
            text: L('刀盘式只适合意式', 'Burr grinders only matter for espresso'),
            correct: false,
            feedback: L('手冲、法压等也受益于均匀研磨，只是需要的粗细不同。', 'Pour-over and French press benefit too; they just need different sizes.'),
          },
        ],
        explanation: L('研磨是你手里最有力的调节旋钮之一。', 'Grind size is one of the most powerful dials you have.'),
      },
    ],
  },
  {
    id: 'lit-tools-safety-reflect',
    lessonId: 'lit-tools-safety',
    kind: 'reflect',
    title: L('检查你的厨房', 'Check Your Kitchen'),
    supportedModes: REFLECT,
    prompts: [
      L('你的磨豆机、水壶、咖啡机的电线离水槽多远？需要调整位置吗？', 'How close are your grinder, kettle and machine cords to the sink? Should anything move?'),
      L('找出你的设备说明书（纸质或官网）。清洁和除垢周期是多久？', 'Find your equipment manuals (paper or online). How often should you clean and descale?'),
      L('你家里有没有容易碰到热水的孩子或宠物？你会怎样安排操作区？', 'Are there children or pets who could reach hot water? How will you set up your space?'),
    ],
  },

  // ═════════════════════ lit-brewing-concepts ═════════════════════
  {
    id: 'lit-brewing-concepts-cards',
    lessonId: 'lit-brewing-concepts',
    kind: 'explain',
    title: L('冲煮的五个词', 'Five Brewing Words'),
    objectiveIds: ['lit.ratio-concepts'],
    supportedModes: CONCEPT,
    cards: [
      {
        heading: L('粉量：放进去的咖啡', 'Dose: the coffee you put in'),
        body: L(
          '粉量是你使用的干咖啡粉的重量，用克（g）表示。它是每个配方的起点——同一杯咖啡，粉量变了，其他参数通常也要跟着变。',
          'Dose is the weight of dry ground coffee you use, in grams. It is the anchor of every recipe — change the dose and the other numbers usually need to change with it.',
        ),
        illustration: 'dose-on-scale',
      },
      {
        heading: L('进去的水，出来的咖啡', 'Water in, coffee out'),
        body: L(
          '意式咖啡通常看“液重”：杯子里最后得到多少克咖啡液。手冲通常看“注水量”：一共倒了多少克水。咖啡渣会吸住一部分水（大约是粉量的两倍左右），所以手冲杯里的咖啡会比注水量少一些。',
          'Espresso usually counts yield: grams of liquid that end up in the cup. Pour-over usually counts the water poured in. Wet grounds hold back some water — very roughly twice their own weight — so a pour-over cup ends up lighter than the water you poured.',
        ),
        illustration: 'water-in-coffee-out',
        callout: {
          kind: 'illustrative',
          text: L('“约两倍”是粗略经验值，随研磨和滤器而变。', '"About twice" is a rough rule of thumb that varies with grind and filter.'),
        },
      },
      {
        heading: L('比例：一个数字说清配方', 'Ratio: a recipe in one number'),
        body: L(
          '比例 = 输出 ÷ 粉量。意式常叫“粉液比”：18 克粉得到 36 克液体，36 ÷ 18 = 2，记作 1:2。手冲常叫“粉水比”：15 克粉配 250 克水，250 ÷ 15 ≈ 16.7，约 1:17。比例让你可以按杯量等比放大或缩小。',
          'Ratio = output ÷ dose. Espresso: 18 g of coffee giving 36 g of liquid is 36 ÷ 18 = 2, written 1:2. Pour-over: 15 g of coffee with 250 g of water is 250 ÷ 15 ≈ 16.7, about 1:17. Ratios let you scale a recipe up or down.',
        ),
        illustration: 'ratio-bar',
        callout: {
          kind: 'illustrative',
          text: L('这些数字只是常见起点，不是唯一正确的配方。', 'These numbers are common starting points, not the one correct recipe.'),
        },
      },
      {
        heading: L('浓度 ≠ 萃取', 'Strength ≠ extraction'),
        body: L(
          '浓度：杯中咖啡有多“浓”，主要由比例决定。萃取：咖啡粉里有多少物质被水溶解出来，主要受研磨、时间和水温影响。同样的萃取可以冲得浓或淡；淡的咖啡也可能是萃取过度的。',
          'Strength is how concentrated the cup is — mostly set by the ratio. Extraction is how much of the coffee dissolved into the water — mostly shaped by grind, time and temperature. The same extraction can be brewed strong or weak, and a weak cup can still be over-extracted.',
        ),
        illustration: 'strength-vs-extraction',
      },
      {
        heading: L('研磨与时间', 'Grind and time'),
        body: L(
          '磨得越细，表面积越大、水流阻力越大：水流变慢、接触时间变长、通常萃取更多。磨得越粗则相反。在意式和手冲中，时间更多是研磨和手法的“结果”，是判断问题的线索。',
          'Finer grounds have more surface and more resistance: water flows slower, stays longer and usually extracts more. Coarser grounds do the opposite. In espresso and pour-over, time is mostly a result of grind and technique — a clue for diagnosing, not a dial on its own.',
        ),
        illustration: 'grind-size-scale',
      },
      {
        heading: L('酸？苦？要看情况', 'Sour? Bitter? It depends'),
        body: L(
          '常见经验：萃取不足时常偏尖酸、单薄；萃取过度时常偏苦、发干、涩。但豆子、烘焙、水和个人口味都会改变结果。研究显示风味同时取决于浓度和萃取，没有一个对所有人都“完美”的数字。',
          'A common rule of thumb: under-extracted cups often taste sharp-sour and thin; over-extracted cups often taste bitter, dry and harsh. But beans, roast, water and personal taste all shift the result. Research shows flavor depends on strength and extraction together — no single number is "perfect" for everyone.',
        ),
        illustration: 'taste-compass',
        callout: {
          kind: 'myth',
          text: L('误区：“存在一个完美配方”。配方是起点，你的口味才是终点。', 'Myth: "there is one perfect recipe." A recipe is a starting point; your taste is the destination.'),
        },
      },
    ],
  },
  {
    id: 'lit-brewing-concepts-explorer',
    lessonId: 'lit-brewing-concepts',
    kind: 'parameter-lab',
    lab: 'extraction-explorer',
    title: L('萃取探索器（示意模型）', 'Extraction Explorer (Illustrative Model)'),
    intro: L(
      '用一杯意式大小的咖啡做实验，因为它对变化反应快；同样的规律也适用于手冲。比例 = 杯中液重 ÷ 粉量。',
      'We use an espresso-sized brew because it reacts quickly to changes; the same principles apply to pour-over. Ratio = liquid out ÷ dose.',
    ),
    objectiveIds: ['lit.ratio-concepts'],
    supportedModes: CONCEPT,
    defaults: { doseG: 18, outG: 36, timeSec: 28, grind: 5 },
    ranges: { doseG: [14, 22], outG: [14, 66], timeSec: [10, 60], grind: [1, 10] },
    illustrativeNote: L(
      '这是一个简化的教学模型，用来展示变量之间的“方向”，不能预测你真实咖啡的味道。真实结果取决于豆子、磨豆机、机器、水和你的口味。研磨刻度 1 = 最细，10 = 最粗（虚拟刻度）。',
      'This is a simplified teaching model that shows the direction of cause and effect. It cannot predict how your real coffee will taste — that depends on beans, grinder, machine, water and your palate. Grind 1 = finest, 10 = coarsest (a made-up scale).',
    ),
    challenges: [
      {
        id: 'ch-1to2',
        prompt: L('保持粉量 18 g，做出约 1:2 的比例。', 'Keep an 18 g dose and make a ratio of about 1:2.'),
        target: { ratioMin: 1.9, ratioMax: 2.1, doseG: [17.5, 18.5] },
        success: L('很好：18 g → 约 36 g，就是 1:2。', 'Nice: 18 g in → about 36 g out is 1:2.'),
      },
      {
        id: 'ch-short',
        prompt: L('做一杯更短、更浓的咖啡：比例在 1:1.2 到 1:1.6 之间。', 'Make a shorter, more concentrated drink: a ratio between 1:1.2 and 1:1.6.'),
        target: { ratioMin: 1.2, ratioMax: 1.6 },
        success: L(
          '输出更少，浓度更高。注意观察模型里萃取的变化方向。',
          'Less liquid out means a stronger drink. Notice which way the model’s extraction moves.',
        ),
      },
      {
        id: 'ch-long',
        prompt: L('做一杯更长的咖啡：比例在 1:2.5 到 1:3 之间。', 'Make a longer drink: a ratio between 1:2.5 and 1:3.'),
        target: { ratioMin: 2.5, ratioMax: 3 },
        success: L(
          '更多的水流过咖啡粉：通常更淡，萃取也往往更多。',
          'More water through the coffee: usually weaker, and often more extracted.',
        ),
      },
      {
        id: 'ch-bigger-dose',
        prompt: L('换成 20 g 粉量，但仍保持约 1:2。', 'Switch to a 20 g dose but keep about 1:2.'),
        target: { ratioMin: 1.9, ratioMax: 2.1, doseG: [19.5, 20.5] },
        success: L('20 g → 约 40 g。比例相同，杯量更大。', '20 g in → about 40 g out. Same ratio, bigger drink.'),
      },
    ],
  },
  {
    id: 'lit-brewing-concepts-quiz',
    lessonId: 'lit-brewing-concepts',
    kind: 'quiz',
    title: L('小测：比例与萃取', 'Quick Check: Ratio and Extraction'),
    objectiveIds: ['lit.ratio-concepts'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-ratio-espresso',
        prompt: L('18 g 粉得到 45 g 意式咖啡液，比例是多少？', '18 g of coffee gives 45 g of espresso. What is the ratio?'),
        options: [
          {
            id: '2.5',
            text: L('1:2.5', '1:2.5'),
            correct: true,
            feedback: L('对：45 ÷ 18 = 2.5。', 'Correct: 45 ÷ 18 = 2.5.'),
          },
          {
            id: '2',
            text: L('1:2', '1:2'),
            correct: false,
            feedback: L('1:2 应该是 36 g。用输出除以粉量：45 ÷ 18。', '1:2 would be 36 g. Divide output by dose: 45 ÷ 18.'),
          },
          {
            id: '0.4',
            text: L('1:0.4', '1:0.4'),
            correct: false,
            feedback: L('你用粉量除以输出了。比例是输出 ÷ 粉量。', 'That’s dose ÷ output. Ratio is output ÷ dose.'),
          },
        ],
        explanation: L('比例 = 输出 ÷ 粉量。', 'Ratio = output ÷ dose.'),
        hint: L('用较大的数除以较小的数。', 'Divide the bigger number by the smaller one.'),
      },
      {
        id: 'q-water',
        prompt: L('手冲用 20 g 粉，想要 1:16，需要倒多少水？', 'Pour-over with 20 g of coffee at 1:16. How much water?'),
        options: [
          {
            id: '320',
            text: L('320 g', '320 g'),
            correct: true,
            feedback: L('对：20 × 16 = 320。', 'Right: 20 × 16 = 320.'),
          },
          {
            id: '160',
            text: L('160 g', '160 g'),
            correct: false,
            feedback: L('那是 1:8，太浓了。粉量 × 16 才对。', 'That’s 1:8 — far too strong. Multiply the dose by 16.'),
          },
          {
            id: '36',
            text: L('36 g', '36 g'),
            correct: false,
            feedback: L('这是“粉量 + 16”，比例需要用乘法。', 'That’s dose + 16. Ratios use multiplication.'),
          },
        ],
        explanation: L('需要的水 = 粉量 × 比例数。', 'Water needed = dose × ratio number.'),
      },
      {
        id: 'q-strength',
        prompt: L('一杯咖啡味道平衡但太淡，哪一项最直接影响“浓度”？', 'A cup tastes balanced but too weak. What most directly changes strength?'),
        options: [
          {
            id: 'ratio',
            text: L('比例：用更少的水或更多的粉', 'The ratio: less water or more coffee'),
            correct: true,
            feedback: L('对。浓度主要由比例决定。', 'Yes — strength is mostly set by the ratio.'),
          },
          {
            id: 'roast',
            text: L('换成深烘豆', 'Switch to a darker roast'),
            correct: false,
            feedback: L('深烘会改变风味，但不会让同比例的咖啡更“浓”。', 'Darker roast changes flavor, but not concentration at the same ratio.'),
          },
          {
            id: 'hotter-cup',
            text: L('喝得更烫一点', 'Drink it hotter'),
            correct: false,
            feedback: L('温度改变感知，但不改变杯中实际溶解的量。', 'Temperature changes perception, not how much is dissolved in the cup.'),
          },
        ],
        explanation: L('比例调浓度，研磨/时间调萃取——这是两个不同的旋钮。', 'Ratio dials strength; grind and time dial extraction — two different knobs.'),
      },
      {
        id: 'q-grind',
        prompt: L('其他条件不变，把研磨调细，最可能发生什么？', 'With everything else the same, you grind finer. What is most likely?'),
        options: [
          {
            id: 'slower',
            text: L('水流更慢，萃取通常更多', 'Water flows slower and extraction usually increases'),
            correct: true,
            feedback: L('对，这是一般规律，但幅度因设备而异。', 'Correct as a general tendency; how much depends on your gear.'),
          },
          {
            id: 'faster',
            text: L('水流更快', 'Water flows faster'),
            correct: false,
            feedback: L('更细的粉阻力更大，水流会更慢。', 'Finer grounds resist more, so flow slows down.'),
          },
          {
            id: 'nothing',
            text: L('只影响口感，不影响时间', 'Only texture changes, not time'),
            correct: false,
            feedback: L('研磨是影响流速和时间最主要的因素之一。', 'Grind is one of the biggest influences on flow rate and time.'),
          },
        ],
        explanation: L('细 → 慢 → 萃取多；粗 → 快 → 萃取少（一般趋势）。', 'Finer → slower → more extraction; coarser → faster → less (general tendency).'),
      },
      {
        id: 'q-recipe',
        prompt: L('朋友说“1:2 才是唯一正确的意式比例”。你怎么看？', 'A friend says "1:2 is the only correct espresso ratio." What do you think?'),
        options: [
          {
            id: 'start',
            text: L('1:2 是常见起点，不同豆子和口味适合不同比例', '1:2 is a common starting point; different beans and tastes suit different ratios'),
            correct: true,
            feedback: L('对。起点让你有参照，然后按口味调整。', 'Exactly. A starting point gives you a reference; then adjust to taste.'),
          },
          {
            id: 'only',
            text: L('对，偏离 1:2 就是做错了', 'Right — anything other than 1:2 is a mistake'),
            correct: false,
            feedback: L('很多咖啡馆用 1:1.5 到 1:3 都有，取决于豆子和风格。', 'Cafés use anything from about 1:1.5 to 1:3, depending on beans and style.'),
          },
          {
            id: 'no-measure',
            text: L('比例没用，凭感觉就行', 'Ratios are useless; just go by feel'),
            correct: false,
            feedback: L('比例让你能重复、能对比。感觉很重要，但需要数据来辅助。', 'Ratios let you repeat and compare. Feel matters, but numbers help you learn.'),
          },
        ],
        explanation: L('配方是起点，口味是终点。', 'Recipes are starting points; taste is the destination.'),
      },
    ],
  },
  {
    id: 'lit-brewing-concepts-reflect',
    lessonId: 'lit-brewing-concepts',
    kind: 'reflect',
    title: L('用新词描述', 'Use the New Words'),
    supportedModes: REFLECT,
    prompts: [
      L('用自己的话解释“浓度”和“萃取”的区别。', 'In your own words, explain the difference between strength and extraction.'),
      L('你最近喝的一杯咖啡，你觉得它的问题更像“太淡/太浓”，还是“太酸/太苦”？', 'Think of a recent cup: was its issue more "too weak/too strong" or "too sour/too bitter"?'),
      L('接下来你想先学意式还是手冲？为什么？', 'Do you want to start with espresso or pour-over next? Why?'),
    ],
  },
];

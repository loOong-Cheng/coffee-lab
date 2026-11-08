/**
 * Track B — Espresso fundamentals (primary route). Brief §4 Track B.
 * Generic home espresso machine + grinder; machine-specific steps are always
 * deferred to the manufacturer manual. All numbers are illustrative starting points.
 */
import type { Activity, Lesson, LocalizedText, Mode, Track } from '../../domain/contracts';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

const CONCEPT: Mode[] = ['desktop', 'mobile'];
/** Identification / ordering also map naturally onto spatial props in XR. */
const SPATIAL_OK: Mode[] = ['desktop', 'mobile', 'xr'];
const REFLECT: Mode[] = ['desktop', 'mobile', 'real-world-guide'];
/** Real cups: the phone (kitchen mode) is primary; desktop can show the same checklist. */
const REAL_WORLD: Mode[] = ['mobile', 'real-world-guide', 'desktop'];

const MANUAL_NOTE = L(
  '不同机器的按键、预热时间、蒸汽开关和清洁方式差别很大，请以你的机器说明书为准。',
  'Buttons, heat-up time, steam controls and cleaning differ a lot between machines — your manufacturer manual always takes priority.',
);
const HOT_PARTS = L(
  '冲煮头、手柄金属部分、热水和蒸汽都可能烫伤：握住把手，热水出口和蒸汽棒不要对着人。',
  'The group head, metal portafilter parts, hot water and steam can all burn: hold handles, and never aim water outlets or the steam wand at anyone.',
);
const GRINDER_SAFE = L(
  '磨豆机运转时手指远离刀盘；清理或卡豆时先拔电源。',
  'Keep fingers away from the burrs while grinding; unplug before clearing or cleaning.',
);
const STEAM_BURN = L(
  '蒸汽和蒸汽棒温度远高于沸水，可造成严重烫伤。只在喷嘴没入牛奶时开蒸汽，先关蒸汽再移开奶缸，不要触碰喷嘴。',
  'Steam and the steam wand are far hotter than boiling water and can cause serious burns. Open steam only with the tip in the milk, close it before lowering the pitcher, and never touch the tip.',
);

export const track: Track = {
  id: 'espresso',
  order: 2,
  title: L('意式浓缩基础', 'Espresso Fundamentals'),
  summary: L(
    '认识机器、掌握流程、理解比例、学会排查问题，然后用你自己的咖啡机做出第一杯真实的意式浓缩——再试试打奶。',
    'Meet the machine, learn the workflow, understand ratios and diagnosis, then pull a real shot on your own machine — and try steaming milk.',
  ),
  lessonIds: [
    'esp-meet-the-machine',
    'esp-workflow',
    'esp-ratio-lab',
    'esp-diagnosis',
    'esp-first-real-shot',
    'esp-milk-basics',
  ],
};

export const lessons: Lesson[] = [
  {
    id: 'esp-meet-the-machine',
    track: 'espresso',
    level: 'beginner',
    title: L('认识意式咖啡机', 'Meet the Machine'),
    goal: L(
      '认出家用意式工作台上的每个部件，并说出它的作用。',
      'Recognise each part of a home espresso setup and say what it does.',
    ),
    prerequisites: ['lit-tools-safety'],
    keyConcepts: [
      L('意式 = 热水在压力下快速穿过压实的细粉', 'Espresso = hot water pushed under pressure through a compact bed of fine coffee'),
      L('冲煮头、手柄、粉碗、压粉器的分工', 'What the group head, portafilter, basket and tamper each do'),
      L('磨豆机要能磨得细且可调', 'The grinder must go fine and be adjustable'),
      L('秤和杯子：测量出来的结果', 'Scale and cup: measuring what comes out'),
      L('蒸汽棒和接水盘：高温区域', 'Steam wand and drip tray: the hot zone'),
    ],
    activityIds: [
      'esp-meet-the-machine-cards',
      'esp-meet-the-machine-identify',
      'esp-meet-the-machine-quiz',
      'esp-meet-the-machine-reflect',
    ],
    checkForUnderstanding: ['esp-meet-the-machine-identify', 'esp-meet-the-machine-quiz'],
    safetyNotes: [HOT_PARTS, MANUAL_NOTE],
    estimatedMinutes: 10,
    sources: ['sca-csp', 'sca-csp-catalog', 'manufacturer-manual', 'coffee-lab-editorial'],
    confidence: 'verified',
    next: ['esp-workflow'],
  },
  {
    id: 'esp-workflow',
    track: 'espresso',
    level: 'beginner',
    title: L('一杯意式的流程', 'The Espresso Workflow'),
    goal: L(
      '把制作一杯意式浓缩的步骤按正确顺序排列，并解释每一步为什么重要。',
      'Put the steps of making an espresso in order and explain why each one matters.',
    ),
    prerequisites: ['esp-meet-the-machine'],
    keyConcepts: [
      L('先检查：预热、接水盘、干净干燥的粉碗', 'Check first: heated machine, drip tray, clean dry basket'),
      L('称粉 → 研磨 → 布粉 → 压粉', 'Weigh → grind → distribute → tamp'),
      L('装手柄 → 放杯去皮 → 开始并计时 → 按重量停止', 'Lock in → cup on scale and tare → start with timer → stop by weight'),
      L('收尾清洁让下一杯更好', 'Cleaning up makes the next shot better'),
    ],
    activityIds: [
      'esp-workflow-cards',
      'esp-workflow-order',
      'esp-workflow-xr',
      'esp-workflow-quiz',
      'esp-workflow-reflect',
    ],
    checkForUnderstanding: ['esp-workflow-order', 'esp-workflow-quiz'],
    safetyNotes: [HOT_PARTS, GRINDER_SAFE],
    estimatedMinutes: 15,
    sources: ['sca-csp-catalog', 'manufacturer-manual', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['esp-ratio-lab'],
  },
  {
    id: 'esp-ratio-lab',
    track: 'espresso',
    level: 'beginner',
    title: L('比例实验室', 'Ratio Lab'),
    goal: L(
      '根据粉量和液重计算意式比例，并能调整其中一个达到目标比例——同时明白这些数字只是起点。',
      'Calculate an espresso ratio from dose and yield, and adjust either to hit a target — knowing the numbers are only starting points.',
    ),
    prerequisites: ['esp-workflow', 'lit-brewing-concepts'],
    keyConcepts: [
      L('意式比例 = 液重 ÷ 粉量', 'Espresso ratio = yield ÷ dose'),
      L('18 g → 36 g = 1:2（示意起点）', '18 g → 36 g = 1:2 (illustrative starting point)'),
      L('短萃、常规、长萃大致对应不同比例', 'Short, normal and long shots roughly map to different ratios'),
      L('用重量而不是容量来测量', 'Measure by weight, not volume'),
      L('时间是线索，不是目标', 'Time is a clue, not a goal'),
    ],
    activityIds: ['esp-ratio-lab-cards', 'esp-ratio-lab-sim', 'esp-ratio-lab-quiz', 'esp-ratio-lab-reflect'],
    checkForUnderstanding: ['esp-ratio-lab-sim', 'esp-ratio-lab-quiz'],
    safetyNotes: [],
    estimatedMinutes: 12,
    sources: ['sca-dialing-in', 'ucdavis-ccc-2023', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['esp-diagnosis'],
  },
  {
    id: 'esp-diagnosis',
    track: 'espresso',
    level: 'beginner',
    title: L('排查一杯不理想的意式', 'Diagnose a Shot'),
    goal: L(
      '从时间、液重和味道出发，推理出下一次只改“一个”变量的合理调整，并接受结果的不确定性。',
      'Reason from a shot’s time, output and taste to ONE sensible change for next time — and accept that results are uncertain.',
    ),
    prerequisites: ['esp-ratio-lab'],
    keyConcepts: [
      L('先测量，再品尝', 'Measure first, then taste'),
      L('研磨是控制流速的主要旋钮', 'Grind is the main dial for flow'),
      L('一次只改一个变量', 'Change one thing at a time'),
      L('味道是线索，不是判决', 'Taste is a clue, not a verdict'),
      L('通道效应：水从薄弱处冲过去', 'Channeling: water rushing through weak spots'),
      L('喜欢就记下来，不必追求“完美”', 'If you like it, write it down — no need to chase "perfect"'),
    ],
    activityIds: ['esp-diagnosis-cards', 'esp-diagnosis-scenarios', 'esp-diagnosis-quiz', 'esp-diagnosis-reflect'],
    checkForUnderstanding: ['esp-diagnosis-scenarios', 'esp-diagnosis-quiz'],
    safetyNotes: [],
    estimatedMinutes: 15,
    sources: ['sca-dialing-in', 'ucdavis-ccc-2023', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['esp-first-real-shot'],
  },
  {
    id: 'esp-first-real-shot',
    track: 'espresso',
    level: 'beginner',
    title: L('你的第一杯真实意式', 'Your First Real Shot'),
    goal: L(
      '用自己的咖啡机和磨豆机做一杯真实的意式浓缩：测量粉量、液重和时间，品尝，并记录下次要改的一件事。',
      'Pull a real espresso on your own machine and grinder: measure dose, yield and time, taste it, and log one thing to change next time.',
    ),
    prerequisites: ['esp-diagnosis'],
    keyConcepts: [
      L('说明书优先：预热时间、按键、粉碗类型', 'Manual first: heat-up time, buttons, basket type'),
      L('示意起点：18 g → 36 g，约 25–35 秒', 'Illustrative start: 18 g → 36 g in roughly 25–35 s'),
      L('按重量停止，记录时间', 'Stop by weight, note the time'),
      L('第一杯不完美很正常——它是数据', 'An imperfect first shot is normal — it is data'),
      L('完成情况是你的自我报告', 'Completion is your own self-report'),
    ],
    activityIds: [
      'esp-first-real-shot-cards',
      'esp-first-real-shot-ready',
      'esp-first-real-shot-guide',
      'esp-first-real-shot-reflect',
    ],
    checkForUnderstanding: ['esp-first-real-shot-ready'],
    safetyNotes: [HOT_PARTS, GRINDER_SAFE, MANUAL_NOTE],
    estimatedMinutes: 25,
    sources: ['manufacturer-manual', 'sca-csp-catalog', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['esp-milk-basics'],
  },
  {
    id: 'esp-milk-basics',
    track: 'espresso',
    level: 'beginner',
    title: L('打奶入门', 'Milk Basics'),
    goal: L(
      '理解蒸汽如何改变牛奶、几种常见奶咖的区别，并按机器说明书安全地练习打奶。',
      'Understand what steaming does to milk and how common milk drinks differ, then practise steaming safely by following your machine’s manual.',
    ),
    prerequisites: ['esp-first-real-shot'],
    keyConcepts: [
      L('蒸汽同时加热牛奶并打入空气', 'Steam both heats milk and adds air'),
      L('先“拉伸”（进气），再“融合”（漩涡）', 'Stretch first (add air), then texture (whirlpool)'),
      L('温度约 55–65 °C，过烫会有煮熟味', 'Around 55–65 °C; much hotter tastes cooked'),
      L('卡布奇诺、拿铁、澳白的大致区别', 'Rough differences between cappuccino, latte and flat white'),
      L('蒸汽烫伤风险与正确收尾', 'Steam burn risks and safe wrap-up'),
    ],
    activityIds: [
      'esp-milk-basics-cards',
      'esp-milk-basics-quiz',
      'esp-milk-basics-order',
      'esp-milk-basics-steam',
      'esp-milk-basics-reflect',
    ],
    checkForUnderstanding: ['esp-milk-basics-quiz', 'esp-milk-basics-order'],
    safetyNotes: [STEAM_BURN, MANUAL_NOTE],
    estimatedMinutes: 20,
    sources: ['breville-steam-milk', 'manufacturer-manual', 'sca-csp-catalog', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['po-meet-the-gear'],
  },
];

export const activities: Activity[] = [
  // ═════════════════════ esp-meet-the-machine ═════════════════════
  {
    id: 'esp-meet-the-machine-cards',
    lessonId: 'esp-meet-the-machine',
    kind: 'explain',
    title: L('意式工作台导览', 'A Tour of the Espresso Station'),
    objectiveIds: ['esp.parts'],
    supportedModes: SPATIAL_OK,
    cards: [
      {
        heading: L('意式浓缩是什么', 'What makes espresso espresso'),
        body: L(
          '意式浓缩是让热水在压力下（很多机器约为 9 bar）快速穿过一小块压实的细咖啡粉，几十秒内得到一小杯浓郁的咖啡，表面常有一层金棕色的油脂（crema）。',
          'Espresso forces hot water under pressure — around 9 bar on many machines — through a small, compact bed of fine coffee. In under a minute you get a small, concentrated drink, often topped with golden-brown crema.',
        ),
        illustration: 'espresso-cross-section',
        callout: {
          kind: 'illustrative',
          text: L('“约 9 bar”是常见参考值，机器设计各不相同。', '"About 9 bar" is a common reference; machine designs differ.'),
        },
      },
      {
        heading: L('冲煮头与手柄', 'Group head and portafilter'),
        body: L(
          '冲煮头是机器正面出热水的地方，下方有一块分水网。手柄像一只带把手的小锅，装着粉碗，旋转卡进冲煮头后形成密封，热水才会被迫穿过咖啡粉。',
          'The group head is where hot water comes out on the front of the machine, through a shower screen. The portafilter is like a small pan with a handle: it holds the basket and twists into the group head to make a seal, so water is forced through the coffee.',
        ),
        illustration: 'group-head-portafilter',
      },
      {
        heading: L('粉碗决定粉量', 'The basket sets the dose'),
        body: L(
          '粉碗是手柄里带细孔的金属碗。单份粉碗常装约 7–10 g，双份约 14–20 g，具体看粉碗标注。有些入门机器用“加压粉碗”（双层底），对研磨更宽容，但调研磨的效果会不同。',
          'The basket is the perforated metal cup inside the portafilter. Single baskets often hold about 7–10 g and doubles about 14–20 g — check the rating on yours. Some entry machines use pressurised (dual-wall) baskets, which forgive grind more but respond differently to grind changes.',
        ),
        illustration: 'basket-types',
        callout: {
          kind: 'tip',
          text: L('看看你的粉碗底部是单层还是双层，说明书会告诉你。', 'Check whether your basket has a single or double wall — your manual will say.'),
        },
      },
      {
        heading: L('磨豆机和压粉器', 'Grinder and tamper'),
        body: L(
          '意式需要很细、可微调的研磨，所以磨豆机至关重要。压粉器底部是平的，用来把粉压成平整、密实的粉饼，让水在各处遇到相同的阻力。',
          'Espresso needs a fine, finely adjustable grind, so the grinder is crucial. The tamper has a flat base for pressing grounds into a level, compact puck, so water meets the same resistance everywhere.',
        ),
        illustration: 'grinder-tamper',
      },
      {
        heading: L('秤、杯子和高温区', 'Scale, cup and the hot zone'),
        body: L(
          '秤放在杯子下面，测量出来多少克咖啡。蒸汽棒用来加热和打发牛奶，接水盘接住溢出的水。蒸汽棒、冲煮头和手柄金属部分都很烫。',
          'A scale under the cup measures how many grams come out. The steam wand heats and textures milk, and the drip tray catches spills. The steam wand, group head and metal parts of the portafilter all get very hot.',
        ),
        illustration: 'scale-cup-steam',
        callout: { kind: 'safety', text: HOT_PARTS },
      },
    ],
  },
  {
    id: 'esp-meet-the-machine-identify',
    lessonId: 'esp-meet-the-machine',
    kind: 'identify',
    title: L('找出部件', 'Find the Parts'),
    objectiveIds: ['esp.parts'],
    supportedModes: SPATIAL_OK,
    diagram: 'espresso-station',
    prompt: L('点击（或指向）每个部件。答对后会显示它的作用。', 'Select each part. Once you find it, you’ll see what it does.'),
    targets: [
      {
        partId: 'espresso-machine',
        label: L('意式咖啡机', 'Espresso machine'),
        description: L('加热水并以压力推动水穿过咖啡粉。', 'Heats water and pushes it through the coffee under pressure.'),
        hint: L('台面上最大的那台电器。', 'The biggest appliance on the counter.'),
      },
      {
        partId: 'group-head',
        label: L('冲煮头', 'Group head'),
        description: L('手柄卡入的位置，热水从这里的分水网流出。', 'Where the portafilter locks in; hot water flows out through its shower screen.'),
        hint: L('在机器正面，热水出来的地方。', 'On the front of the machine, where hot water comes out.'),
      },
      {
        partId: 'portafilter',
        label: L('冲煮手柄', 'Portafilter'),
        description: L('装着粉碗的带柄金属座，旋入冲煮头形成密封。', 'The handled holder for the basket; it twists into the group head to seal.'),
        hint: L('有一个把手，像一只小锅。', 'It has a handle, like a small pan.'),
      },
      {
        partId: 'basket',
        label: L('粉碗', 'Basket'),
        description: L('带细孔的金属碗，装咖啡粉；尺寸决定适合的粉量。', 'A perforated metal cup holding the coffee; its size sets the suitable dose.'),
        hint: L('放在手柄里面。', 'It sits inside the portafilter.'),
      },
      {
        partId: 'tamper',
        label: L('压粉器', 'Tamper'),
        description: L('把粉压成平整、密实的粉饼。', 'Presses the grounds into a level, compact puck.'),
        hint: L('看起来像一枚印章。', 'Looks like a small stamp.'),
      },
      {
        partId: 'grinder',
        label: L('磨豆机', 'Grinder'),
        description: L('把豆子磨得又细又均匀；研磨度是调整意式的主要旋钮。', 'Grinds beans fine and evenly; grind size is the main dial for espresso.'),
        hint: L('顶部有一个装豆子的豆仓。', 'It has a bean hopper on top.'),
      },
      {
        partId: 'scale',
        label: L('电子秤', 'Scale'),
        description: L('称粉量和杯中液重，让你能算比例、能重复。', 'Weighs the dose and the output so you can calculate ratios and repeat shots.'),
        hint: L('扁平、有显示屏，常放在杯子下面。', 'Flat with a display, often under the cup.'),
      },
      {
        partId: 'cup',
        label: L('咖啡杯', 'Cup'),
        description: L('接住萃取出来的咖啡；预热杯子能保温。', 'Catches the shot; a pre-warmed cup keeps it hot.'),
        hint: L('放在出液口正下方。', 'Right under the spouts.'),
      },
      {
        partId: 'steam-wand',
        label: L('蒸汽棒', 'Steam wand'),
        description: L('喷出蒸汽来加热和打发牛奶。非常烫！', 'Releases steam to heat and texture milk. Very hot!'),
        hint: L('机器侧面一根细细的金属管。', 'A thin metal pipe on the side of the machine.'),
      },
      {
        partId: 'drip-tray',
        label: L('接水盘', 'Drip tray'),
        description: L('接住溢出的咖啡和排水；要定期清空。', 'Catches spills and flush water; empty it regularly.'),
        hint: L('机器底部的格栅。', 'The grate at the bottom of the machine.'),
      },
    ],
  },
  {
    id: 'esp-meet-the-machine-quiz',
    lessonId: 'esp-meet-the-machine',
    kind: 'quiz',
    title: L('小测：每个部件做什么？', 'Quick Check: What Does Each Part Do?'),
    objectiveIds: ['esp.parts'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-seal',
        prompt: L('为什么手柄必须牢牢卡进冲煮头？', 'Why must the portafilter lock firmly into the group head?'),
        options: [
          {
            id: 'seal',
            text: L('形成密封，让热水在压力下穿过咖啡粉', 'To seal, so hot water is forced through the coffee under pressure'),
            correct: true,
            feedback: L('对。没有密封，水会从边缘漏出来。', 'Correct. Without a seal, water escapes around the edge.'),
          },
          {
            id: 'heat',
            text: L('为了让手柄变热', 'To make the portafilter warm'),
            correct: false,
            feedback: L('预热是附带的好处，但卡紧的主要目的是密封。', 'Warming is a side benefit; the main reason is the seal.'),
          },
          {
            id: 'crema',
            text: L('卡得越紧，油脂越多', 'The tighter it is, the more crema you get'),
            correct: false,
            feedback: L('只需要正常卡紧即可，过度用力不会改善咖啡，还可能损坏密封圈。', 'Normal snugness is enough; forcing it won’t improve the shot and can wear the gasket.'),
          },
        ],
        explanation: L('意式依赖压力，压力依赖密封。', 'Espresso depends on pressure, and pressure depends on the seal.'),
      },
      {
        id: 'q-basket',
        prompt: L('你的双份粉碗标注 18 g，而你想用 22 g 粉，会怎样？', 'Your double basket is rated 18 g and you load 22 g. What is likely?'),
        options: [
          {
            id: 'overfill',
            text: L('粉太多，粉面可能顶到分水网，水流不均', 'It is overfilled; the bed may touch the shower screen and flow unevenly'),
            correct: true,
            feedback: L('对。先在粉碗标注范围内练习，需要更多粉量时再换更大的粉碗。', 'Right. Practise within the basket’s rating; get a bigger basket if you want a larger dose.'),
          },
          {
            id: 'stronger-always',
            text: L('一定更好喝，因为更浓', 'It will taste better because it is stronger'),
            correct: false,
            feedback: L('超量会让水流不均，更浓不等于更好。', 'Overfilling causes uneven flow — stronger isn’t automatically better.'),
          },
          {
            id: 'nothing',
            text: L('没有影响，粉碗大小无所谓', 'No effect — basket size doesn’t matter'),
            correct: false,
            feedback: L('粉碗的尺寸和孔是按特定粉量设计的。', 'Baskets are designed (size and holes) for a particular dose range.'),
          },
        ],
        explanation: L('让粉量和粉碗匹配，是稳定出品的第一步。', 'Matching dose to basket is the first step to consistent shots.'),
      },
      {
        id: 'q-scale-role',
        prompt: L('意式咖啡里，秤主要用在哪两个时刻？', 'In espresso, at which two moments is the scale mainly used?'),
        options: [
          {
            id: 'dose-yield',
            text: L('称粉量，以及称杯中液重', 'Weighing the dose and weighing the output in the cup'),
            correct: true,
            feedback: L('对。有了这两个数字，才能算出比例。', 'Yes — those two numbers give you the ratio.'),
          },
          {
            id: 'water-tank',
            text: L('称水箱里的水', 'Weighing the water tank'),
            correct: false,
            feedback: L('水箱只是储水，真正关心的是杯中出来多少。', 'The tank is just storage; what matters is how much reaches the cup.'),
          },
          {
            id: 'milk-only',
            text: L('只在做奶咖时称牛奶', 'Only for weighing milk in milk drinks'),
            correct: false,
            feedback: L('秤对纯意式同样重要：粉量和液重都要称。', 'The scale matters for straight espresso too: dose and yield.'),
          },
        ],
        explanation: L('称两次：进去多少、出来多少。', 'Weigh twice: what goes in and what comes out.'),
      },
    ],
  },
  {
    id: 'esp-meet-the-machine-reflect',
    lessonId: 'esp-meet-the-machine',
    kind: 'reflect',
    title: L('看看你自己的机器', 'Look at Your Own Machine'),
    supportedModes: REFLECT,
    prompts: [
      L('在你的机器上找到冲煮头、蒸汽棒和接水盘。说明书里它们叫什么？', 'Find the group head, steam wand and drip tray on your machine. What does your manual call them?'),
      L('你的粉碗标注的粉量是多少？是单层还是双层（加压）粉碗？', 'What dose is your basket rated for? Is it single-wall or dual-wall (pressurised)?'),
      L('你的磨豆机有没有标注意式研磨的范围？', 'Does your grinder mark an espresso range?'),
    ],
  },

  // ═════════════════════ esp-workflow ═════════════════════
  {
    id: 'esp-workflow-cards',
    lessonId: 'esp-workflow',
    kind: 'explain',
    title: L('流程的四个阶段', 'The Workflow in Four Phases'),
    objectiveIds: ['esp.workflow-order'],
    supportedModes: SPATIAL_OK,
    cards: [
      {
        heading: L('准备 → 装粉 → 萃取 → 收尾', 'Prepare → load → brew → finish'),
        body: L(
          '准备：确认机器预热好、粉碗干净干燥。装粉：称粉、研磨、布粉、压粉。萃取：装手柄、放杯、开始并计时、按重量停止。收尾：敲掉粉饼、冲洗、擦干。',
          'Prepare: machine heated, basket clean and dry. Load: weigh, grind, distribute, tamp. Brew: lock in, cup on the scale, start with a timer, stop by weight. Finish: knock out the puck, flush, wipe dry.',
        ),
        illustration: 'workflow-phases',
      },
      {
        heading: L('稳定比完美更重要', 'Consistency beats perfection'),
        body: L(
          '每次都用同样的顺序和动作，你才能分辨出是哪一个改变影响了味道。动作一致，比追求某个“完美”技巧更能帮你进步。',
          'Doing the same steps the same way each time is what lets you tell which change affected the taste. Consistency teaches you more than chasing a "perfect" technique.',
        ),
        illustration: 'repeatable-routine',
      },
      {
        heading: L('说明书优先', 'Your manual comes first'),
        body: L(
          '各种机器的按键、预热时间、是否有预浸泡、粉碗类型都不同。Coffee Lab 讲的是通用流程；具体怎么按、怎么清洁，请以你的机器说明书为准。',
          'Buttons, heat-up times, pre-infusion and basket types vary from machine to machine. Coffee Lab teaches the general workflow; for exactly what to press and how to clean, follow your machine’s manual.',
        ),
        illustration: 'manual-book',
        callout: { kind: 'safety', text: HOT_PARTS },
      },
    ],
  },
  {
    id: 'esp-workflow-order',
    lessonId: 'esp-workflow',
    kind: 'sequence',
    title: L('排出正确流程', 'Put the Workflow in Order'),
    objectiveIds: ['esp.workflow-order'],
    supportedModes: SPATIAL_OK,
    prompt: L('把制作一杯意式的步骤按顺序排好。', 'Arrange the steps of making one espresso in order.'),
    hint: L(
      '先准备好粉饼，再装上机器；杯子要在开始萃取之前就位；清洁永远在最后。',
      'Prepare the puck before it goes on the machine; the cup must be in place before brewing starts; cleaning is always last.',
    ),
    steps: [
      {
        id: 'check',
        text: L('检查：机器已充分预热，接水盘就位，粉碗干净干燥', 'Check: machine fully heated, drip tray in place, basket clean and dry'),
        why: L('冷机器或潮湿的粉碗会让萃取不均匀；先检查也能发现安全隐患。', 'A cold machine or damp basket causes uneven brewing — and checking first catches safety problems.'),
      },
      {
        id: 'dose',
        text: L('称出粉量（例如 18 g，按你的粉碗）', 'Weigh your dose (e.g. 18 g — match your basket)'),
        why: L('粉量是配方的锚点；不称就算不出比例，也没法重复。', 'The dose anchors the recipe; without it you can’t calculate a ratio or repeat a shot.'),
      },
      {
        id: 'grind',
        text: L('研磨到粉碗里', 'Grind into the basket'),
        why: L('现磨现用，香气不流失；研磨度是控制流速的主要旋钮。', 'Freshly ground coffee keeps its aroma, and grind size is the main dial for flow.'),
      },
      {
        id: 'distribute',
        text: L('布粉：让粉面平整、均匀', 'Distribute: level the grounds evenly'),
        why: L('水会走阻力最小的路，粉面不均会造成通道效应。', 'Water takes the easiest path; an uneven bed causes channeling.'),
      },
      {
        id: 'tamp',
        text: L('压粉：水平、稳定地压实', 'Tamp: press firmly and level'),
        why: L('压成平整的粉饼，让水在各处遇到相同的阻力。', 'A level, compact puck gives water the same resistance everywhere.'),
      },
      {
        id: 'lock-in',
        text: L('把手柄装进冲煮头并卡紧', 'Lock the portafilter into the group head'),
        why: L('密封后，热水才会在压力下穿过咖啡粉。', 'With a seal, hot water is forced through the coffee under pressure.'),
      },
      {
        id: 'cup',
        text: L('杯子放到秤上、出液口下方，去皮归零', 'Place the cup on the scale under the spouts and tare'),
        why: L('从零开始称，才能准确知道出来了多少克。', 'Starting from zero means you know exactly how many grams come out.'),
      },
      {
        id: 'start',
        text: L('开始萃取，同时开始计时', 'Start the shot and the timer together'),
        why: L('时间是排查问题的重要线索；装上手柄后尽快开始，避免干粉被冲煮头的热量提前加热。', 'Time is a key diagnostic clue; start soon after locking in so the hot group head doesn’t pre-heat the dry coffee.'),
      },
      {
        id: 'stop',
        text: L('达到目标液重时停止，记下重量和时间', 'Stop at your target weight; note weight and time'),
        why: L('只有测量过的东西，才能有依据地调整。', 'You can only adjust what you’ve measured.'),
      },
      {
        id: 'clean',
        text: L('敲掉粉饼，冲洗冲煮头，擦干手柄', 'Knock out the puck, flush the group head, wipe the portafilter'),
        why: L('残留的粉和油脂会让下一杯带上陈旧的苦味。更深入的清洁按说明书进行。', 'Old grounds and oils make the next shot taste stale and bitter. Deeper cleaning follows your manual.'),
      },
    ],
    misconceptions: [
      {
        earlierStep: 'distribute',
        laterStep: 'tamp',
        feedback: L(
          '先压粉会把结块和空隙“锁”在粉饼里。先把粉面弄平，再压。',
          'Tamping first locks clumps and gaps into the puck. Level the bed first, then tamp.',
        ),
      },
      {
        earlierStep: 'tamp',
        laterStep: 'lock-in',
        feedback: L(
          '没压好的粉会让水直接冲过去，还可能弄得一团糟。粉饼准备好后再装上机器。',
          'An untamped bed lets water rush straight through and can make a mess. Finish the puck before locking it in.',
        ),
      },
      {
        earlierStep: 'cup',
        laterStep: 'start',
        feedback: L(
          '没放杯子就开始，会浪费最浓郁的前段咖啡，还可能溅出热液。',
          'Starting before the cup is in place wastes the richest first part of the shot and can splash hot liquid.',
        ),
      },
      {
        earlierStep: 'dose',
        laterStep: 'grind',
        feedback: L(
          '先称量，只磨需要的量；磨完再凑重量会浪费咖啡、也难以稳定。',
          'Weigh first and grind only what you need; topping up after grinding wastes coffee and is hard to repeat.',
        ),
      },
      {
        earlierStep: 'check',
        laterStep: 'dose',
        feedback: L(
          '机器还没预热好，萃取出来往往偏酸、偏淡。先检查，再开始准备咖啡粉。',
          'If the machine isn’t fully heated, shots often taste sour and thin. Check first, then prepare the coffee.',
        ),
      },
    ],
  },
  {
    id: 'esp-workflow-xr',
    lessonId: 'esp-workflow',
    kind: 'spatial-practice',
    missionId: 'espresso-first-shot',
    title: L('虚拟吧台：做第一杯意式', 'Virtual Bar: Pull Your First Shot'),
    intro: L(
      '在虚拟吧台里亲手按顺序完成流程。可以选择“引导 / 辅助 / 独立”三档提示。',
      'Work through the routine with your hands at a virtual bar. Choose guided, assisted or independent cues.',
    ),
    objectiveIds: ['esp.workflow-order'],
    supportedModes: ['xr', 'desktop', 'mobile'],
    summary: L(
      '拿起手柄，对准并装进冲煮头，把杯子放好，启动萃取，观察一段示意性的萃取动画，最后查看你的步骤顺序和准确度。提示会从“引导”逐步减少到“独立”。没有头显时可以用鼠标或触屏操作同一场景。',
      'Pick up the portafilter, align and lock it into the group head, place the cup, start the shot, watch an illustrative extraction, then review your step order and accuracy. Cues fade from guided to independent. Without a headset you can play the same scene with mouse or touch.',
    ),
    limits: L(
      '这里练习的是空间顺序和手眼协调。它无法模拟真实的触感、握力或压粉力度，也没有真实的温度和味道；萃取画面只是示意动画，不是对风味的预测。真正的手上功夫仍需要在真实机器上练习。',
      'This practises spatial order and coordination only. It cannot reproduce real touch, grip or tamping force, heat or taste; the extraction shown is an illustrative animation, not a flavor prediction. Real hand skills still need practice on a real machine.',
    ),
    safetyNotes: [
      L(
        '使用头显时请清理周围空间，可坐着玩；感到不适随时摘下休息。',
        'With a headset, clear the space around you; seated play is fine. Take it off and rest whenever you feel uncomfortable.',
      ),
    ],
  },
  {
    id: 'esp-workflow-quiz',
    lessonId: 'esp-workflow',
    kind: 'quiz',
    title: L('小测：为什么这样做？', 'Quick Check: Why This Way?'),
    objectiveIds: ['esp.workflow-order'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-level',
        prompt: L('布粉和水平压粉最主要的目的是？', 'What is the main purpose of distributing and tamping level?'),
        options: [
          {
            id: 'even',
            text: L('让水在整块粉饼里遇到均匀的阻力，减少通道效应', 'Give water even resistance across the puck and reduce channeling'),
            correct: true,
            feedback: L('对。均匀比用力更重要。', 'Right — evenness matters more than force.'),
          },
          {
            id: 'harder',
            text: L('压得越用力，咖啡越好', 'The harder you tamp, the better the coffee'),
            correct: false,
            feedback: L(
              '粉被压实之后，再多用力影响不大。稳定、水平、适度用力才是关键。',
              'Once the bed is compressed, extra force changes little. Consistent, level, firm pressure is what counts.',
            ),
          },
          {
            id: 'crema',
            text: L('主要是为了多出油脂', 'Mainly to produce more crema'),
            correct: false,
            feedback: L('油脂多少主要受豆子新鲜度和烘焙影响，不是压粉。', 'Crema depends mostly on bean freshness and roast, not tamping.'),
          },
        ],
        explanation: L('水走阻力最小的路——让每条路都一样。', 'Water takes the easiest path — make every path the same.'),
      },
      {
        id: 'q-weigh-out',
        prompt: L('为什么要称杯中的液重，而不是看杯子的刻度（毫升）？', 'Why weigh the shot instead of reading millilitres on the cup?'),
        options: [
          {
            id: 'crema-volume',
            text: L('油脂含有大量气泡，容量不准；重量能直接算出比例', 'Crema is full of bubbles, so volume misleads; weight gives you the ratio'),
            correct: true,
            feedback: L('对。同样 36 g，看起来的“容量”可能差很多。', 'Correct. The same 36 g can look like very different volumes.'),
          },
          {
            id: 'machine-exact',
            text: L('机器每次都会精确出 30 毫升，所以不用称', 'Machines always deliver exactly 30 ml, so no need'),
            correct: false,
            feedback: L('流速随研磨和粉量变化，机器的出液并不固定。', 'Flow varies with grind and dose; the output is not fixed.'),
          },
          {
            id: 'show',
            text: L('只是专业人士的习惯，家里没必要', 'It’s only a pro habit — pointless at home'),
            correct: false,
            feedback: L('在家称重同样有用：它让你知道下一次该改什么。', 'Weighing helps at home too: it tells you what to change next time.'),
          },
        ],
        explanation: L('进去多少、出来多少，都用克来记。', 'Record what goes in and what comes out, in grams.'),
      },
      {
        id: 'q-cold-machine',
        prompt: L('机器才开了两分钟，萃取出来又酸又淡。最可能的原因是？', 'The machine was switched on two minutes ago and the shot is sour and thin. Most likely cause?'),
        options: [
          {
            id: 'not-heated',
            text: L('机器还没充分预热（查说明书的预热时间）', 'The machine isn’t fully heated yet (check your manual’s heat-up time)'),
            correct: true,
            feedback: L('很可能。有的机器一两分钟就好，有的要二三十分钟。', 'Likely. Some machines are ready in a minute or two; others need 20–30 minutes.'),
          },
          {
            id: 'beans-bad',
            text: L('豆子坏了，必须换豆', 'The beans are bad and must be replaced'),
            correct: false,
            feedback: L('先排除简单的原因，比如温度，再怀疑豆子。', 'Rule out simple causes like temperature before blaming the beans.'),
          },
          {
            id: 'new-machine',
            text: L('需要换一台更贵的机器', 'You need a more expensive machine'),
            correct: false,
            feedback: L('不必。很多问题来自流程，而不是设备。', 'Not at all. Many problems come from routine, not equipment.'),
          },
        ],
        explanation: L('准备阶段的检查能避免很多“神秘”问题。', 'Checks in the prepare phase prevent many "mystery" problems.'),
      },
      {
        id: 'q-clean',
        prompt: L('每杯之后冲洗冲煮头、擦干手柄，主要是为了？', 'Why flush the group head and wipe the portafilter after each shot?'),
        options: [
          {
            id: 'stale',
            text: L('清除残留的粉和油脂，它们会让下一杯带陈旧苦味', 'Remove leftover grounds and oils that make the next shot taste stale and bitter'),
            correct: true,
            feedback: L('对。随手清洁是最省力的维护。', 'Correct. Cleaning as you go is the easiest maintenance.'),
          },
          {
            id: 'stronger',
            text: L('让下一杯更浓', 'To make the next shot stronger'),
            correct: false,
            feedback: L('清洁不改变浓度，它防止异味。', 'Cleaning doesn’t change strength; it prevents off-flavors.'),
          },
          {
            id: 'unneeded',
            text: L('家用机器不需要', 'Home machines don’t need it'),
            correct: false,
            feedback: L('家用机同样会积累油脂。具体清洁周期按说明书。', 'Home machines build up oils too. Follow your manual for schedules.'),
          },
        ],
        explanation: L('干净的设备 = 更干净的味道。', 'Clean equipment = cleaner flavor.'),
      },
    ],
  },
  {
    id: 'esp-workflow-reflect',
    lessonId: 'esp-workflow',
    kind: 'reflect',
    title: L('想象一下真实操作', 'Picture the Real Thing'),
    supportedModes: REFLECT,
    prompts: [
      L('哪一步在真实操作中你觉得最难？为什么？', 'Which step do you expect to be hardest with real tools? Why?'),
      L('用一句话说明“为什么先布粉再压粉”。', 'In one sentence: why distribute before tamping?'),
      L('你想先在虚拟吧台练习，还是直接用自己的机器？', 'Would you rather practise at the virtual bar first, or go straight to your own machine?'),
    ],
  },

  // ═════════════════════ esp-ratio-lab ═════════════════════
  {
    id: 'esp-ratio-lab-cards',
    lessonId: 'esp-ratio-lab',
    kind: 'explain',
    title: L('意式比例', 'Espresso Ratios'),
    objectiveIds: ['esp.ratio-math'],
    supportedModes: CONCEPT,
    cards: [
      {
        heading: L('液重 ÷ 粉量', 'Yield ÷ dose'),
        body: L(
          '意式比例 = 杯中液重 ÷ 粉量。18 g 粉得到 36 g 咖啡：36 ÷ 18 = 2，记作 1:2。这是一个很常见的起点，但不是唯一的“正确答案”。',
          'Espresso ratio = yield in the cup ÷ dose. 18 g of coffee giving 36 g of espresso: 36 ÷ 18 = 2, written 1:2. A very common starting point — not the one "right" answer.',
        ),
        illustration: 'ratio-bar-espresso',
        callout: { kind: 'illustrative', text: L('18 g → 36 g 是示意起点。', '18 g → 36 g is an illustrative starting point.') },
      },
      {
        heading: L('短萃、常规、长萃', 'Short, normal, long'),
        body: L(
          '比例越小越短、越浓（常称 ristretto 风格，约 1:1–1:1.5）；约 1:2 常被当作“常规”；比例更大更长、更淡（lungo 风格，约 1:2.5–1:3 或更多）。名称和数字在不同咖啡馆、不同国家并不统一。',
          'Smaller ratios are shorter and more concentrated (often called ristretto-style, about 1:1–1:1.5); around 1:2 is often treated as "normal"; bigger ratios are longer and lighter (lungo-style, about 1:2.5–1:3 or more). Names and numbers vary between cafés and countries.',
        ),
        illustration: 'short-normal-long',
        callout: {
          kind: 'culture',
          text: L(
            '在意大利，这些词传统上描述的是杯量和浓淡；精品咖啡馆则常用比例来表达。',
            'In Italy these words traditionally describe volume and intensity; specialty cafés often express them as ratios.',
          ),
        },
      },
      {
        heading: L('称重，别看容量', 'Weigh, don’t eyeball volume'),
        body: L(
          '新鲜咖啡的油脂里有大量气泡，同样的重量看起来可能多一倍。把杯子放在秤上、去皮归零，萃取时看重量，才能准确算出比例。',
          'Fresh crema is full of bubbles, so the same weight can look twice as big. Put the cup on a scale, tare it and watch grams while brewing — that’s how you get a true ratio.',
        ),
        illustration: 'crema-volume',
      },
      {
        heading: L('时间是线索，不是目标', 'Time is a clue, not the goal'),
        body: L(
          '在很多家用机上，1:2 左右的萃取常在约 25–35 秒完成。但有预浸泡的机器、加压粉碗、不同豆子都会改变时间。如果时间偏离很多，它在提示你调整研磨；最终看的是味道。',
          'On many home machines a shot around 1:2 often finishes in roughly 25–35 seconds. Pre-infusion, pressurised baskets and different beans all change that. A time far outside the range is a hint to adjust grind; taste has the final say.',
        ),
        illustration: 'shot-timer',
        callout: {
          kind: 'illustrative',
          text: L('25–35 秒是常见经验范围，不是标准。', '25–35 s is a common rule-of-thumb window, not a standard.'),
        },
      },
      {
        heading: L('换粉碗，保持比例', 'New basket, same ratio'),
        body: L(
          '如果粉碗只适合 16 g，就用 16 g，保持 1:2 的话液重约 32 g。比例让你在不同粉量之间等比换算。',
          'If your basket suits 16 g, use 16 g — keeping 1:2 means about 32 g out. Ratios let you scale between doses.',
        ),
        illustration: 'basket-scale',
      },
    ],
  },
  {
    id: 'esp-ratio-lab-sim',
    lessonId: 'esp-ratio-lab',
    kind: 'parameter-lab',
    lab: 'espresso-ratio',
    title: L('比例调节器', 'Ratio Dial'),
    intro: L('拖动粉量和液重，看比例实时变化。完成下面的小挑战。', 'Drag dose and yield and watch the ratio update live. Try the small challenges below.'),
    objectiveIds: ['esp.ratio-math'],
    supportedModes: CONCEPT,
    defaults: { doseG: 18, outG: 36 },
    ranges: { doseG: [7, 24], outG: [7, 80] },
    illustrativeNote: L(
      '18 g → 36 g（1:2）只是常见的示意起点，不是普遍的理想值。适合你的比例取决于豆子、烘焙、机器和你的口味。',
      '18 g → 36 g (1:2) is only a common illustrative starting point, not a universal ideal. The right ratio for you depends on beans, roast, machine and taste.',
    ),
    challenges: [
      {
        id: 'ch-basket16',
        prompt: L('你的粉碗适合 16 g，保持约 1:2。', 'Your basket suits 16 g. Keep about 1:2.'),
        target: { ratioMin: 1.9, ratioMax: 2.1, doseG: [15.5, 16.5] },
        success: L('16 g → 约 32 g。同样的比例，更小的一杯。', '16 g → about 32 g. Same ratio, smaller drink.'),
      },
      {
        id: 'ch-short',
        prompt: L('做一杯更短、更浓的：比例约 1:1.3–1:1.6。', 'Make a shorter, stronger shot: about 1:1.3 to 1:1.6.'),
        target: { ratioMin: 1.3, ratioMax: 1.6 },
        success: L('更少的液重 = 更高的浓度。很多人觉得这样更厚重、更甜。', 'Less yield = higher strength. Many people find it heavier and sweeter.'),
      },
      {
        id: 'ch-long',
        prompt: L('做一杯更长的：比例约 1:2.5–1:3。', 'Make a longer shot: about 1:2.5 to 1:3.'),
        target: { ratioMin: 2.5, ratioMax: 3 },
        success: L('更长的萃取通常更淡、萃取更多，口感更轻盈。', 'Longer shots are usually lighter and more extracted.'),
      },
      {
        id: 'ch-single',
        prompt: L('用单份粉碗：粉量约 9 g，保持约 1:2。', 'Single basket: dose about 9 g, keep about 1:2.'),
        target: { ratioMin: 1.9, ratioMax: 2.1, doseG: [8.5, 9.5] },
        success: L('9 g → 约 18 g。单份粉碗通常更难稳定，但比例算法一样。', '9 g → about 18 g. Singles are trickier to keep consistent, but the maths is the same.'),
      },
      {
        id: 'ch-recipe',
        prompt: L('某咖啡馆配方是 20 g、1:2.25，液重应该是多少？', 'A café recipe is 20 g at 1:2.25. Find the yield.'),
        target: { ratioMin: 2.2, ratioMax: 2.3, doseG: [19.5, 20.5] },
        success: L('20 × 2.25 = 45 g。', '20 × 2.25 = 45 g.'),
      },
    ],
  },
  {
    id: 'esp-ratio-lab-quiz',
    lessonId: 'esp-ratio-lab',
    kind: 'quiz',
    title: L('小测：比例计算', 'Quick Check: Ratio Maths'),
    objectiveIds: ['esp.ratio-math'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-16',
        prompt: L('粉量 16 g，想要 1:2，液重应该是？', '16 g dose, aiming for 1:2. What yield?'),
        options: [
          { id: '32', text: L('32 g', '32 g'), correct: true, feedback: L('对：16 × 2 = 32。', 'Right: 16 × 2 = 32.') },
          {
            id: '36',
            text: L('36 g', '36 g'),
            correct: false,
            feedback: L('36 g 是 18 g 粉量时的 1:2。粉量变了，液重要跟着变。', '36 g is 1:2 for an 18 g dose. When the dose changes, the yield must too.'),
          },
          {
            id: '8',
            text: L('8 g', '8 g'),
            correct: false,
            feedback: L('那是除以 2。比例数要乘上去：16 × 2。', 'That’s dividing by 2. Multiply by the ratio: 16 × 2.'),
          },
        ],
        explanation: L('液重 = 粉量 × 比例数。', 'Yield = dose × ratio number.'),
      },
      {
        id: 'q-longer',
        prompt: L('A：16 g → 40 g；B：18 g → 36 g。哪一杯比例更“长”？', 'A: 16 g → 40 g. B: 18 g → 36 g. Which is the longer ratio?'),
        options: [
          {
            id: 'a',
            text: L('A（1:2.5）', 'A (1:2.5)'),
            correct: true,
            feedback: L('对。A 的液重相对粉量更多。', 'Correct. A has more yield relative to its dose.'),
          },
          {
            id: 'b',
            text: L('B，因为粉量更多', 'B, because it uses more coffee'),
            correct: false,
            feedback: L('比例看的是“相对”关系：B 是 1:2，A 是 1:2.5。', 'Ratio is relative: B is 1:2, A is 1:2.5.'),
          },
          {
            id: 'same',
            text: L('一样长', 'They’re the same'),
            correct: false,
            feedback: L('分别算一下：40 ÷ 16 = 2.5，36 ÷ 18 = 2。', 'Work them out: 40 ÷ 16 = 2.5; 36 ÷ 18 = 2.'),
          },
        ],
        explanation: L('比较比例，要先各自除一下。', 'To compare ratios, divide each one first.'),
      },
      {
        id: 'q-dose-up',
        prompt: L('把粉量从 18 g 加到 20 g，但液重仍停在 36 g，比例变成？', 'You raise the dose from 18 g to 20 g but still stop at 36 g. The ratio becomes?'),
        options: [
          {
            id: '1.8',
            text: L('1:1.8（更短、更浓）', '1:1.8 (shorter, stronger)'),
            correct: true,
            feedback: L('对：36 ÷ 20 = 1.8。只改粉量也会改变比例。', 'Right: 36 ÷ 20 = 1.8. Changing only the dose also changes the ratio.'),
          },
          {
            id: '2',
            text: L('仍然是 1:2', 'Still 1:2'),
            correct: false,
            feedback: L('液重没跟着变，比例就变了。保持 1:2 需要 40 g。', 'Yield didn’t follow the dose, so the ratio changed. 1:2 would need 40 g.'),
          },
          {
            id: '2.2',
            text: L('1:2.2', '1:2.2'),
            correct: false,
            feedback: L('粉量增加而液重不变，比例会变“短”，不是变“长”。', 'More dose with the same yield makes the ratio shorter, not longer.'),
          },
        ],
        explanation: L('调整一个数字时，记得比例会随之改变。', 'When you change one number, remember the ratio moves too.'),
      },
      {
        id: 'q-preference',
        prompt: L('你喜欢 1:1.8，但一篇教程说 1:2.2 才对。你应该？', 'You prefer 1:1.8, but a guide says 1:2.2 is right. You should…'),
        options: [
          {
            id: 'keep',
            text: L('记下你的偏好；有兴趣时可以试试 1:2.2 做对比', 'Note your preference; try 1:2.2 as a comparison if curious'),
            correct: true,
            feedback: L('对。教程给的是起点，你的口味才是标准。', 'Exactly. Guides give starting points; your taste is the standard.'),
          },
          {
            id: 'wrong',
            text: L('承认自己口味“错了”，改成 1:2.2', 'Accept your taste is "wrong" and switch to 1:2.2'),
            correct: false,
            feedback: L('口味没有对错。比例只是帮你重复喜欢的味道。', 'There’s no wrong taste. Ratios just help you repeat what you like.'),
          },
          {
            id: 'ignore-ratio',
            text: L('不再记录比例', 'Stop recording ratios'),
            correct: false,
            feedback: L('记录正是你能重复喜欢的那一杯的原因。', 'Recording is exactly what lets you repeat the cup you like.'),
          },
        ],
        explanation: L('数字服务于口味，而不是反过来。', 'Numbers serve taste, not the other way around.'),
      },
    ],
  },
  {
    id: 'esp-ratio-lab-reflect',
    lessonId: 'esp-ratio-lab',
    kind: 'reflect',
    title: L('你的起点', 'Your Starting Point'),
    supportedModes: REFLECT,
    prompts: [
      L('你的豆子包装或常去的咖啡馆推荐什么配方？换算成比例是多少？', 'What recipe does your bean bag or favourite café suggest? What ratio is that?'),
      L('结合你的粉碗，写下你第一杯真实意式的起始粉量和目标液重。', 'Given your basket, write down the starting dose and target yield for your first real shot.'),
    ],
  },

  // ═════════════════════ esp-diagnosis ═════════════════════
  {
    id: 'esp-diagnosis-cards',
    lessonId: 'esp-diagnosis',
    kind: 'explain',
    title: L('排查的思路', 'How to Think About a Shot'),
    objectiveIds: ['esp.diagnosis'],
    supportedModes: CONCEPT,
    cards: [
      {
        heading: L('先测量，再品尝', 'Measure first, then taste'),
        body: L(
          '每一杯都记下三个数字：粉量、液重、时间。然后再喝。有了数字，味道才有参照；只凭感觉，很难知道下一次该改什么。',
          'For every shot, note three numbers: dose, yield and time. Then taste. Numbers give your taste something to anchor to — by feel alone, it’s hard to know what to change.',
        ),
        illustration: 'three-numbers',
      },
      {
        heading: L('研磨是流速的主旋钮', 'Grind is the main flow dial'),
        body: L(
          '太快：通常调细一点；太慢：通常调粗一点。每次只动一小格，然后再萃取一杯观察。有的磨豆机一格变化很大，有的很小——先了解你的磨豆机。',
          'Too fast? Usually grind a little finer. Too slow? Usually a little coarser. Move one small step, then pull another shot and watch. Some grinders change a lot per step, others very little — get to know yours.',
        ),
        illustration: 'grind-dial',
      },
      {
        heading: L('一次只改一个', 'Change one thing at a time'),
        body: L(
          '同时改研磨和粉量，就无法知道是哪一个起了作用。一次只改一个变量，记下来，再喝。慢一点，反而学得更快。',
          'Change grind and dose together and you can’t tell which one helped. Change one variable, write it down, taste again. Going slower helps you learn faster.',
        ),
        illustration: 'one-change',
      },
      {
        heading: L('味道是线索，不是判决', 'Taste is a clue, not a verdict'),
        body: L(
          '常见经验：尖酸、单薄、发咸，往往是萃取不足——试试调细或拉长比例；苦、干、涩，往往是萃取过度——试试调粗或缩短比例。但很深的烘焙怎么做都可能偏苦，很浅的烘焙也可能天生明亮。',
          'Rule of thumb: sharp-sour, thin or salty often means under-extracted — try finer or a longer ratio. Bitter, dry or harsh often means over-extracted — try coarser or a shorter ratio. But very dark roasts can taste bitter at any setting, and light roasts may be naturally bright.',
        ),
        illustration: 'taste-compass',
        callout: {
          kind: 'illustrative',
          text: L('这些是经验规律，不是保证。你的豆子和口味可能不同。', 'These are rules of thumb, not guarantees. Your beans and taste may differ.'),
        },
      },
      {
        heading: L('通道效应', 'Channeling'),
        body: L(
          '水会从粉饼的薄弱处冲过去：萃取时出现喷溅、很早就出现浅色条纹、粉饼上有小孔或湿斑。这时通常先改善布粉和水平压粉，而不是马上大幅调研磨。',
          'Water rushes through weak spots in the puck: spurting, pale streaks very early, or holes and wet patches in the spent puck. Usually improve distribution and level tamping first, rather than making a big grind change.',
        ),
        illustration: 'channeling',
      },
      {
        heading: L('好喝就记下来', 'If you like it, write it down'),
        body: L(
          '目标不是“完美”的数字，而是你喜欢的一杯。喝到满意的，记下粉量、液重、时间和研磨格数，下次从这里出发。',
          'The goal isn’t a "perfect" number — it’s a cup you enjoy. When you like one, log dose, yield, time and grind setting, and start there next time.',
        ),
        illustration: 'journal',
      },
    ],
  },
  {
    id: 'esp-diagnosis-scenarios',
    lessonId: 'esp-diagnosis',
    kind: 'diagnose',
    title: L('排查情景（示意）', 'Shot Scenarios (Illustrative)'),
    intro: L(
      '以下都是假设的情景。每次只选一个你下一杯要改的地方。',
      'All of these are hypothetical. For each, choose ONE thing to change on the next shot.',
    ),
    objectiveIds: ['esp.diagnosis'],
    supportedModes: CONCEPT,
    scenarios: [
      {
        id: 'fast-sour',
        situation: L('萃取很快就结束了，喝起来尖酸、单薄。', 'The shot ran very fast and tastes sharp-sour and thin.'),
        observations: { doseG: 18, outG: 36, timeSec: 15, taste: L('尖酸、单薄', 'sour, thin') },
        choices: [
          {
            id: 'finer',
            text: L('把研磨调细一小格', 'Grind one small step finer'),
            quality: 'best',
            feedback: L(
              '很好的第一步：更细的粉让水流变慢、萃取更多。下一杯再看时间和味道。',
              'A great first move: finer grounds slow the flow and extract more. Check time and taste on the next shot.',
            ),
          },
          {
            id: 'longer-ratio',
            text: L('研磨不变，把液重拉长到约 42 g', 'Keep the grind, run longer to about 42 g'),
            quality: 'reasonable',
            feedback: L(
              '也可能有帮助：更多的水会多萃取一些。但流速太快的根本原因通常是研磨偏粗。',
              'Could help: more water extracts a bit more. But the root cause of a very fast shot is usually a grind that’s too coarse.',
            ),
          },
          {
            id: 'all-at-once',
            text: L('同时调细研磨、加粉量、换豆子', 'Grind finer, add more coffee and switch beans all at once'),
            quality: 'unhelpful',
            feedback: L(
              '一次改三样，就算变好了也不知道是哪一样起了作用。',
              'Changing three things means even if it improves, you won’t know which change did it.',
            ),
          },
        ],
        caveat: L(
          '“快而酸”通常指向萃取不足，但浅烘豆天生较明亮，机器温度也有影响。用下一杯验证。',
          '"Fast and sour" usually points to under-extraction, but light roasts are naturally bright and machine temperature matters too. Test it with the next shot.',
        ),
      },
      {
        id: 'slow-bitter',
        situation: L('萃取拖了很久才达到目标液重，喝起来苦、发干。', 'The shot took a long time to reach the target and tastes bitter and dry.'),
        observations: { doseG: 18, outG: 36, timeSec: 45, taste: L('苦、发干、涩', 'bitter, dry, harsh') },
        choices: [
          {
            id: 'coarser',
            text: L('把研磨调粗一小格', 'Grind one small step coarser'),
            quality: 'best',
            feedback: L('对：更粗的粉让水流更快、萃取减少。', 'Yes: coarser grounds speed up flow and reduce extraction.'),
          },
          {
            id: 'less-dose',
            text: L('研磨不变，粉量减少约 1 g', 'Keep the grind, reduce the dose by about 1 g'),
            quality: 'reasonable',
            feedback: L(
              '可行：粉少一点，阻力小一点，水流会变快。记得液重也按比例调整。',
              'Reasonable: less coffee means less resistance and faster flow. Adjust the target yield to keep your ratio.',
            ),
          },
          {
            id: 'finer',
            text: L('把研磨调细', 'Grind finer'),
            quality: 'unhelpful',
            feedback: L('这会让萃取更慢、可能更苦。方向反了。', 'That makes the shot even slower and likely more bitter — wrong direction.'),
          },
        ],
        caveat: L(
          '深烘豆可能在“正常”时间下也偏苦。苦味的感受也因人而异。',
          'Dark roasts can taste bitter even at a "normal" time, and sensitivity to bitterness differs from person to person.',
        ),
      },
      {
        id: 'watery',
        situation: L('时间看起来正常，但杯中液重很多，喝起来水水的、没有力度。', 'Time looks normal, but there’s a lot of liquid and it tastes watery and weak.'),
        observations: { doseG: 18, outG: 54, timeSec: 30, taste: L('水感、淡', 'watery, thin') },
        choices: [
          {
            id: 'shorter',
            text: L('提早停止，把液重收回到约 36–40 g', 'Stop earlier, bringing the yield back to about 36–40 g'),
            quality: 'best',
            feedback: L(
              '对：1:3 的比例本来就会更淡。缩短比例最直接地提高浓度。注意时间也会相应缩短。',
              'Right: a 1:3 ratio is naturally lighter. Shortening the ratio raises strength most directly. Expect the time to shorten too.',
            ),
          },
          {
            id: 'more-dose',
            text: L('液重不变，粉量增加 1–2 g（在粉碗容量内）', 'Keep the yield, add 1–2 g of coffee (within your basket’s capacity)'),
            quality: 'reasonable',
            feedback: L(
              '也会让比例变短、变浓，但会改变流速，可能需要再调研磨。',
              'This also shortens the ratio, but it changes flow too, so you may need to adjust grind afterwards.',
            ),
          },
          {
            id: 'coarser',
            text: L('把研磨调粗', 'Grind coarser'),
            quality: 'unhelpful',
            feedback: L('调粗会让萃取更少、更快，通常会更淡。', 'Coarser grinding extracts less and runs faster — usually even weaker.'),
          },
        ],
        caveat: L(
          '“淡”可能是浓度问题（比例），也可能和豆子有关。先改比例，再看看。',
          '"Weak" can be a strength (ratio) issue, or relate to the beans. Change the ratio first and see.',
        ),
      },
      {
        id: 'too-little',
        situation: L('等了很久，杯子里只有一点点咖啡，几乎是一滴一滴出来。', 'After a long wait there’s only a little coffee in the cup — it barely dripped out.'),
        observations: { doseG: 18, outG: 15, timeSec: 40, taste: L('非常浓、苦', 'very intense, bitter') },
        choices: [
          {
            id: 'coarser',
            text: L('把研磨明显调粗（一到两格）', 'Grind noticeably coarser (a step or two)'),
            quality: 'best',
            feedback: L('对：粉太细“堵住”了水。先让水流起来，再微调。', 'Right: the grind is so fine it’s choking the flow. Get it flowing, then fine-tune.'),
          },
          {
            id: 'check-dose',
            text: L('检查粉量是否超过粉碗容量，必要时减少', 'Check the dose isn’t over the basket’s rating; reduce it if so'),
            quality: 'reasonable',
            feedback: L(
              '好的检查：粉太多会顶到分水网，水流不过去。如果粉量没问题，再调研磨。',
              'Good check: too much coffee can press against the shower screen and block flow. If the dose is fine, adjust grind.',
            ),
          },
          {
            id: 'run-longer',
            text: L('继续萃取到 70 秒，等它凑够 36 g', 'Keep it running to 70 seconds until it reaches 36 g'),
            quality: 'unhelpful',
            feedback: L('时间拉得这么长通常会更苦、更涩，也没有解决堵塞的原因。', 'Running that long usually gets more bitter and harsh, and doesn’t fix the blockage.'),
          },
        ],
        caveat: L(
          '如果调粗后仍然几乎没有水流，可能是机器问题：请查看说明书或联系厂家，不要自行拆机。',
          'If it still barely flows after grinding coarser, it may be a machine issue: check the manual or contact the manufacturer — do not open the machine.',
        ),
      },
      {
        id: 'too-much',
        situation: L('你被打断了，没及时停止，杯子里远超目标液重。', 'You got distracted and didn’t stop in time — the cup is well past your target.'),
        observations: { doseG: 18, outG: 60, timeSec: 34, taste: L('淡、后段发苦', 'thin, bitter finish') },
        choices: [
          {
            id: 'stop-on-target',
            text: L('研磨不变，下次看着秤在目标液重时停止', 'Keep the grind; next time watch the scale and stop at the target'),
            quality: 'best',
            feedback: L(
              '对：这杯的问题是“没停”，不是研磨。保持其他条件，先把停止点做准。',
              'Right: the issue was not stopping, not the grind. Keep everything else and nail the stop point first.',
            ),
          },
          {
            id: 'program',
            text: L('按说明书设置机器的自动出液量', 'Set the machine’s programmable shot volume (per your manual)'),
            quality: 'reasonable',
            feedback: L(
              '如果机器支持，这会有帮助；但容量设定不如称重准确，仍建议用秤核对。',
              'Helpful if your machine supports it, though volume settings are less exact than weight — check with the scale.',
            ),
          },
          {
            id: 'finer',
            text: L('把研磨调细，让它流得慢一点', 'Grind finer so it flows slower'),
            quality: 'unhelpful',
            feedback: L('时间其实是正常的，改研磨会带来新的变量，问题是停止点。', 'The time was actually fine; changing grind adds a new variable when the issue was the stop point.'),
          },
        ],
        caveat: L('先排除操作失误，再去调参数。', 'Rule out routine slips before changing parameters.'),
      },
      {
        id: 'channeling',
        situation: L(
          '时间偏快，萃取一开始就有液体从侧面喷溅，很早出现浅色条纹；喝起来又酸又苦。粉饼上有一个小孔。',
          'The shot ran a bit fast, spurted sideways early and showed pale streaks almost at once; it tastes both sour and bitter. The spent puck has a small hole.',
        ),
        observations: { doseG: 18, outG: 36, timeSec: 20, taste: L('又酸又苦、不协调', 'sour and bitter at once, unbalanced') },
        choices: [
          {
            id: 'prep',
            text: L('研磨不变，改善布粉（打散结块），并确保水平压粉', 'Keep the grind; improve distribution (break up clumps) and tamp level'),
            quality: 'best',
            feedback: L(
              '对：喷溅、早期浅色条纹和小孔，常是通道效应的迹象。先改善粉饼准备。',
              'Yes: spurts, early pale streaks and holes are classic channeling signs. Fix puck prep first.',
            ),
          },
          {
            id: 'dry-basket',
            text: L('确认粉碗干燥、粉量稳定，再试一次', 'Make sure the basket is dry and the dose consistent, then retry'),
            quality: 'reasonable',
            feedback: L(
              '合理：潮湿的粉碗和不稳定的粉量也会造成不均匀。这同样属于“准备”环节。',
              'Reasonable: a damp basket or inconsistent dose can also cause uneven flow. It’s part of prep too.',
            ),
          },
          {
            id: 'finer-harder',
            text: L('大幅调细研磨，同时用更大力气压粉', 'Grind much finer and tamp much harder at the same time'),
            quality: 'unhelpful',
            feedback: L(
              '两个变量一起改，而且更细的粉在粉饼不均时可能让通道更严重。',
              'That’s two changes at once, and a much finer grind can make channeling worse if the bed is still uneven.',
            ),
          },
        ],
        caveat: L(
          '只凭看和尝来判断通道效应并不可靠，这只是“可能”。改善准备后，看下一杯是否更稳定。',
          'Judging channeling by sight and taste alone isn’t reliable — this is a "maybe". After improving prep, see whether the next shot is steadier.',
        ),
      },
      {
        id: 'enjoy',
        situation: L('时间和液重都在你的起点附近，你觉得甜、平衡，很喜欢。', 'Time and yield are near your starting point, and it tastes sweet and balanced to you. You love it.'),
        observations: { doseG: 18, outG: 38, timeSec: 29, taste: L('甜、平衡', 'sweet, balanced') },
        choices: [
          {
            id: 'log-it',
            text: L('把这组参数和研磨格数记下来，下次从这里开始', 'Log these numbers and the grind setting, and start here next time'),
            quality: 'best',
            feedback: L('对！喜欢就是目标。记录让你能重复它。', 'Yes! Enjoying it is the goal. Logging lets you repeat it.'),
          },
          {
            id: 'one-tweak',
            text: L('出于好奇，下次只改一个小地方做对比', 'Out of curiosity, change just one small thing next time to compare'),
            quality: 'reasonable',
            feedback: L('很好的探索方式——只要一次只改一个，并保留这组“基准”。', 'A good way to explore — as long as it’s one change and you keep this as your baseline.'),
          },
          {
            id: 'copy-internet',
            text: L('全部改成网上看到的“标准配方”', 'Change everything to match an "official" recipe online'),
            quality: 'unhelpful',
            feedback: L('没有必要：网上的配方是别人的起点，而你已经找到了自己喜欢的。', 'No need: online recipes are someone else’s starting point, and you’ve found one you like.'),
          },
        ],
        caveat: L('豆子会随时间变化，同一组参数几天后的味道也可能不同。', 'Beans change with age, so the same numbers may taste different a few days later.'),
      },
    ],
  },
  {
    id: 'esp-diagnosis-quiz',
    lessonId: 'esp-diagnosis',
    kind: 'quiz',
    title: L('小测：排查原则', 'Quick Check: Diagnosis Principles'),
    objectiveIds: ['esp.diagnosis'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-one-change',
        prompt: L('为什么建议一次只改一个变量？', 'Why change only one variable at a time?'),
        options: [
          {
            id: 'attribute',
            text: L('这样才能知道是哪一个改变带来了差别', 'So you can tell which change made the difference'),
            correct: true,
            feedback: L('对。这是所有“调参”的核心。', 'Right — that’s the heart of dialing in.'),
          },
          {
            id: 'rule',
            text: L('因为机器一次只能接受一个改变', 'Because the machine can only accept one change at a time'),
            correct: false,
            feedback: L('机器不在乎，是你的“实验”需要可以解释。', 'The machine doesn’t care — it’s your experiment that needs to be interpretable.'),
          },
          {
            id: 'slow',
            text: L('只是为了让过程慢一点', 'Just to slow the process down'),
            correct: false,
            feedback: L('目的不是慢，而是能看懂结果。', 'The point isn’t speed — it’s being able to read the result.'),
          },
        ],
        explanation: L('一次一个变量，结果才说得清。', 'One variable at a time keeps results readable.'),
      },
      {
        id: 'q-gush',
        prompt: L('一杯 18 g 的意式 12 秒就出了 36 g。最有效的第一步通常是？', 'An 18 g shot reaches 36 g in 12 seconds. The most effective first move is usually…'),
        options: [
          {
            id: 'finer',
            text: L('调细研磨', 'Grind finer'),
            correct: true,
            feedback: L('对。研磨是控制流速最主要的旋钮。', 'Right. Grind is the main dial for flow.'),
          },
          {
            id: 'tamp-harder',
            text: L('压粉用两倍的力', 'Tamp twice as hard'),
            correct: false,
            feedback: L('粉压实后再加力影响有限，而且难以重复。先调研磨。', 'Once compressed, extra force changes little and is hard to repeat. Adjust grind first.'),
          },
          {
            id: 'more-water',
            text: L('让它多流一些水', 'Let more water run through'),
            correct: false,
            feedback: L('这会让比例变长、更淡，没解决流速过快的问题。', 'That lengthens the ratio and weakens it without fixing the fast flow.'),
          },
        ],
        explanation: L('太快 → 调细；太慢 → 调粗（一般规律）。', 'Too fast → finer; too slow → coarser (general rule).'),
      },
      {
        id: 'q-channel-sign',
        prompt: L('以下哪一项最像通道效应的迹象？', 'Which is most likely a sign of channeling?'),
        options: [
          {
            id: 'spurts',
            text: L('萃取早期喷溅、出现浅色条纹，粉饼上有小孔', 'Early spurts, pale streaks and small holes in the spent puck'),
            correct: true,
            feedback: L('对。这说明水找到了“捷径”。', 'Correct — water found a shortcut.'),
          },
          {
            id: 'dark-crema',
            text: L('油脂颜色偏深', 'Darker-coloured crema'),
            correct: false,
            feedback: L('油脂颜色更多受烘焙和新鲜度影响。', 'Crema colour depends more on roast and freshness.'),
          },
          {
            id: '30s',
            text: L('30 秒出 36 g', '36 g in 30 seconds'),
            correct: false,
            feedback: L('这本身在常见范围内，并不说明有问题。', 'That’s within a common range and doesn’t indicate a problem by itself.'),
          },
        ],
        explanation: L('通道效应多半是“准备”问题：布粉和水平压粉。', 'Channeling is usually a prep issue: distribution and level tamping.'),
      },
    ],
  },
  {
    id: 'esp-diagnosis-reflect',
    lessonId: 'esp-diagnosis',
    kind: 'reflect',
    title: L('你的排查计划', 'Your Diagnosis Plan'),
    supportedModes: REFLECT,
    prompts: [
      L('下一杯真实意式，你会记录哪三个数字？', 'Which three numbers will you record on your next real shot?'),
      L('如果它又快又酸，你只改哪一件事？', 'If it’s fast and sour, what ONE thing will you change?'),
      L('“酸”和“苦”你能分清吗？哪个更难？', 'Can you tell sour from bitter? Which is harder for you?'),
    ],
  },

  // ═════════════════════ esp-first-real-shot ═════════════════════
  {
    id: 'esp-first-real-shot-cards',
    lessonId: 'esp-first-real-shot',
    kind: 'explain',
    title: L('开始之前', 'Before You Start'),
    objectiveIds: ['esp.real-shot'],
    supportedModes: REAL_WORLD,
    cards: [
      {
        heading: L('你需要什么', 'What you need'),
        body: L(
          '你的咖啡机和磨豆机、手柄和粉碗、压粉器、电子秤、一个小杯、一块毛巾，以及新鲜的咖啡豆。手机放在不会溅到水的地方——Coffee Lab 会一步一步提示你。',
          'Your machine and grinder, portafilter and basket, tamper, a scale, a small cup, a towel and fresh beans. Put your phone somewhere dry — Coffee Lab will guide you step by step.',
        ),
        illustration: 'kit-espresso',
      },
      {
        heading: L('说明书优先，安全第一', 'Manual first, safety always'),
        body: L(
          '先看说明书：预热要多久、哪个按键萃取、你的粉碗是不是加压粉碗。操作时冲煮头、手柄和热水都很烫，磨豆机运转时手指远离。',
          'Check your manual first: heat-up time, which button brews, and whether your basket is pressurised. The group head, portafilter and hot water are hot during use; keep fingers away from a running grinder.',
        ),
        illustration: 'manual-book',
        callout: { kind: 'safety', text: HOT_PARTS },
      },
      {
        heading: L('第一杯是数据，不是考试', 'Your first shot is data, not a test'),
        body: L(
          '第一杯很少完美，这完全正常。记下数字、尝一尝、选一件要改的事。App 看不到也尝不到你的咖啡——完成情况都是你的自我报告，你的感受就是最好的反馈。',
          'First shots are rarely perfect, and that’s normal. Note the numbers, taste, pick one thing to change. The app can’t see or taste your coffee — completion is self-reported, and your own observations are the best feedback.',
        ),
        illustration: 'journal',
      },
    ],
  },
  {
    id: 'esp-first-real-shot-ready',
    lessonId: 'esp-first-real-shot',
    kind: 'quiz',
    title: L('准备好了吗？三个快问', 'Ready? Three Quick Checks'),
    objectiveIds: ['esp.real-shot'],
    supportedModes: ['desktop', 'mobile', 'real-world-guide'],
    questions: [
      {
        id: 'q-manual',
        prompt: L('预热要多久、按哪个键萃取，应该从哪里确认？', 'Where should you check how long to heat up and which button brews?'),
        options: [
          {
            id: 'manual',
            text: L('我这台机器的说明书', 'My machine’s own manual'),
            correct: true,
            feedback: L('对。不同机器差别很大。', 'Right. Machines differ a lot.'),
          },
          {
            id: 'other-video',
            text: L('任何一个别的型号的视频', 'Any video about a different model'),
            correct: false,
            feedback: L('别的型号的操作可能不适用，甚至不安全。以你的说明书为准。', 'Another model’s steps may not apply — or may be unsafe. Your manual comes first.'),
          },
          {
            id: 'guess',
            text: L('边试边猜', 'Guess as I go'),
            correct: false,
            feedback: L('涉及热水和蒸汽时，猜测有风险。先花两分钟看说明书。', 'Guessing around hot water and steam is risky. Spend two minutes with the manual.'),
          },
        ],
        explanation: L('通用流程 + 你的说明书 = 安全又靠谱。', 'General workflow + your manual = safe and reliable.'),
      },
      {
        id: 'q-first-fix',
        prompt: L('第一杯 15 秒就出了 36 g，而且很酸。下一杯你会？', 'Your first shot hit 36 g in 15 seconds and tastes sour. Next shot you’ll…'),
        options: [
          {
            id: 'finer',
            text: L('只把研磨调细一小格', 'Grind one small step finer — nothing else'),
            correct: true,
            feedback: L('对：一个改变，再看结果。', 'Yes: one change, then see what happens.'),
          },
          {
            id: 'everything',
            text: L('研磨、粉量、比例全部换掉', 'Change grind, dose and ratio all at once'),
            correct: false,
            feedback: L('改太多就看不懂结果了。', 'Changing everything makes the result unreadable.'),
          },
          {
            id: 'give-up',
            text: L('认定机器不行', 'Decide the machine is no good'),
            correct: false,
            feedback: L('快而酸是最常见的新手情况，通常调细就能改善。', 'Fast and sour is the most common beginner result; grinding finer usually helps.'),
          },
        ],
        explanation: L('从排查课学到的：一次只改一个。', 'From the diagnosis lesson: one change at a time.'),
      },
      {
        id: 'q-app-knows',
        prompt: L('App 能知道你的这杯意式做得好不好吗？', 'Can the app tell whether your shot turned out well?'),
        options: [
          {
            id: 'self-report',
            text: L('不能。我自己测量、品尝并记录，它是自我报告', 'No. I measure, taste and log it myself — it’s self-reported'),
            correct: true,
            feedback: L('对。Coffee Lab 不会假装看见或尝到你的咖啡。', 'Correct. Coffee Lab never pretends to see or taste your coffee.'),
          },
          {
            id: 'yes',
            text: L('能，App 会自动判断', 'Yes, the app judges it automatically'),
            correct: false,
            feedback: L('App 没有传感器，无法观察你的真实操作或味道。', 'The app has no sensors; it can’t observe your real actions or taste.'),
          },
        ],
        explanation: L('诚实的记录才是有用的记录。', 'Honest logs are useful logs.'),
      },
    ],
  },
  {
    id: 'esp-first-real-shot-guide',
    lessonId: 'esp-first-real-shot',
    kind: 'guided-practice',
    title: L('真实操作：第一杯意式', 'Real-World Guide: Your First Shot'),
    intro: L(
      '一步一步来。每步完成后点“完成”，需要时点“求助”。所有完成都是自我报告。',
      'One step at a time. Tap "Done" after each step, or "Help" when you need it. Everything here is self-reported.',
    ),
    objectiveIds: ['esp.real-shot'],
    supportedModes: REAL_WORLD,
    safetyNotes: [HOT_PARTS, GRINDER_SAFE, MANUAL_NOTE],
    equipment: ['espresso-machine', 'grinder', 'portafilter', 'basket', 'tamper', 'scale', 'espresso-cup', 'towel'],
    recipe: {
      doseG: 18,
      outG: 36,
      ratioLabel: L('1:2（示意起点）', '1:2 (illustrative start)'),
      note: L(
        '这只是常见起点。如果你的粉碗标注的是其他粉量（比如 14–16 g 或 20 g），就用那个粉量并保持约 1:2。豆子包装或说明书可能建议不同的起点。',
        'Just a common starting point. If your basket is rated for a different dose (say 14–16 g or 20 g), use that and keep about 1:2. Your bag or manual may suggest a different start.',
      ),
      targetTimeSec: [25, 35],
    },
    steps: [
      {
        id: 'manual',
        text: L('打开说明书：确认预热时间、萃取按键和粉碗类型', 'Open your manual: find heat-up time, the brew button and your basket type'),
        detail: L('加压（双层）粉碗对研磨不太敏感，时间规律也可能不同。', 'Pressurised (dual-wall) baskets are less sensitive to grind, and timing may behave differently.'),
        help: L(
          '找不到纸质说明书？在厂家官网搜索你的型号通常能找到电子版。',
          'No paper manual? Searching your model on the manufacturer’s website usually finds a PDF.',
        ),
        illustration: 'manual-book',
      },
      {
        id: 'heat',
        text: L('开机，把空手柄装在机器上，按说明书充分预热', 'Switch on, lock the empty portafilter in, and heat up fully as your manual says'),
        detail: L('预热时间从一分钟到半小时不等，取决于机器。', 'Heat-up ranges from about a minute to half an hour depending on the machine.'),
        safety: L('机器预热后，冲煮头和手柄金属部分会很烫。', 'Once heated, the group head and metal portafilter parts get hot.'),
        help: L(
          '不确定是否预热好了？很多机器有指示灯；预热不足常导致咖啡偏酸。',
          'Not sure it’s ready? Many machines have a ready light; under-heating often makes shots sour.',
        ),
      },
      {
        id: 'flush',
        text: L('取下手柄，放一点热水冲洗冲煮头，然后擦干粉碗', 'Remove the portafilter, run a short flush from the group head, then dry the basket'),
        safety: L('热水从冲煮头流出，手不要放在下面。', 'Hot water comes out of the group head — keep hands out from under it.'),
        help: L('用毛巾擦干粉碗内部；潮湿的粉碗容易导致萃取不均。', 'Wipe inside the basket with a towel; a damp basket can cause uneven flow.'),
      },
      {
        id: 'weigh',
        text: L('称出 18 g 咖啡豆（或你粉碗的粉量）', 'Weigh 18 g of beans (or your basket’s dose)'),
        help: L('杯子放上秤、按去皮归零，再倒入豆子。', 'Put a cup on the scale, tare to zero, then add beans.'),
        illustration: 'dose-on-scale',
      },
      {
        id: 'grind',
        text: L('研磨到粉碗里', 'Grind into the basket'),
        safety: GRINDER_SAFE,
        help: L(
          '不知道从哪一格开始？如果磨豆机标了意式范围，从中间开始；之后根据时间调整。',
          'Not sure where to start? If your grinder marks an espresso range, start in the middle and adjust by time afterwards.',
        ),
        illustration: 'grind-dial',
      },
      {
        id: 'distribute',
        text: L('布粉：轻敲手柄或用工具让粉面平整', 'Distribute: tap the portafilter gently or use a tool to level the bed'),
        help: L('目标是没有明显的小山或空隙。可以用手指轻轻抹平表面。', 'Aim for no obvious mounds or gaps. A gentle finger sweep across the top works too.'),
      },
      {
        id: 'tamp',
        text: L('水平、稳定地压粉，然后擦掉粉碗边缘的散粉', 'Tamp firmly and level, then wipe loose grounds off the rim'),
        help: L(
          '手腕保持直，从正上方压下，压到粉不再下沉即可，不需要用尽全力。',
          'Keep your wrist straight and press straight down until the bed stops compressing — no need for all your strength.',
        ),
        illustration: 'tamp-level',
      },
      {
        id: 'lock-cup',
        text: L('装上手柄；把杯子放在秤上、出液口下方，去皮归零', 'Lock in the portafilter; put the cup on the scale under the spouts and tare'),
        safety: L('握住手柄把手，不要碰金属部分。', 'Hold the handle, not the metal.'),
        help: L('如果秤放不进去，可以先称空杯，萃取后再称一次相减。', 'If the scale won’t fit, weigh the empty cup first, then weigh again after and subtract.'),
      },
      {
        id: 'brew',
        text: L('同时按下萃取键和计时器，盯着秤', 'Press brew and start the timer together; watch the scale'),
        detail: L('计时器只是参考，按重量停止，而不是按时间。', 'The timer is a reference — stop by weight, not by time.'),
        timerSec: 30,
        safety: L('萃取时不要把手伸到出液口下方。', 'Keep hands out from under the spouts while brewing.'),
        help: L(
          '如果 10 秒还没出液，别慌，有些机器有预浸泡。超过 45 秒还很少，记下来，下次调粗。',
          'Nothing after 10 s? Don’t panic — some machines pre-infuse. Still very little after 45 s? Note it and grind coarser next time.',
        ),
      },
      {
        id: 'stop',
        text: L('液重接近 36 g（你的目标）时停止，记下重量和时间', 'Stop near 36 g (your target) and note the weight and time'),
        help: L('停止后还会滴几克，这很正常。记录最终秤上的数字。', 'A few grams drip after stopping — that’s normal. Record the final number on the scale.'),
      },
      {
        id: 'taste',
        text: L('搅一搅，尝一口：酸？苦？甜？浓还是淡？你喜欢吗？', 'Stir and sip: sour? bitter? sweet? strong or weak? Do you like it?'),
        help: L(
          '说不清没关系，先给个 1–5 分的喜欢程度。意式很浓，加一点热水尝也可以。',
          'Can’t describe it? That’s fine — just rate how much you like it, 1–5. Espresso is intense; tasting it with a splash of hot water is fine too.',
        ),
        illustration: 'taste-compass',
      },
      {
        id: 'clean',
        text: L('敲掉粉饼，冲洗冲煮头，擦干手柄和粉碗', 'Knock out the puck, flush the group head, wipe the portafilter and basket dry'),
        safety: L('手柄仍然很烫，握住把手。日常深度清洁按说明书进行，不要拆机。', 'The portafilter is still hot — hold the handle. Deeper cleaning follows your manual; never open the machine.'),
        help: L('没有敲渣桶？可以把粉饼敲进垃圾桶或堆肥里。', 'No knock box? Tap the puck into the bin or compost.'),
      },
    ],
    logFields: ['doseG', 'outG', 'timeSec', 'grind', 'taste', 'rating', 'notes'],
  },
  {
    id: 'esp-first-real-shot-reflect',
    lessonId: 'esp-first-real-shot',
    kind: 'reflect',
    title: L('第一杯之后', 'After Your First Shot'),
    supportedModes: REFLECT,
    prompts: [
      L('你的三个数字是多少？比例是多少？', 'What were your three numbers? What ratio is that?'),
      L('用两三个词描述味道。你喜欢吗？', 'Describe the taste in two or three words. Did you like it?'),
      L('下一杯你只改哪一件事？为什么？', 'What ONE thing will you change next time, and why?'),
    ],
  },

  // ═════════════════════ esp-milk-basics ═════════════════════
  {
    id: 'esp-milk-basics-cards',
    lessonId: 'esp-milk-basics',
    kind: 'explain',
    title: L('牛奶与蒸汽', 'Milk and Steam'),
    objectiveIds: ['esp.milk'],
    supportedModes: CONCEPT,
    safetyNotes: [STEAM_BURN],
    cards: [
      {
        heading: L('蒸汽做了两件事', 'Steam does two jobs'),
        body: L(
          '蒸汽棒喷出的蒸汽一边加热牛奶，一边把空气打进去。目标是细腻、有光泽的“微泡”牛奶，而不是一堆粗大的泡沫。',
          'Steam from the wand heats the milk and pushes air into it at the same time. The goal is silky, glossy "microfoam" — not a pile of big bubbles.',
        ),
        illustration: 'steam-milk',
      },
      {
        heading: L('先拉伸，再融合', 'Stretch, then texture'),
        body: L(
          '拉伸：喷嘴刚好在奶面下方，听到轻轻的“嘶嘶”声，空气进入、奶量变多。融合：把喷嘴稍微深入，让牛奶旋转成漩涡，把大气泡打碎、和牛奶融为一体。',
          'Stretching: the tip sits just under the surface and you hear a gentle hiss as air goes in and the volume grows. Texturing: sink the tip slightly so the milk spins into a whirlpool, breaking big bubbles and blending the foam in.',
        ),
        illustration: 'stretch-texture',
      },
      {
        heading: L('多热才合适？', 'How hot?'),
        body: L(
          '很多咖啡师把牛奶加热到约 55–65 °C。再高（约 70 °C 以上）牛奶容易出现煮熟味，泡沫也会变差。温度计最可靠；手扶奶缸侧面、烫到无法持续扶住，只是粗略参考。',
          'Many baristas steam milk to about 55–65 °C. Much hotter — around 70 °C and above — milk tends to taste cooked and the foam suffers. A thermometer is most reliable; a hand on the pitcher’s side becoming too hot to hold is only a rough guide.',
        ),
        illustration: 'milk-thermometer',
        callout: {
          kind: 'illustrative',
          text: L('温度范围是经验值；植物奶通常需要更低的温度和不同手法。', 'Temperature ranges are rules of thumb; plant milks usually need lower temperatures and a different feel.'),
        },
      },
      {
        heading: L('常见奶咖一览', 'Milk drinks at a glance'),
        body: L(
          '卡布奇诺：意式 + 奶 + 较厚的奶泡。拿铁：意式 + 更多牛奶、较薄的奶泡，杯子更大。澳白（Flat White，也译“馥芮白”）：通常杯子比拿铁小、牛奶更少，奶泡很薄、丝滑，咖啡味更突出。可塔朵（Cortado）：意式加上大约等量的热牛奶。',
          'Cappuccino: espresso, milk and a thicker foam layer. Latte: espresso with more milk and thinner foam, in a bigger cup. Flat white: usually a smaller cup than a latte, so less milk, with thin, silky foam — the coffee stands out. Cortado: espresso cut with roughly equal warm milk.',
        ),
        illustration: 'milk-drinks',
        callout: {
          kind: 'culture',
          text: L('名称和杯量在不同咖啡馆、不同国家差别很大，这里只是大致区别。', 'Names and sizes vary a lot between cafés and countries — these are rough distinctions.'),
        },
      },
      {
        heading: L('蒸汽安全', 'Steam safety'),
        body: L(
          '蒸汽比沸水更容易烫伤。只在喷嘴没入牛奶后开蒸汽；先关蒸汽，再移开奶缸；用湿布擦拭蒸汽棒，手不要碰喷嘴。不同机器的蒸汽开关和模式不同，请按说明书操作。',
          'Steam burns more readily than boiling water. Open steam only once the tip is in the milk; close it before lowering the pitcher; wipe the wand with a damp cloth and never touch the tip. Steam controls and modes differ by machine — follow your manual.',
        ),
        illustration: 'hazard-steam',
        callout: { kind: 'safety', text: STEAM_BURN },
      },
    ],
  },
  {
    id: 'esp-milk-basics-quiz',
    lessonId: 'esp-milk-basics',
    kind: 'quiz',
    title: L('小测：打奶', 'Quick Check: Steaming'),
    objectiveIds: ['esp.milk'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-purge',
        prompt: L('开始打奶之前先对着接水盘排一下蒸汽，是为了？', 'Why purge the steam wand into the drip tray before steaming?'),
        options: [
          {
            id: 'water',
            text: L('排出管里的冷凝水，免得冲淡牛奶', 'To clear condensed water so it doesn’t dilute the milk'),
            correct: true,
            feedback: L('对。用完之后也要再排一次，清掉吸进去的牛奶。', 'Right. Purge again after steaming to clear any milk drawn inside.'),
          },
          {
            id: 'warm-hand',
            text: L('暖暖手', 'To warm your hands'),
            correct: false,
            feedback: L('非常危险！蒸汽会严重烫伤，永远不要对着手。', 'Very dangerous! Steam causes serious burns — never aim it at your hands.'),
          },
          {
            id: 'louder',
            text: L('让机器声音更大', 'To make the machine louder'),
            correct: false,
            feedback: L('排气是为了清掉冷凝水，不是为了声音。', 'Purging clears condensed water; it has nothing to do with sound.'),
          },
        ],
        explanation: L('打奶前后都要排气，方向永远远离人。', 'Purge before and after — always pointing away from people.'),
      },
      {
        id: 'q-off-first',
        prompt: L('打完奶后，正确的顺序是？', 'When you finish steaming, what’s the right order?'),
        options: [
          {
            id: 'off-then-lower',
            text: L('先关蒸汽，再移开奶缸', 'Close the steam first, then lower the pitcher'),
            correct: true,
            feedback: L('对。否则蒸汽会把热牛奶喷得到处都是。', 'Right. Otherwise steam sprays hot milk everywhere.'),
          },
          {
            id: 'lower-then-off',
            text: L('先移开奶缸，再关蒸汽', 'Lower the pitcher first, then close the steam'),
            correct: false,
            feedback: L('喷嘴离开牛奶时蒸汽还开着，会喷溅热奶、可能烫伤。', 'Pulling the tip out with steam on sprays hot milk and can burn.'),
          },
          {
            id: 'any',
            text: L('顺序无所谓', 'Order doesn’t matter'),
            correct: false,
            feedback: L('顺序很重要：这是最常见的打奶烫伤原因之一。', 'It matters: this is one of the most common steaming burns.'),
          },
        ],
        explanation: L('关蒸汽 → 移开奶缸 → 擦拭 → 排气。', 'Steam off → lower pitcher → wipe → purge.'),
      },
      {
        id: 'q-boil',
        prompt: L('为什么不把牛奶加热到接近沸腾？', 'Why not heat milk close to boiling?'),
        options: [
          {
            id: 'cooked',
            text: L('过热会出现煮熟味，泡沫也会变差，还更容易烫口', 'It tends to taste cooked, the foam suffers, and it’s more likely to scald you'),
            correct: true,
            feedback: L('对。约 55–65 °C 是很多人喜欢的范围（经验值）。', 'Right. Around 55–65 °C is a range many enjoy (rule of thumb).'),
          },
          {
            id: 'hotter-sweeter',
            text: L('越热越甜', 'Hotter is always sweeter'),
            correct: false,
            feedback: L('相反：过热时甜感往往下降。', 'The opposite: sweetness often drops when milk gets too hot.'),
          },
          {
            id: 'machine-limit',
            text: L('因为咖啡机做不到', 'Because machines can’t do it'),
            correct: false,
            feedback: L('很多机器做得到，但对口感没有好处。', 'Many machines can — it just doesn’t help the drink.'),
          },
        ],
        explanation: L('温度是口味选择，但别超过约 70 °C。', 'Temperature is a taste choice, but stay below about 70 °C.'),
      },
      {
        id: 'q-cappa-latte',
        prompt: L('卡布奇诺和拿铁最主要的区别通常是？', 'What usually separates a cappuccino from a latte?'),
        options: [
          {
            id: 'foam',
            text: L('卡布奇诺奶泡更厚，拿铁牛奶更多、奶泡更薄', 'Cappuccino has thicker foam; a latte has more milk and thinner foam'),
            correct: true,
            feedback: L('对（具体做法因店而异）。', 'Correct (details vary by café).'),
          },
          {
            id: 'coffee-type',
            text: L('用的咖啡豆完全不同', 'They use completely different coffee'),
            correct: false,
            feedback: L('通常用同样的意式，差别在牛奶和奶泡。', 'Usually the same espresso; the difference is in milk and foam.'),
          },
          {
            id: 'cold',
            text: L('拿铁是冷的', 'A latte is cold'),
            correct: false,
            feedback: L('拿铁也可以做冰的，但传统上两者都是热饮。', 'Lattes can be iced, but traditionally both are hot drinks.'),
          },
        ],
        explanation: L('同样的意式，不同的牛奶比例和奶泡厚度。', 'Same espresso, different milk ratio and foam depth.'),
      },
    ],
  },
  {
    id: 'esp-milk-basics-order',
    lessonId: 'esp-milk-basics',
    kind: 'sequence',
    title: L('打奶的顺序', 'Steaming in Order'),
    objectiveIds: ['esp.milk'],
    supportedModes: SPATIAL_OK,
    safetyNotes: [STEAM_BURN],
    prompt: L('把打奶的步骤排好顺序。', 'Put the steaming steps in order.'),
    hint: L('蒸汽只在喷嘴没入牛奶时打开；关蒸汽永远在移开奶缸之前。', 'Steam is only on while the tip is in the milk; closing it always comes before lowering the pitcher.'),
    steps: [
      {
        id: 'pour',
        text: L('冷牛奶倒入冷奶缸，约三分之一满（低于壶嘴根部）', 'Pour cold milk into a cold pitcher, about a third full (below the spout)'),
        why: L('留出膨胀空间；冷的起点给你更多时间打出细腻的奶泡。', 'Leaves room to expand; a cold start gives you more time to build fine foam.'),
      },
      {
        id: 'purge',
        text: L('蒸汽棒朝接水盘短暂排气', 'Briefly purge the wand into the drip tray'),
        why: L('排出冷凝水，免得冲淡牛奶。', 'Clears condensed water so it doesn’t dilute the milk.'),
      },
      {
        id: 'position',
        text: L('喷嘴刚好没入奶面下、略偏离中心，然后打开蒸汽', 'Set the tip just under the surface, slightly off-centre, then open the steam'),
        why: L('先没入再开蒸汽，可以避免喷溅和大气泡。', 'Submerging before opening prevents spraying and big bubbles.'),
      },
      {
        id: 'stretch',
        text: L('拉伸：听到轻柔的“嘶嘶”声，让空气进入几秒钟', 'Stretch: a gentle hiss for a few seconds as air goes in'),
        why: L('牛奶还凉时进气，才能形成细小的气泡。', 'Adding air while the milk is cool makes small bubbles.'),
      },
      {
        id: 'texture',
        text: L('融合：喷嘴稍深，形成漩涡，加热到目标温度', 'Texture: sink the tip slightly, whirlpool, heat to your target'),
        why: L('漩涡把大泡打碎并和牛奶融合成丝滑的质地。', 'The whirlpool breaks big bubbles and blends foam into silky milk.'),
      },
      {
        id: 'off',
        text: L('先关蒸汽，再移开奶缸', 'Close the steam, then lower the pitcher'),
        why: L('喷嘴离开牛奶时蒸汽还开着，会喷出热奶。', 'Pulling the tip out with steam on sprays hot milk.'),
      },
      {
        id: 'wipe',
        text: L('立刻用湿布擦拭蒸汽棒，再短暂排气', 'Wipe the wand right away with a damp cloth, then purge briefly'),
        why: L('牛奶会在热的蒸汽棒上结块；排气清掉吸进管内的牛奶。', 'Milk bakes onto the hot wand; purging clears milk drawn inside.'),
      },
      {
        id: 'finish',
        text: L('轻敲奶缸、摇晃到表面有光泽，然后倒入', 'Tap the pitcher, swirl until glossy, then pour'),
        why: L('敲掉大气泡，摇晃让奶泡和牛奶保持融合。', 'Tapping pops big bubbles; swirling keeps foam and milk blended.'),
      },
    ],
    misconceptions: [
      {
        earlierStep: 'off',
        laterStep: 'wipe',
        feedback: L('蒸汽开着时绝不要去擦或碰蒸汽棒。先关蒸汽。', 'Never wipe or touch the wand while steam is on. Close it first.'),
      },
      {
        earlierStep: 'purge',
        laterStep: 'position',
        feedback: L('先排掉冷凝水，再把喷嘴放进牛奶，否则水会进到奶里。', 'Purge condensed water before the tip goes into the milk, or the water ends up in it.'),
      },
      {
        earlierStep: 'stretch',
        laterStep: 'texture',
        feedback: L(
          '进气要在牛奶还凉的时候做；最后才进气，会形成又大又硬的泡。',
          'Add air while the milk is still cool; adding it at the end makes big, stiff bubbles.',
        ),
      },
      {
        earlierStep: 'position',
        laterStep: 'stretch',
        feedback: L('喷嘴没入之前打开蒸汽会喷溅，有烫伤风险。', 'Opening steam before the tip is submerged sprays and risks burns.'),
      },
    ],
  },
  {
    id: 'esp-milk-basics-steam',
    lessonId: 'esp-milk-basics',
    kind: 'guided-practice',
    title: L('真实操作：打一缸奶', 'Real-World Guide: Steam a Pitcher of Milk'),
    intro: L(
      '先用一点牛奶练手，不需要同时做意式。开始前请找到说明书中关于蒸汽的部分。',
      'Practise with a little milk — no need to make espresso at the same time. Find the steaming section of your manual first.',
    ),
    objectiveIds: ['esp.milk'],
    supportedModes: REAL_WORLD,
    safetyNotes: [STEAM_BURN, MANUAL_NOTE],
    equipment: ['espresso-machine', 'milk-pitcher', 'towel', 'mug'],
    steps: [
      {
        id: 'manual',
        text: L('查看说明书的蒸汽部分：怎样切换到蒸汽模式、等多久、怎么开关', 'Read your manual’s steaming section: how to switch to steam, how long to wait, how to open and close it'),
        safety: L('有的机器切换蒸汽模式后要等待升温，期间可能喷出热水。', 'Some machines need time to build steam and may spit hot water meanwhile.'),
        help: L('如果你的机器只有自动奶泡器，按它的说明操作即可，原理相同。', 'If your machine has an automatic frother instead, follow its instructions — the principles are the same.'),
        illustration: 'manual-book',
      },
      {
        id: 'pitcher',
        text: L('冷牛奶倒入冷奶缸，大约三分之一满', 'Pour cold milk into a cold pitcher, about a third full'),
        help: L('第一次可以只用少量牛奶练习。全脂牛奶通常更容易打出奶泡。', 'Use a small amount for your first try. Whole milk is usually easiest to foam.'),
      },
      {
        id: 'purge',
        text: L('蒸汽棒朝接水盘，短暂排气 1–2 秒', 'Purge the wand into the drip tray for a second or two'),
        safety: L('手远离喷嘴；可以用湿毛巾松松地挡住，但手不要在喷嘴正前方。', 'Keep hands away from the tip; you can loosely shield it with a damp towel, but never put your hand in front of it.'),
        help: L('如果喷出的是水而不是蒸汽，多等一下，或查看说明书是否需要先升温。', 'Spitting water rather than steam? Wait a little longer or check whether the machine needs to build steam first.'),
      },
      {
        id: 'position',
        text: L('喷嘴刚好没入奶面下，略偏离中心；握住奶缸把手，然后打开蒸汽', 'Put the tip just under the surface, slightly off-centre; hold the pitcher handle, then open the steam'),
        safety: STEAM_BURN,
        help: L('奶缸稍微倾斜能帮助形成漩涡。', 'Tilting the pitcher slightly helps the whirlpool form.'),
        illustration: 'stretch-texture',
      },
      {
        id: 'stretch',
        text: L('拉伸：保持轻柔的“嘶嘶”声几秒，奶面会慢慢升高', 'Stretch: keep a gentle hiss for a few seconds while the surface rises'),
        detail: L('拿铁少进一点空气，卡布奇诺多进一点。', 'Add less air for a latte, more for a cappuccino.'),
        timerSec: 8,
        help: L(
          '大泡泡、噼啪乱溅：喷嘴太高了，稍微往下放。完全没声音：喷嘴太深，稍微往上提。',
          'Big bubbles and loud spluttering: the tip is too high — lower it slightly. No hiss at all: it’s too deep — raise it a touch.',
        ),
      },
      {
        id: 'texture',
        text: L('融合：喷嘴稍微深入，让牛奶打转，加热到目标温度', 'Texture: sink the tip slightly, let the milk spin, heat to your target'),
        detail: L('约 55–65 °C；用温度计最可靠。', 'About 55–65 °C; a thermometer is most reliable.'),
        safety: L('奶缸会变烫，握住把手。', 'The pitcher gets hot — hold the handle.'),
        help: L(
          '没有温度计？当奶缸侧面烫到你没法继续扶住时，大致到了范围——这只是粗略参考。',
          'No thermometer? When the side of the pitcher gets too hot to keep your hand on, you’re roughly there — a rough guide only.',
        ),
      },
      {
        id: 'off',
        text: L('先关蒸汽，再把奶缸放下', 'Close the steam FIRST, then lower the pitcher'),
        safety: L('顺序反了会喷出热牛奶，造成烫伤。', 'Doing this the other way round sprays hot milk and can burn.'),
        help: L('一时慌了？保持奶缸不动，先关蒸汽。', 'Flustered? Keep the pitcher still and close the steam first.'),
      },
      {
        id: 'wipe-purge',
        text: L('立刻用湿布擦拭蒸汽棒，然后朝接水盘短暂排气', 'Wipe the wand immediately with a damp cloth, then purge briefly into the drip tray'),
        safety: L('蒸汽棒非常烫：用布擦，不要用手碰喷嘴。', 'The wand is very hot: wipe with the cloth, never touch the tip.'),
        help: L('如果牛奶已经结在蒸汽棒上，按说明书的方法清洁。', 'If milk has baked on, clean it as your manual describes.'),
      },
      {
        id: 'finish',
        text: L('轻敲奶缸、摇晃到表面有光泽，倒进杯子里尝一尝', 'Tap the pitcher, swirl until glossy, pour into a mug and taste'),
        help: L('如果表面还是有大泡，下次拉伸的时间短一些。', 'Still big bubbles on top? Stretch for less time next go.'),
      },
    ],
    logFields: ['taste', 'rating', 'notes'],
  },
  {
    id: 'esp-milk-basics-reflect',
    lessonId: 'esp-milk-basics',
    kind: 'reflect',
    title: L('牛奶练习反思', 'Milk Practice Reflection'),
    supportedModes: REFLECT,
    prompts: [
      L('你的奶泡更像“微泡”还是“大泡”？下次你会怎样调整喷嘴位置？', 'Was your foam more microfoam or big bubbles? How will you adjust the tip position next time?'),
      L('你最想做的奶咖是哪一种？它需要更多还是更少的奶泡？', 'Which milk drink do you most want to make? Does it need more or less foam?'),
    ],
  },
];

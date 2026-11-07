/**
 * Optional EXPLORE track: sensory, dialing in, origin & processing, roast,
 * water, cleaning & care. Owner: coffee-curriculum (atlas).
 *
 * Never a prerequisite for core lessons. All numbers are illustrative; taste
 * is the learner's own; guided practice is ALWAYS self-reported. Machine
 * maintenance defers to the manufacturer's instructions.
 */
import type { Activity, Lesson, LocalizedText, Mode, Track } from '../../domain/contracts';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });
const COG: Mode[] = ['desktop', 'mobile'];
const REAL: Mode[] = ['mobile', 'real-world-guide', 'desktop'];

const CAVEAT = L(
  '示意场景：真实结果取决于你的豆子、磨豆机、机器、水和你自己的口味。',
  'Illustrative scenario: real results depend on your beans, grinder, machine, water and your own taste.',
);
const SAFE_HOT = L('热水和热咖啡会烫伤：先小口试温。', 'Hot water and coffee can scald — test with a small sip first.');
const SAFE_STEAM = L(
  '蒸汽、冲煮头和手柄都很烫；机器带电带压，只做说明书允许的操作。',
  'Steam, the group head and portafilter are hot; the machine is electrical and pressurised — do only what your manual allows.',
);
const SAFE_GRINDER = L('清理或疏通磨豆机前先拔插头；手指绝不伸进去。', 'Unplug the grinder before cleaning or clearing it; never put fingers inside.');
const SAFE_MANUAL = L(
  '除垢、反冲洗、拆卸等维护：请严格按照厂家说明书操作。Coffee Lab 不提供特定机器的维修步骤。',
  'Descaling, backflushing and any disassembly: follow your manufacturer’s instructions. Coffee Lab does not give machine-specific maintenance procedures.',
);

export const track: Track = {
  id: 'explore',
  order: 4,
  title: L('探索：风味、调校与保养', 'Explore: taste, tuning & care'),
  summary: L(
    '可选进阶：学会描述风味、一次只改一个变量地调整配方，了解产地、处理法、烘焙、水质和器具保养。不是核心路线的前置条件，随时可以来逛。',
    'Optional deep dives: describe what you taste, tune a recipe one variable at a time, and learn about origins, processing, roast, water and gear care. Never required for the core path — drop in any time.',
  ),
  lessonIds: [
    'exp-sensory-basics',
    'exp-dialing-in',
    'exp-origin-processing',
    'exp-roast-levels',
    'exp-water',
    'exp-cleaning-care',
  ],
  optional: true,
};

export const lessons: Lesson[] = [
  {
    id: 'exp-sensory-basics',
    track: 'explore',
    level: 'beginner',
    title: L('品尝入门：说出你喝到了什么', 'Tasting basics: put words to your cup'),
    goal: L(
      '能用酸度、甜感、苦味、醇厚度和香气描述一杯咖啡，并通过并排对比说出两杯的差异和自己的偏好。',
      'Describe a cup using acidity, sweetness, bitterness, body and aroma, and compare two cups side by side to name a difference and your own preference.',
    ),
    prerequisites: ['lit-what-is-coffee'],
    keyConcepts: [
      L('舌头尝味道，鼻子（鼻后嗅觉）感知大部分“风味”', 'The tongue tastes; most “flavour” is aroma sensed through the nose (retronasal)'),
      L('酸度、甜感、苦味、醇厚度四个好用的维度', 'Four handy dimensions: acidity, sweetness, bitterness, body'),
      L('风味词汇是工具，不是标准答案', 'Flavour words are tools, not answers to match'),
      L('并排对比比单独品尝更容易发现差异', 'Side-by-side comparison reveals differences far more easily'),
      L('喜好是个人的，没有应用能预测你会喜欢什么', 'Preference is personal — no app can predict what you will enjoy'),
    ],
    activityIds: [
      'exp-sensory-basics-explain',
      'exp-sensory-basics-quiz',
      'exp-sensory-basics-tasting',
      'exp-sensory-basics-reflect',
    ],
    checkForUnderstanding: ['exp-sensory-basics-quiz'],
    safetyNotes: [
      SAFE_HOT,
      L('品尝多杯时注意咖啡因摄入：小口品尝即可，不必喝完。', 'Mind your caffeine when tasting several cups — small sips are enough, no need to finish them.'),
    ],
    estimatedMinutes: 25,
    sources: ['atlas-sca-flavor-wheel', 'atlas-sca-csp'],
    confidence: 'rule-of-thumb',
    next: ['exp-roast-levels', 'exp-origin-processing'],
  },
  {
    id: 'exp-dialing-in',
    track: 'explore',
    level: 'intermediate',
    title: L('调校浓缩：一次只改一件事', 'Dialing in espresso: one change at a time'),
    goal: L(
      '能按“测量 → 品尝 → 只改一个变量 → 再测量”的循环调整一款新豆子的浓缩配方，并知道什么时候可以停下。',
      'Tune an espresso recipe for a new coffee using the loop measure → taste → change one variable → measure again, and know when to stop.',
    ),
    prerequisites: ['esp-ratio-lab', 'esp-diagnosis'],
    keyConcepts: [
      L('“调校”是针对这包豆子、这台磨豆机和机器调整配方', 'Dialing in adapts a recipe to this coffee, grinder and machine'),
      L('研磨度是调整流速的主要手段', 'Grind size is the main lever for flow'),
      L('出液量（粉液比）影响浓度和平衡', 'Yield (ratio) shapes strength and balance'),
      L('时间是观察结果，口味才是裁判', 'Time is an observation; taste is the judge'),
      L('一次只改一个变量，并记录下来', 'Change one variable at a time — and write it down'),
    ],
    activityIds: [
      'exp-dialing-in-explain',
      'exp-dialing-in-loop',
      'exp-dialing-in-diagnose',
      'exp-dialing-in-session',
      'exp-dialing-in-reflect',
    ],
    checkForUnderstanding: ['exp-dialing-in-loop', 'exp-dialing-in-diagnose'],
    safetyNotes: [SAFE_STEAM, SAFE_GRINDER],
    estimatedMinutes: 35,
    sources: ['atlas-sca-csp', 'atlas-practice-consensus', 'atlas-manufacturer-manuals'],
    confidence: 'rule-of-thumb',
    next: ['exp-water', 'exp-cleaning-care'],
  },
  {
    id: 'exp-origin-processing',
    track: 'explore',
    level: 'beginner',
    title: L('从果实到咖啡豆：产地与处理法', 'From cherry to bean: origin & processing'),
    goal: L(
      '能说出咖啡豆是咖啡果的种子，区分阿拉比卡与罗布斯塔，按顺序描述从采收到冲煮的主要环节，并解释水洗、日晒、蜜处理带来的“倾向”而非确定的味道。',
      'Explain that coffee beans are the seeds of a fruit, tell arabica from robusta, order the main steps from harvest to brewing, and describe washed, natural and honey processing as tendencies rather than guaranteed flavours.',
    ),
    prerequisites: ['lit-what-is-coffee'],
    keyConcepts: [
      L('咖啡豆是咖啡果的种子', 'Coffee beans are the seeds of the coffee cherry'),
      L('两大主要品种：阿拉比卡与罗布斯塔（中粒种）', 'Two main species: arabica and robusta (canephora)'),
      L('海拔、气候、品种和种植方式都会影响风味', 'Altitude, climate, variety and farming all shape flavour'),
      L('处理法：水洗、日晒、蜜处理', 'Processing: washed, natural, honey'),
      L('读懂豆袋标签：产区、处理法、烘焙日期', 'Reading a bag: origin, process, roast date'),
    ],
    activityIds: [
      'exp-origin-processing-explain',
      'exp-origin-processing-sequence',
      'exp-origin-processing-quiz',
      'exp-origin-processing-reflect',
    ],
    checkForUnderstanding: ['exp-origin-processing-sequence', 'exp-origin-processing-quiz'],
    safetyNotes: [],
    estimatedMinutes: 15,
    sources: ['atlas-nca-lifecycle', 'atlas-wcr-varieties', 'atlas-ico', 'atlas-yunnan-case'],
    confidence: 'rule-of-thumb',
    next: ['exp-roast-levels', 'cul-origins-legends'],
  },
  {
    id: 'exp-roast-levels',
    track: 'explore',
    level: 'beginner',
    title: L('烘焙度与新鲜度', 'Roast levels & freshness'),
    goal: L(
      '能描述浅、中、深烘的一般倾向，纠正“深烘咖啡因更多”等常见误解，并为换了烘焙度的豆子选择一个合理的单一调整。',
      'Describe general tendencies of light, medium and dark roasts, correct myths such as “dark roast has more caffeine”, and choose one sensible adjustment when switching roast levels.',
    ),
    prerequisites: ['lit-what-is-coffee'],
    keyConcepts: [
      L('烘焙把生豆的青草味转化为数百种香气物质', 'Roasting turns grassy green coffee into hundreds of aroma compounds'),
      L('浅、中、深烘的风味倾向（不是规则）', 'Light, medium and dark tendencies (not rules)'),
      L('各家烘焙商的“中烘”并不统一', 'One roaster’s “medium” is not another’s'),
      L('养豆与新鲜度：二氧化碳释放、开封后风味衰减', 'Resting and freshness: CO₂ release, flavour fading after opening'),
      L('储存：密封、阴凉、避光', 'Storage: airtight, cool, dark'),
    ],
    activityIds: [
      'exp-roast-levels-explain',
      'exp-roast-levels-quiz',
      'exp-roast-levels-diagnose',
      'exp-roast-levels-reflect',
    ],
    checkForUnderstanding: ['exp-roast-levels-quiz', 'exp-roast-levels-diagnose'],
    safetyNotes: [
      L('本课不教家庭烘豆。如果尝试，会有烟、银皮和高温，务必通风并遵守烘豆设备说明书。', 'This lesson does not teach home roasting. If you try it: smoke, chaff and high heat — ventilate well and follow your roaster’s manual.'),
    ],
    estimatedMinutes: 15,
    sources: ['atlas-nca-lifecycle', 'atlas-sca-csp', 'atlas-practice-consensus'],
    confidence: 'rule-of-thumb',
    next: ['exp-water', 'exp-dialing-in'],
  },
  {
    id: 'exp-water',
    track: 'explore',
    level: 'intermediate',
    title: L('水：看不见的配料', 'Water: the invisible ingredient'),
    goal: L(
      '能解释为什么水中矿物质会影响风味和机器，把 SCA 的水质目标当作参考而不是硬性规定，并通过双水对比品尝得出自己的结论。',
      'Explain why minerals in water affect both flavour and machines, treat SCA water targets as a reference rather than a rule, and draw your own conclusion from a two-water taste test.',
    ),
    prerequisites: ['lit-brewing-concepts'],
    keyConcepts: [
      L('一杯咖啡绝大部分是水', 'A cup of coffee is almost entirely water'),
      L('钙镁帮助萃取，碳酸氢盐缓冲酸度', 'Calcium and magnesium help extraction; bicarbonate buffers acidity'),
      L('SCA 水质标准是参考点（如 TDS 约 150 mg/L）', 'SCA’s water standard is a reference point (e.g. TDS around 150 mg/L)'),
      L('硬水结垢，过纯的水也可能不适合机器', 'Hard water scales machines; very pure water may not suit them either'),
      L('水温主要改变萃取速度，是众多变量之一', 'Water temperature mainly changes extraction speed — one lever among several'),
    ],
    activityIds: [
      'exp-water-explain',
      'exp-water-quiz',
      'exp-water-taste-test',
      'exp-water-diagnose',
      'exp-water-reflect',
    ],
    checkForUnderstanding: ['exp-water-quiz', 'exp-water-diagnose'],
    safetyNotes: [
      SAFE_HOT,
      L('咖啡机请使用厂家推荐的水，除垢按说明书进行。', 'Use the water type your machine’s manufacturer recommends, and descale per its instructions.'),
    ],
    estimatedMinutes: 30,
    sources: ['atlas-sca-water', 'atlas-sca-golden-cup', 'atlas-batali-2020', 'atlas-manufacturer-manuals'],
    confidence: 'rule-of-thumb',
    next: ['exp-cleaning-care'],
  },
  {
    id: 'exp-cleaning-care',
    track: 'explore',
    level: 'beginner',
    title: L('清洁与保养：安全第一', 'Cleaning & care: safety first'),
    goal: L(
      '能完成一套安全的日常收尾流程，解释为什么陈旧油脂和奶渍会影响风味与卫生，并知道哪些维护必须遵循厂家说明。',
      'Complete a safe daily tidy-up routine, explain why stale oils and milk residue hurt flavour and hygiene, and know which maintenance must follow the manufacturer’s instructions.',
    ),
    prerequisites: ['lit-tools-safety'],
    keyConcepts: [
      L('陈旧咖啡油脂会带来不新鲜的怪味', 'Stale coffee oils add off-flavours'),
      L('奶渍关乎卫生，蒸汽棒要即用即清', 'Milk residue is a hygiene issue — clean the wand right away'),
      L('日常小习惯 vs 定期维护', 'Daily habits vs periodic maintenance'),
      L('先冷却、先断电，再清洁', 'Cool down and unplug before cleaning'),
      L('除垢与反冲洗：只按厂家说明', 'Descaling and backflushing: manufacturer’s instructions only'),
    ],
    activityIds: [
      'exp-cleaning-care-explain',
      'exp-cleaning-care-sequence',
      'exp-cleaning-care-quiz',
      'exp-cleaning-care-routine',
      'exp-cleaning-care-reflect',
    ],
    checkForUnderstanding: ['exp-cleaning-care-sequence', 'exp-cleaning-care-quiz'],
    safetyNotes: [SAFE_STEAM, SAFE_GRINDER, SAFE_MANUAL],
    estimatedMinutes: 25,
    sources: ['atlas-manufacturer-manuals', 'atlas-sca-csp', 'atlas-practice-consensus'],
    confidence: 'rule-of-thumb',
    next: ['exp-dialing-in'],
  },
];

export const activities: Activity[] = [
  // ═════════════════════ exp-sensory-basics ═════════════════════
  {
    id: 'exp-sensory-basics-explain',
    lessonId: 'exp-sensory-basics',
    kind: 'explain',
    title: L('舌头、鼻子和一本风味词典', 'Tongue, nose and a flavour dictionary'),
    intro: L('品尝是可以练出来的技能。先认识几个好用的词。', 'Tasting is a skill you can practise. Start with a few useful words.'),
    supportedModes: COG,
    cards: [
      {
        heading: L('舌头尝味道，鼻子找风味', 'Your tongue tastes, your nose finds flavour'),
        body: L(
          '舌头能分辨甜、酸、苦、咸、鲜。而“莓果”“巧克力”“花香”这些风味，大多是咖啡的香气从口腔后方上升到鼻腔被感知到的（鼻后嗅觉）。',
          'Your tongue detects sweet, sour, bitter, salty and savoury. “Berry”, “chocolate” or “floral” are mostly aromas rising from the back of your mouth into your nose (retronasal smell).',
        ),
        illustration: 'sensory-nose-tongue',
        callout: {
          kind: 'tip',
          text: L('小实验：捏住鼻子喝一口，再松开——风味会突然“出现”。', 'Try it: pinch your nose, sip, then let go — the flavour suddenly “appears”.'),
        },
      },
      {
        heading: L('四个好用的维度', 'Four handy dimensions'),
        body: L(
          '酸度：明亮、活泼，像苹果或柑橘（不等于“发酸难喝”）。甜感：圆润、像焦糖或水果的甜。苦味：适度很正常，尖锐刺激则是线索。醇厚度：口中的重量和质地，像脱脂奶与全脂奶的区别。',
          'Acidity: bright and lively, like apple or citrus (not the same as unpleasantly sour). Sweetness: rounded, caramel- or fruit-like. Bitterness: some is normal; harsh bitterness is a clue. Body: weight and texture in the mouth — like skim versus whole milk.',
        ),
        illustration: 'sensory-dimensions',
      },
      {
        heading: L('风味轮是一本词典', 'The flavour wheel is a dictionary'),
        body: L(
          'SCA 与世界咖啡研究组织（WCR）的咖啡风味轮把词汇从笼统（“果香”）排到具体（“蓝莓”）。先从笼统的词开始，“果香”“坚果感”就是很好的答案。',
          'The SCA and World Coffee Research flavour wheel arranges words from general (“fruity”) to specific (“blueberry”). Start general — “fruity” or “nutty” is a great answer.',
        ),
        illustration: 'flavor-wheel-abstract',
        callout: {
          kind: 'myth',
          text: L(
            '误区：“豆袋上写蓝莓而我喝不出来，就是我不会喝。”其实风味描述是烘焙商在他们的条件下的印象，冲煮方式、水和个人感知都会改变你注意到的东西。',
            'Myth: “The bag says blueberry and I can’t taste it, so I’m doing it wrong.” Tasting notes are the roaster’s impression under their conditions; brewing, water and your own perception change what you notice.',
          ),
        },
      },
      {
        heading: L('对比是捷径', 'Comparison is the shortcut'),
        body: L(
          '单独喝一杯时很难描述，但两杯并排就容易多了：“A 更亮，B 更圆润”。咖啡变凉时风味也会变化，所以分几次品尝。两口之间喝点清水。',
          'One cup alone is hard to describe; two side by side is much easier: “A is brighter, B is rounder.” Flavours shift as coffee cools, so taste more than once, with a sip of water in between.',
        ),
        illustration: 'tasting-two-cups',
        callout: { kind: 'tip', text: L('热咖啡会掩盖风味，放凉几分钟再尝。', 'Very hot coffee hides flavour — let it cool a few minutes.') },
      },
      {
        heading: L('你的喜好就是标准', 'Your preference counts'),
        body: L(
          'Coffee Lab 不会给你的口味打分，也不会假装能预测你会喜欢哪一杯。目标是能描述、能比较、能有意识地选择。',
          'Coffee Lab never scores your taste or pretends to predict which cup you’ll like. The goal is to describe, compare and choose on purpose.',
        ),
        illustration: 'preference-heart',
      },
    ],
  },
  {
    id: 'exp-sensory-basics-quiz',
    lessonId: 'exp-sensory-basics',
    kind: 'quiz',
    title: L('品尝小测', 'Tasting check'),
    supportedModes: COG,
    questions: [
      {
        id: 'exp-sensory-q1',
        prompt: L('捏住鼻子喝咖啡时，“巧克力”的风味几乎消失了。为什么？', 'You pinch your nose while sipping and the “chocolate” note almost disappears. Why?'),
        options: [
          { id: 'a', text: L('巧克力风味主要是通过鼻子感知的香气', 'Chocolate flavour is mostly aroma sensed through the nose'), correct: true, feedback: L('对！大多数“风味”其实是鼻后嗅觉。', 'Yes — most “flavour” is retronasal smell.') },
          { id: 'b', text: L('捏鼻子让咖啡变凉了', 'Pinching your nose made the coffee colder'), correct: false, feedback: L('温度没有变化，变的是气流能否到达你的鼻腔。', 'The temperature didn’t change — what changed is whether air reaches your nose.') },
          { id: 'c', text: L('这杯咖啡本来就没有巧克力味', 'The coffee never had a chocolate note'), correct: false, feedback: L('一松开鼻子风味就回来了，说明它一直都在，只是作为香气被感知。', 'Let go and the note returns — it was there all along, as aroma.') },
        ],
        explanation: L('舌头只能尝出几种基本味道，丰富的风味来自鼻后嗅觉。', 'The tongue senses a few basic tastes; rich flavour comes from retronasal smell.'),
      },
      {
        id: 'exp-sensory-q2',
        prompt: L('朋友说：“这杯有酸味，所以没做好。”更好的理解是？', 'A friend says, “This coffee is acidic, so it’s badly made.” What’s a better way to think about it?'),
        options: [
          { id: 'a', text: L('酸度可以是愉悦的明亮感；不舒服的尖酸才可能是萃取不足的线索', 'Acidity can be a pleasant brightness; only unpleasant sharp sourness may hint at under-extraction'), correct: true, feedback: L('对。先描述它是“明亮好喝”还是“尖锐刺口”。', 'Right — first describe whether it is pleasantly bright or sharp and unpleasant.') },
          { id: 'b', text: L('所有酸味都是缺陷', 'All acidity is a defect'), correct: false, feedback: L('很多备受喜爱的咖啡正是以活泼的酸度著称。', 'Many prized coffees are celebrated for lively acidity.') },
          { id: 'c', text: L('有酸味说明豆子变质了', 'Acidity means the beans have gone off'), correct: false, feedback: L('新鲜咖啡本身含有天然酸；放久了的咖啡更常见的是平淡、纸板味。', 'Fresh coffee naturally contains acids; stale coffee more often tastes flat or papery.') },
        ],
        explanation: L('“酸”在咖啡里既可能是优点也可能是线索，关键是描述得具体。', 'In coffee, acidity can be a virtue or a clue — the key is describing it precisely.'),
      },
      {
        id: 'exp-sensory-q3',
        prompt: L('下面哪一项描述的是“醇厚度（body）”？', 'Which of these describes “body”?'),
        options: [
          { id: 'a', text: L('咖啡在口中的重量和质地', 'The weight and texture of the coffee in your mouth'), correct: true, feedback: L('对，像清茶与糖浆、脱脂奶与全脂奶的区别。', 'Yes — like tea versus syrup, skim versus whole milk.') },
          { id: 'b', text: L('咖啡因含量', 'How much caffeine it has'), correct: false, feedback: L('咖啡因和口感关系不大；醇厚度说的是质地。', 'Caffeine has little to do with mouthfeel; body is about texture.') },
          { id: 'c', text: L('咖啡颜色有多深', 'How dark the colour is'), correct: false, feedback: L('颜色说明不了太多，看起来很深的咖啡也可能口感很薄。', 'Colour says little — a dark-looking cup can still feel thin.') },
        ],
        explanation: L('醇厚度 = 口感的重量。', 'Body = how heavy the coffee feels.'),
      },
      {
        id: 'exp-sensory-q4',
        prompt: L('豆袋写着“蓝莓、茉莉”，你喝到的是“甜、有点坚果感”。应该怎么看？', 'The bag says “blueberry, jasmine” but you taste “sweet, a bit nutty”. What should you conclude?'),
        options: [
          { id: 'a', text: L('你的描述同样有效；风味描述受冲煮、水和个人感知影响', 'Your description is valid; notes depend on brewing, water and perception'), correct: true, feedback: L('没错。你可以继续用自己的词，也可以试着找找袋子上的风味。', 'Exactly. Keep your own words — and you can also go looking for the bag’s notes.') },
          { id: 'b', text: L('说明我的味觉不行', 'It means my palate is bad'), correct: false, feedback: L('品尝是可以练习的技能，每个人的感知也不同，不存在“不行”。', 'Tasting is a trainable skill and perception varies — there’s no “bad” palate.') },
          { id: 'c', text: L('说明烘焙商在撒谎', 'It means the roaster lied'), correct: false, feedback: L('那是他们在自己条件下的真实印象，你的条件不同，结果也可能不同。', 'Those are honest impressions under their conditions; yours differ, and so may the cup.') },
        ],
        explanation: L('风味描述是线索，不是考试答案。', 'Tasting notes are hints, not exam answers.'),
      },
    ],
  },
  {
    id: 'exp-sensory-basics-tasting',
    lessonId: 'exp-sensory-basics',
    kind: 'guided-practice',
    title: L('在家并排品尝两杯', 'Side-by-side tasting at home'),
    intro: L(
      '冲两小杯咖啡，只改变一个因素，然后来回对比。完成情况由你自己确认（自我报告）。',
      'Brew two small cups that differ in ONE way and compare them. Completion is self-reported.',
    ),
    supportedModes: REAL,
    safetyNotes: [SAFE_HOT],
    equipment: ['dripper', 'paper-filter', 'gooseneck-kettle', 'grinder', 'scale', 'timer', 'cup'],
    recipe: {
      doseG: 15,
      outG: 250,
      ratioLabel: L('每杯约 1:16.7', 'About 1:16.7 per cup'),
      note: L(
        '示例数值。用你平时的手冲配方也完全可以——关键是两杯除了一个变量外完全相同。',
        'Illustrative numbers. Your usual pour-over recipe is fine — what matters is keeping both cups identical except for one variable.',
      ),
    },
    steps: [
      {
        id: 'choose',
        text: L('选一个要比较的差异', 'Pick ONE difference to compare'),
        detail: L('两种不同的豆子用相同配方；或者同一种豆子用两个粉量（如 15 克和 13 克，水都是 250 克）。', 'Two different coffees with the same recipe, or one coffee at two doses (e.g. 15 g and 13 g, both with 250 g water).'),
        help: L('拿不定主意就比较两包不同的豆子，这是最容易喝出差别的。', 'If unsure, compare two different bags — that’s the easiest difference to notice.'),
      },
      {
        id: 'brew-a',
        text: L('冲第一杯，标记为 A', 'Brew cup A and label it'),
        safety: L('热水会烫伤：壶放稳，手远离水流。', 'Hot water scalds: keep the kettle stable and hands clear of the stream.'),
        help: L('用你在手冲课里学过的流程就行；技巧本身不重要，重要的是两杯做法一致。', 'Use your pour-over routine; exact technique matters less than doing both cups the same way.'),
        illustration: 'pourover-pour',
      },
      {
        id: 'brew-b',
        text: L('冲第二杯 B，只改变你选定的那一个因素', 'Brew cup B, changing only the variable you chose'),
        help: L('研磨、水温、注水方式都保持一样。如果不小心改了别的，记下来就好。', 'Keep grind, water temperature and pouring the same. If something else changed by accident, just note it.'),
      },
      {
        id: 'cool',
        text: L('让两杯都放凉约 5 分钟', 'Let both cups cool for about 5 minutes'),
        detail: L('太烫会掩盖风味，也容易烫嘴。', 'Very hot coffee hides flavour and can burn your mouth.'),
        timerSec: 300,
        safety: SAFE_HOT,
        help: L('可以趁这时闻一闻两杯的香气，记下第一印象。', 'Use the wait to smell both cups and jot a first impression.'),
      },
      {
        id: 'taste',
        text: L('先尝 A，喝口水，再尝 B，来回几次', 'Taste A, sip water, taste B — go back and forth'),
        detail: L('哪杯更酸亮？更甜？更苦？口感更厚？', 'Which is brighter? Sweeter? More bitter? Heavier?'),
        help: L('先问自己“更喜欢哪杯”，再问“为什么”。', 'Start with “which do I prefer?”, then ask “why?”.'),
        illustration: 'tasting-two-cups',
      },
      {
        id: 'taste-again',
        text: L('再等 5–10 分钟后重新品尝', 'Taste again after another 5–10 minutes'),
        timerSec: 300,
        help: L('咖啡变凉时，酸度和甜感往往更容易察觉。', 'As coffee cools, acidity and sweetness often become easier to notice.'),
      },
      {
        id: 'log',
        text: L('写下你的描述和偏好', 'Write down your words and your preference'),
        help: L('没有错误答案。“A 更亮，B 更圆润，我更喜欢 B”就是很棒的记录。', 'There are no wrong answers. “A is brighter, B is rounder, I prefer B” is an excellent note.'),
      },
    ],
    logFields: ['doseG', 'outG', 'taste', 'rating', 'notes'],
  },
  {
    id: 'exp-sensory-basics-reflect',
    lessonId: 'exp-sensory-basics',
    kind: 'reflect',
    title: L('回顾你的品尝', 'Reflect on your tasting'),
    supportedModes: COG,
    prompts: [
      L('哪个词最能描述两杯之间最大的差别？', 'Which word best captured the biggest difference between the cups?'),
      L('咖啡变凉后，你的偏好有变化吗？', 'Did your preference change as the coffee cooled?'),
      L('下次你想比较哪一个因素？', 'Which ONE comparison would you like to try next?'),
    ],
  },

  // ═════════════════════ exp-dialing-in ═════════════════════
  {
    id: 'exp-dialing-in-explain',
    lessonId: 'exp-dialing-in',
    kind: 'explain',
    title: L('调校是什么', 'What dialing in means'),
    supportedModes: COG,
    cards: [
      {
        heading: L('每包新豆子都要重新找感觉', 'Every new bag needs a little tuning'),
        body: L(
          '豆子、烘焙度、新鲜度、磨豆机和机器都会改变结果。网上的配方只是起点，“调校”就是把它调整成适合你手上这包豆子和你口味的版本。',
          'Beans, roast, freshness, grinder and machine all change the result. A recipe from the internet is a starting point; dialing in adapts it to the coffee in your hands and to your taste.',
        ),
        illustration: 'dial-knob',
      },
      {
        heading: L('三个手段，一个裁判', 'Three levers, one judge'),
        body: L(
          '研磨度（主要影响流速和萃取）、粉量（粉碗里有多少咖啡）、出液量（决定粉液比和浓度）。时间是你观察到的结果，而口味才是最后的裁判。',
          'Grind size (mainly flow and extraction), dose (how much coffee is in the basket) and yield (sets ratio and strength). Time is what you observe; taste is the final judge.',
        ),
        illustration: 'three-levers',
        callout: {
          kind: 'illustrative',
          text: L('像“18 克 → 36 克，25–30 秒”这样的数字是示例起点，不是目标。', 'Numbers like “18 g → 36 g in 25–30 s” are illustrative starting points, not targets.'),
        },
      },
      {
        heading: L('一次只改一件事', 'One change at a time'),
        body: L(
          '如果同时改研磨和粉量，变好了也不知道是哪个起作用。每次只做一个小调整，然后再萃取一杯对比。',
          'Change grind and dose together and you can’t tell which helped. Make one small adjustment, then pull another shot to compare.',
        ),
        illustration: 'one-variable',
        callout: { kind: 'tip', text: L('调整研磨后，有些磨豆机里会残留旧粉；是否需要先磨掉一点，看磨豆机说明。', 'After a grind change some grinders retain old grounds; check your grinder’s guidance on purging a little first.') },
      },
      {
        heading: L('先尝，再看数字', 'Taste first, then numbers'),
        body: L(
          '尖酸、单薄、流得快，常提示萃取不足：可试着调细或多出一点液。苦涩、刺口、发干、流得慢，常提示萃取过度：可试着调粗或少出一点。这些是经验法则，不是保证。',
          'Sour, sharp, thin and fast often hint at under-extraction: try finer or a slightly longer yield. Harsh, bitter, drying and slow often hint at over-extraction: try coarser or a shorter yield. These are rules of thumb, not guarantees.',
        ),
        illustration: 'taste-compass',
        callout: {
          kind: 'myth',
          text: L('误区：“30 秒的浓缩一定是对的。”时间在范围内，并不保证你会喜欢。', 'Myth: “A 30-second shot is always right.” A time in range doesn’t guarantee you’ll enjoy it.'),
        },
      },
      {
        heading: L('知道什么时候停下', 'Know when to stop'),
        body: L(
          '喝着喜欢，就可以停了，把配方记下来。豆子会随着时间变化，过几天再尝一尝、微调一下。研磨刻度只对你自己的磨豆机有意义。',
          'If you enjoy it, you’re done — write it down. Beans change with age, so re-check every few days. Grind numbers only mean something on your own grinder.',
        ),
        illustration: 'journal',
      },
    ],
  },
  {
    id: 'exp-dialing-in-loop',
    lessonId: 'exp-dialing-in',
    kind: 'sequence',
    title: L('排出调校循环', 'Order the dialing-in loop'),
    supportedModes: COG,
    prompt: L('把调校一款新豆子的步骤按正确顺序排好。', 'Put the steps for dialing in a new coffee into the right order.'),
    steps: [
      { id: 'start', text: L('选定起始配方（粉量、目标出液量）', 'Choose a starting recipe (dose, target yield)'), why: L('需要一个参照点，后面才有比较对象。', 'You need a reference point to compare against.') },
      { id: 'pull', text: L('萃取一杯，测量粉量、出液量和时间', 'Pull a shot and measure dose, yield and time'), why: L('有了数据，下一步决定就基于事实而不是猜测。', 'Measurements make the next decision about facts, not guesses.') },
      { id: 'taste', text: L('品尝并描述（酸？苦？薄？平衡？）', 'Taste and describe it (sour? bitter? thin? balanced?)'), why: L('口味决定要不要改、往哪个方向改。', 'Taste tells you whether to change anything — and which way.') },
      { id: 'one-change', text: L('只选一个调整（通常先调研磨）', 'Choose ONE change (usually grind first)'), why: L('只改一个变量，才能知道是什么带来了差别。', 'Changing one variable shows you what caused the difference.') },
      { id: 'repeat', text: L('只带着这一个改变再萃取一杯', 'Pull again with only that change'), why: L('两杯对比，才能看出这个改变的效果。', 'Comparing two shots isolates the effect of that change.') },
      { id: 'log', text: L('记录改了什么、尝到了什么', 'Record what you changed and what you noticed'), why: L('记录让你不会绕圈子，下一包豆子也能参考。', 'A log stops you going in circles and helps with the next bag.') },
    ],
    hint: L('先测量再判断，先判断再改变。', 'Measure before you judge; judge before you change.'),
    misconceptions: [
      { earlierStep: 'taste', laterStep: 'one-change', feedback: L('还没尝就改，就只能靠猜——口味会告诉你往哪个方向调。', 'Changing before tasting is guessing — taste tells you which direction to go.') },
      { earlierStep: 'start', laterStep: 'pull', feedback: L('没有起始配方，这一杯就没有比较的参照。', 'Without a starting recipe, there’s nothing to compare the shot against.') },
      { earlierStep: 'one-change', laterStep: 'repeat', feedback: L('没决定改什么就再萃一杯，第二杯什么也教不了你。', 'Pulling again before deciding on a change means the second shot can’t teach you anything new.') },
    ],
  },
  {
    id: 'exp-dialing-in-diagnose',
    lessonId: 'exp-dialing-in',
    kind: 'diagnose',
    title: L('调校诊断：下一步只改一件事', 'Dial-in diagnosis: one next change'),
    intro: L('以下都是假设场景，数字仅作示意。', 'These are hypothetical scenarios; numbers are illustrative.'),
    supportedModes: COG,
    scenarios: [
      {
        id: 'fast-sour',
        situation: L('新豆子的第一杯：18 克粉，36 克液，只用了 17 秒。', 'First shot with a new bag: 18 g in, 36 g out in just 17 s.'),
        observations: { doseG: 18, outG: 36, timeSec: 17, taste: L('尖酸、单薄', 'Sharp, sour, thin') },
        choices: [
          { id: 'finer', text: L('研磨调细一小格，粉量和出液量不变', 'Grind one small step finer; keep dose and yield'), quality: 'best', feedback: L('流得快常意味着萃取不足，调细能减慢流速、通常会萃取更多。小步调整。', 'Fast flow often means under-extraction; finer grind slows it and usually extracts more. Small steps.') },
          { id: 'longer', text: L('出液量增加到 45 克', 'Increase the yield to 45 g'), quality: 'reasonable', feedback: L('更多水能多萃取一些、缓和酸感，但也会变淡；而“流得快”这个线索用研磨解决更直接。', 'More water can extract more and soften sourness, but the shot gets weaker; grind addresses the fast flow more directly.') },
          { id: 'all', text: L('同时调细、加粉、加出液', 'Grind finer, add dose AND extend yield at once'), quality: 'unhelpful', feedback: L('一次改三样，就算变好了也不知道是哪个起作用。', 'Three changes at once — even if it improves, you won’t know which one helped.') },
          { id: 'tamp', text: L('用更大的力气压粉', 'Tamp much harder'), quality: 'unhelpful', feedback: L('只要压得平整一致，更用力的效果很小，一致性比力气重要。', 'Once you tamp level and consistently, extra force changes little; consistency beats force.') },
        ],
        caveat: CAVEAT,
      },
      {
        id: 'slow-bitter',
        situation: L('18 克粉，36 克液，用了 45 秒。', '18 g in, 36 g out in 45 s.'),
        observations: { doseG: 18, outG: 36, timeSec: 45, taste: L('苦涩、刺口、发干', 'Harsh, bitter, drying') },
        choices: [
          { id: 'coarser', text: L('研磨调粗一小格', 'Grind one small step coarser'), quality: 'best', feedback: L('流得慢加上苦涩发干，常提示萃取过度；调粗能加快流速。', 'Slow flow plus harsh, drying bitterness often suggests over-extraction; coarser speeds it up.') },
          { id: 'shorter', text: L('在 30 克时停止', 'Stop the shot at 30 g'), quality: 'reasonable', feedback: L('少出液可能减少苦涩，但会更浓烈；而“流得慢”这个线索更值得先处理。', 'A shorter yield may cut harshness but makes it more intense; the slow flow is the bigger clue.') },
          { id: 'accept', text: L('不改了，浓缩本来就是苦的', 'Leave it — espresso is supposed to be bitter'), quality: 'unhelpful', feedback: L('适度的苦很正常，但刺口发干的苦往往可以改善——如果你不喜欢，就值得调整。', 'Some bitterness is normal, but harsh and drying is often fixable — worth adjusting if you don’t enjoy it.') },
        ],
        caveat: CAVEAT,
      },
      {
        id: 'in-range-sour',
        situation: L('18 克粉，36 克液，28 秒——“教科书时间”。但你觉得有点酸，不太喜欢。', '18 g in, 36 g out in 28 s — a “textbook” time. But it tastes a bit sour and you don’t enjoy it.'),
        observations: { doseG: 18, outG: 36, timeSec: 28, taste: L('偏酸，不太喜欢', 'A bit sour; not enjoyable') },
        choices: [
          { id: 'trust-taste', text: L('相信自己的口味：试着稍微调细，或把出液量加到约 40 克（二选一）', 'Trust your taste: try slightly finer OR a longer yield of about 40 g (pick one)'), quality: 'best', feedback: L('时间在范围内不代表你会喜欢，口味才是裁判。只选一个调整。', 'A time in range doesn’t mean you’ll like it — taste is the judge. Pick just one change.') },
          { id: 'in-range', text: L('时间在范围内，所以就是对的', 'It’s in range, so it’s correct'), quality: 'unhelpful', feedback: L('时间是参考点，不是品质证明。', 'Times are reference points, not proof of quality.') },
          { id: 'switch-beans', text: L('马上换成深烘豆', 'Switch to a darker roast right away'), quality: 'reasonable', feedback: L('深烘也许更合你的口味，但这等于一次改了所有东西——先试试小的配方调整。', 'A darker roast might suit you, but it changes everything at once — try small recipe tweaks first.') },
        ],
        caveat: CAVEAT,
      },
    ],
  },
  {
    id: 'exp-dialing-in-session',
    lessonId: 'exp-dialing-in',
    kind: 'guided-practice',
    title: L('三杯调校练习', 'Three-shot dial-in session'),
    intro: L('用真实的机器萃取三杯，每次只改一个变量。所有完成状态都由你自己确认（自我报告）。', 'Pull three real shots, changing one variable each time. Completion is self-reported.'),
    supportedModes: REAL,
    safetyNotes: [SAFE_STEAM, SAFE_GRINDER],
    equipment: ['espresso-machine', 'grinder', 'portafilter', 'basket', 'tamper', 'scale', 'timer', 'espresso-cup', 'towel'],
    recipe: {
      doseG: 18,
      outG: 36,
      ratioLabel: L('1:2（示例）', '1:2 (illustrative)'),
      note: L(
        '示例起点。如果你的粉碗标称粉量不同，就用粉碗的数值；时间范围只是观察参考，不是及格线。',
        'Illustrative start. If your basket is rated for a different dose, use that. The time range is an observation guide, not a pass line.',
      ),
      targetTimeSec: [25, 35],
    },
    steps: [
      {
        id: 'ready',
        text: L('按说明书充分预热机器，准备好秤、杯子和抹布', 'Warm the machine fully per its manual; set out scale, cup and towel'),
        safety: SAFE_STEAM,
        help: L('不同机器预热时间差别很大，说明书会告诉你需要多久。', 'Warm-up time varies widely between machines — your manual says how long.'),
      },
      {
        id: 'shot-1',
        text: L('第 1 杯：按起始配方萃取，记下粉量、出液量和时间', 'Shot 1: pull the starting recipe; record dose, yield and time'),
        timerSec: 30,
        help: L('不用追求完美，这一杯是你的参照。', 'Don’t chase perfection — this shot is your reference.'),
        illustration: 'espresso-on-scale',
      },
      {
        id: 'taste-1',
        text: L('品尝并只选一个调整', 'Taste and choose ONE change'),
        detail: L('又酸又薄且很快 → 调细；苦涩刺口且很慢 → 调粗；好喝但太浓 → 多出一点液。', 'Sour/thin and fast → finer; harsh/bitter and slow → coarser; tasty but too intense → slightly longer yield.'),
        help: L('拿不准时，优先调研磨，一小格就好。', 'When unsure, adjust grind first — one small step.'),
      },
      {
        id: 'shot-2',
        text: L('第 2 杯：只带着这一个改变再萃取', 'Shot 2: pull again with only that change'),
        timerSec: 30,
        safety: SAFE_GRINDER,
        help: L('调整研磨后，看磨豆机说明是否建议先磨掉少量残粉。', 'After a grind change, check whether your grinder suggests purging a little old coffee first.'),
      },
      {
        id: 'compare',
        text: L('对比两杯：更好、更差，还是只是不同？', 'Compare: better, worse, or just different?'),
        help: L('“只是不同”也是有用的信息，说明这个变量影响了风格。', '“Just different” is useful too — that variable changed the style.'),
      },
      {
        id: 'shot-3',
        text: L('第 3 杯：沿同方向再调一点、退回，或者已经喜欢就停下', 'Shot 3: go further, go back, or stop if you already enjoy it'),
        timerSec: 30,
        help: L('喝着喜欢就是完成了，把这个配方记下来。', 'If you enjoy it, you’re done — record the recipe.'),
      },
      {
        id: 'clean',
        text: L('敲掉粉饼、冲洗粉碗，按说明书冲洗并擦拭冲煮头', 'Knock out pucks, rinse baskets, and flush/wipe the group as your manual describes'),
        safety: L('冲煮头和手柄很烫；手远离热水。', 'The group head and portafilter are hot; keep hands clear of the water.'),
        help: L('更深入的清洁（如反冲洗）只按厂家说明进行。', 'Deeper cleaning such as backflushing: manufacturer’s instructions only.'),
      },
    ],
    logFields: ['doseG', 'outG', 'timeSec', 'grind', 'taste', 'rating', 'notes'],
  },
  {
    id: 'exp-dialing-in-reflect',
    lessonId: 'exp-dialing-in',
    kind: 'reflect',
    title: L('回顾你的调校', 'Reflect on your session'),
    supportedModes: COG,
    prompts: [
      L('哪一个改变对口味影响最大？', 'Which single change made the biggest difference to taste?'),
      L('有没有哪次你想同时改两样？结果如何？', 'Was there a moment you wanted to change two things at once? What happened?'),
      L('下次用这包豆子，你会从哪个配方开始？', 'Next time with this coffee, which recipe will you start from?'),
    ],
  },

  // ═════════════════════ exp-origin-processing ═════════════════════
  {
    id: 'exp-origin-processing-explain',
    lessonId: 'exp-origin-processing',
    kind: 'explain',
    title: L('一颗咖啡豆的来历', 'Where a coffee bean comes from'),
    supportedModes: COG,
    cards: [
      {
        heading: L('果实里的种子', 'A seed inside a cherry'),
        body: L(
          '咖啡豆其实是咖啡树果实（咖啡樱桃）里的种子，一颗果实里通常有两粒，平面相对。',
          'Coffee beans are the seeds of the coffee cherry, usually two per fruit, flat sides facing each other.',
        ),
        illustration: 'coffee-cherry',
        callout: { kind: 'tip', text: L('有时一颗果实里只长出一粒圆形的种子，叫“圆豆”（peaberry）。', 'Sometimes a cherry grows a single round seed — a “peaberry”.') },
      },
      {
        heading: L('两大主要品种', 'Two main species'),
        body: L(
          '阿拉比卡（Coffea arabica）原产于埃塞俄比亚高地，大多数精品咖啡都是它，常种在较高海拔。罗布斯塔（Coffea canephora）更耐病、通常咖啡因更多、风味更厚重偏苦，在越南、巴西等地大量种植。',
          'Arabica (Coffea arabica) originated in the Ethiopian highlands and makes up most specialty coffee, often grown at higher altitudes. Robusta (Coffea canephora) is hardier, usually higher in caffeine and heavier or more bitter, and widely grown in places such as Vietnam and Brazil.',
        ),
        illustration: 'species-compare',
        callout: {
          kind: 'myth',
          text: L('误区：“罗布斯塔一定不好。”优质罗布斯塔确实存在，它也是越南咖啡和一些意式拼配的重要组成。', 'Myth: “Robusta is always bad.” Fine robustas exist, and it is central to Vietnamese coffee and many espresso blends.'),
        },
      },
      {
        heading: L('咖啡带与风土', 'The coffee belt and terroir'),
        body: L(
          '咖啡主要种在南北回归线之间的“咖啡带”。海拔、降雨、土壤、品种和农户的种植方式，都会影响最终风味。',
          'Coffee grows mostly in the “coffee belt” between the tropics. Altitude, rainfall, soil, variety and the farmer’s practices all shape the final flavour.',
        ),
        illustration: 'map-coffee-belt',
        callout: {
          kind: 'culture',
          text: L(
            '中国的咖啡大多产自云南。一般认为咖啡在 1900 年前后由传教士带到大理宾川的朱苦拉村（不同资料给出的年份从 1892 到 1904 不等）。',
            'Most of China’s coffee grows in Yunnan. Coffee is generally said to have been brought by missionaries to Zhukula village in Binchuan around 1900 (sources give dates from 1892 to 1904).',
          ),
        },
      },
      {
        heading: L('处理法：怎样去掉果肉', 'Processing: removing the fruit'),
        body: L(
          '水洗：先去掉果皮果肉再干燥，风味常较干净、酸度清晰。日晒：整颗果实晒干，常较果香、醇厚。蜜处理：保留部分黏液再干燥，常介于两者之间。',
          'Washed: fruit removed before drying — often clean with clear acidity. Natural: dried as whole cherries — often fruitier and heavier. Honey: some sticky fruit left on while drying — often in between.',
        ),
        illustration: 'processing-methods',
        callout: {
          kind: 'illustrative',
          text: L('这些只是倾向。农户的技术、品种和烘焙同样重要。', 'These are tendencies only. Producer skill, variety and roast matter just as much.'),
        },
      },
      {
        heading: L('读懂豆袋标签', 'Reading a bag'),
        body: L(
          '常见信息有：国家和产区、庄园或合作社、品种、处理法、海拔、烘焙日期。对冲煮来说，烘焙日期往往比“保质期”更有用。',
          'Common details: country and region, farm or cooperative, variety, process, altitude and roast date. For brewing, the roast date usually tells you more than a best-before date.',
        ),
        illustration: 'coffee-bag-label',
      },
    ],
  },
  {
    id: 'exp-origin-processing-sequence',
    lessonId: 'exp-origin-processing',
    kind: 'sequence',
    title: L('从果实到杯子', 'From cherry to cup'),
    supportedModes: COG,
    prompt: L('把咖啡从树上到杯中的主要环节按顺序排列。', 'Order the main steps that take coffee from tree to cup.'),
    steps: [
      { id: 'harvest', text: L('采收成熟的咖啡果', 'Harvest ripe coffee cherries'), why: L('成熟度直接影响甜感和风味。', 'Ripeness strongly affects sweetness and flavour.') },
      { id: 'process', text: L('处理：去除果肉（水洗/日晒/蜜处理）', 'Process: remove the fruit (washed / natural / honey)'), why: L('采收后要尽快处理，避免果实变质。', 'Cherries must be processed soon after picking before they spoil.') },
      { id: 'dry', text: L('干燥到稳定的含水率', 'Dry to a stable moisture level'), why: L('干燥后才能安全储存和运输。', 'Drying makes the coffee stable for storage and shipping.') },
      { id: 'mill', text: L('脱壳、分级，得到生豆', 'Hull and sort into green coffee'), why: L('去掉干燥后的外层（羊皮纸层或果壳），挑出瑕疵豆。', 'Removes the dried outer layers (parchment or husk) and sorts out defects.') },
      { id: 'ship', text: L('生豆运往世界各地', 'Ship green coffee around the world'), why: L('生豆比熟豆稳定得多，适合长途运输。', 'Green coffee keeps far better than roasted coffee for long journeys.') },
      { id: 'roast', text: L('烘焙', 'Roast'), why: L('烘焙让生豆产生香气，通常在消费国进行。', 'Roasting creates aroma, usually in the consuming country.') },
      { id: 'brew', text: L('养豆、研磨、冲煮', 'Rest, grind and brew'), why: L('研磨后香气散失很快，所以冲煮前再磨。', 'Ground coffee loses aroma quickly, so grind just before brewing.') },
    ],
    hint: L('烘焙发生在离家更近的地方。', 'Roasting happens closer to the drinker.'),
    misconceptions: [
      { earlierStep: 'process', laterStep: 'roast', feedback: L('处理法在产地、采收后立刻进行；烘焙的是已经干燥好的生豆。', 'Processing happens at origin right after harvest; roasting is done to dried green coffee.') },
      { earlierStep: 'dry', laterStep: 'mill', feedback: L('脱壳去掉的是干燥后的外层，所以要先干燥。', 'Hulling removes the dried outer layers, so drying comes first.') },
    ],
  },
  {
    id: 'exp-origin-processing-quiz',
    lessonId: 'exp-origin-processing',
    kind: 'quiz',
    title: L('产地与处理法小测', 'Origin & processing check'),
    supportedModes: COG,
    questions: [
      {
        id: 'exp-origin-q1',
        prompt: L('“日晒处理（natural）”指的是什么？', 'What does “natural process” mean?'),
        options: [
          { id: 'a', text: L('咖啡豆在整颗果实里一起晒干', 'The beans are dried inside the whole cherry'), correct: true, feedback: L('对，果肉在干燥时包着种子。', 'Right — the fruit surrounds the seed while it dries.') },
          { id: 'b', text: L('有机认证的咖啡', 'Certified organic coffee'), correct: false, feedback: L('“natural”说的是干燥方式，有机是另一种独立认证。', '“Natural” describes the drying method; organic is a separate certification.') },
          { id: 'c', text: L('没有烘焙过的咖啡', 'Coffee that was never roasted'), correct: false, feedback: L('处理法发生在烘焙之前，所有咖啡最后都要烘焙。', 'Processing happens before roasting; all brewed coffee is roasted.') },
        ],
        explanation: L('日晒 = 带着果实一起干燥。', 'Natural = dried with the fruit on.'),
      },
      {
        id: 'exp-origin-q2',
        prompt: L('关于阿拉比卡与罗布斯塔，哪句话最准确？', 'Which statement about arabica and robusta is most accurate?'),
        options: [
          { id: 'a', text: L('罗布斯塔通常咖啡因更多、更厚重，但两者都有好坏之分', 'Robusta usually has more caffeine and a heavier profile, but quality exists in both'), correct: true, feedback: L('对，品质取决于种植和处理，不只看品种。', 'Yes — quality depends on growing and processing, not species alone.') },
          { id: 'b', text: L('阿拉比卡一定更好喝', 'Arabica always tastes better'), correct: false, feedback: L('喜好和品质都因咖啡而异，很多传统就偏爱罗布斯塔。', 'Preference and quality vary; many traditions favour robusta.') },
          { id: 'c', text: L('它们是同一种植物，只是烘焙不同', 'They’re the same plant roasted differently'), correct: false, feedback: L('它们是不同的物种，与烘焙无关。', 'They are different species, regardless of roast.') },
        ],
        explanation: L('品种给出倾向，品质要看整个链条。', 'Species sets tendencies; quality depends on the whole chain.'),
      },
      {
        id: 'exp-origin-q3',
        prompt: L('豆袋上写着“埃塞俄比亚 水洗”。你能预测什么？', 'A bag says “Ethiopia, washed”. What can you predict?'),
        options: [
          { id: 'a', text: L('一些倾向（常见干净、明亮），但不是确定的味道', 'Some tendencies (often clean and bright) but not the exact taste'), correct: true, feedback: L('对。标签是线索，冲煮和口味仍会改变结果。', 'Right. Labels are clues; brewing and taste still shape the result.') },
          { id: 'b', text: L('它一定是柠檬味', 'It will definitely taste like lemon'), correct: false, feedback: L('处理法和产地只给出倾向，无法保证具体风味。', 'Origin and process give tendencies, never a guaranteed flavour.') },
          { id: 'c', text: L('什么都预测不了', 'Nothing at all'), correct: false, feedback: L('标签确实有用，只是不能当作保证。', 'Labels are useful — just not a guarantee.') },
        ],
        explanation: L('把标签当作线索，而不是答案。', 'Treat labels as clues, not answers.'),
      },
      {
        id: 'exp-origin-q4',
        prompt: L('冲煮时，豆袋上哪个日期最有参考价值？', 'For brewing, which date on the bag is most useful?'),
        options: [
          { id: 'a', text: L('烘焙日期', 'The roast date'), correct: true, feedback: L('对，它告诉你豆子新鲜度和是否需要再养几天。', 'Yes — it tells you freshness and whether it needs a few more days of rest.') },
          { id: 'b', text: L('只看采收年份', 'Only the harvest year'), correct: false, feedback: L('采收年份对生豆很重要，但对你的冲煮来说，烘焙日期信息更多。', 'Harvest year matters for green coffee, but for your brewing the roast date tells you more.') },
          { id: 'c', text: L('保质期', 'The best-before date'), correct: false, feedback: L('保质期往往很长，说明不了风味还剩多少。', 'Best-before dates are often far off and say little about remaining flavour.') },
        ],
        explanation: L('关注烘焙日期，买几周内能喝完的量。', 'Watch the roast date and buy what you’ll use within a few weeks.'),
      },
    ],
  },
  {
    id: 'exp-origin-processing-reflect',
    lessonId: 'exp-origin-processing',
    kind: 'reflect',
    title: L('看看你的豆袋', 'Look at your own bag'),
    supportedModes: COG,
    prompts: [
      L('你现在的咖啡豆来自哪里？是什么处理法？', 'Where does your current coffee come from, and how was it processed?'),
      L('标签上的信息和你喝到的感觉一致吗？', 'Does the label match what you taste?'),
      L('下次买豆子，你想试试哪个产地或处理法？', 'Which origin or process would you like to try next?'),
    ],
  },

  // ═════════════════════ exp-roast-levels ═════════════════════
  {
    id: 'exp-roast-levels-explain',
    lessonId: 'exp-roast-levels',
    kind: 'explain',
    title: L('从绿色到棕色', 'From green to brown'),
    supportedModes: COG,
    cards: [
      {
        heading: L('烘焙在做什么', 'What roasting does'),
        body: L(
          '生豆坚硬、带青草味。烘焙时水分蒸发，褐变反应产生数百种香气物质；豆子膨胀时会发出“爆裂声”（一爆）。',
          'Green coffee is hard and grassy. Roasting drives off moisture and browning reactions create hundreds of aroma compounds; beans audibly crack as they expand (“first crack”).',
        ),
        illustration: 'roast-spectrum',
      },
      {
        heading: L('浅、中、深的倾向', 'Light, medium, dark — tendencies'),
        body: L(
          '浅烘：更多产地特色、酸度明亮，往往需要更细的研磨或更热的水。中烘：平衡，焦糖般的甜感更多。深烘：烘烤感、苦甜、醇厚、酸度低，表面可能出油。',
          'Light: more origin character and brighter acidity; often needs finer grind or hotter water. Medium: balance and more caramel sweetness. Dark: roasty, bittersweet, heavier, lower acidity, sometimes oily.',
        ),
        illustration: 'roast-levels-three',
        callout: {
          kind: 'illustrative',
          text: L('这是倾向不是规则——每家烘焙商的“中烘”都不一样。', 'Tendencies, not rules — every roaster’s “medium” is different.'),
        },
      },
      {
        heading: L('深烘咖啡因更多？', 'Does dark roast have more caffeine?'),
        body: L(
          '烘焙过程中咖啡因变化不大，按重量计不同烘焙度的差别很小。你用了多少咖啡，影响要大得多。',
          'Caffeine changes little during roasting; per gram, differences between roast levels are small. How much coffee you use matters far more.',
        ),
        illustration: 'caffeine-myth',
        callout: {
          kind: 'myth',
          text: L('误区：“味道浓烈 = 咖啡因多。”浓烈的口感来自烘焙风味，不是咖啡因。', 'Myth: “Bold taste = more caffeine.” Boldness comes from roast flavour, not caffeine.'),
        },
      },
      {
        heading: L('新鲜度、养豆与储存', 'Freshness, resting and storage'),
        body: L(
          '刚烘好的豆子会持续释放二氧化碳（就是闷蒸时的气泡），很多人会等几天再喝，做浓缩常等更久；开封后风味会在几周内逐渐减弱。用密封容器，放在阴凉避光处，远离热源和湿气，买几周内能喝完的量。',
          'Fresh roasts release CO₂ for days (the bubbles in a bloom); many people wait a few days before brewing, often longer for espresso, and flavour fades over the weeks after opening. Store airtight, cool and dark, away from heat and moisture, and buy what you’ll use in a few weeks.',
        ),
        illustration: 'storage-jar',
        callout: {
          kind: 'tip',
          text: L('有人把豆子分装密封后冷冻保存；取出后等回到室温再开封，避免反复解冻产生冷凝水。', 'Some people freeze beans in sealed portions; let a portion reach room temperature before opening and avoid repeated thawing, which causes condensation.'),
        },
      },
      {
        heading: L('文化里的烘焙偏好', 'Roast preferences across cultures'),
        body: L(
          '北欧很多咖啡馆偏爱浅烘，意大利南部传统上偏深，而埃塞俄比亚的咖啡仪式会在客人面前现场烘豆。没有“正确”的烘焙度。',
          'Many Nordic cafés favour light roasts, southern Italy traditionally roasts darker, and the Ethiopian coffee ceremony roasts beans in front of guests. There is no “correct” roast.',
        ),
        illustration: 'world-roasts',
        callout: { kind: 'culture', text: L('在 Drink Atlas 里看看“埃塞俄比亚咖啡”。', 'See “Ethiopian coffee” in the Drink Atlas.') },
      },
    ],
  },
  {
    id: 'exp-roast-levels-quiz',
    lessonId: 'exp-roast-levels',
    kind: 'quiz',
    title: L('烘焙小测', 'Roast check'),
    supportedModes: COG,
    questions: [
      {
        id: 'exp-roast-q1',
        prompt: L('同样重量的深烘和浅烘豆，咖啡因含量如何？', 'Gram for gram, how does caffeine compare between dark and light roasts?'),
        options: [
          { id: 'a', text: L('差别很小', 'The difference is small'), correct: true, feedback: L('对，用了多少咖啡比烘焙度影响大得多。', 'Right — how much coffee you use matters far more.') },
          { id: 'b', text: L('深烘多得多', 'Dark roast has much more'), correct: false, feedback: L('浓烈的口感来自烘焙风味，不是咖啡因。', 'Bold taste comes from roast flavour, not caffeine.') },
          { id: 'c', text: L('深烘完全不含咖啡因', 'Dark roast has no caffeine'), correct: false, feedback: L('深烘依然含有咖啡因；无咖啡因咖啡需要专门的脱因工艺。', 'Dark roasts still contain caffeine; decaf needs a dedicated decaffeination process.') },
        ],
        explanation: L('咖啡因在烘焙中相当稳定。', 'Caffeine is fairly stable through roasting.'),
      },
      {
        id: 'exp-roast-q2',
        prompt: L('豆子表面油亮，通常说明什么？', 'Shiny, oily beans usually indicate what?'),
        options: [
          { id: 'a', text: L('通常是较深的烘焙，或者烘好已有一段时间', 'Usually a darker roast, or beans that are some time past roasting'), correct: true, feedback: L('对，油脂会随烘焙加深和时间推移迁移到表面。', 'Yes — oils migrate to the surface with darker roasting and with time.') },
          { id: 'b', text: L('一定是最新鲜的', 'They are definitely the freshest'), correct: false, feedback: L('油亮和新鲜没有直接关系，浅烘新鲜豆通常是干的。', 'Oiliness isn’t a freshness sign; fresh light roasts are usually dry.') },
          { id: 'c', text: L('一定是劣质豆', 'They are definitely low quality'), correct: false, feedback: L('很多优质深烘豆都会出油，这不代表品质差。', 'Many good dark roasts are oily; it isn’t a quality verdict.') },
        ],
        explanation: L('油亮更多和烘焙度、时间有关。', 'Oil relates mostly to roast level and age.'),
      },
      {
        id: 'exp-roast-q3',
        prompt: L('开封后的咖啡豆，怎样储存最合适？', 'What’s the best way to store an opened bag?'),
        options: [
          { id: 'a', text: L('密封容器，放在阴凉避光的柜子里', 'An airtight container in a cool, dark cupboard'), correct: true, feedback: L('对，空气、热、光和湿气是风味的敌人。', 'Yes — air, heat, light and moisture are flavour’s enemies.') },
          { id: 'b', text: L('敞口放在咖啡机旁边的碗里', 'An open bowl next to the warm machine'), correct: false, feedback: L('热和空气会让风味很快变得平淡。', 'Heat and air make flavour fade quickly.') },
          { id: 'c', text: L('放在冰箱门上，每天拿进拿出', 'In the fridge door, taken out every day'), correct: false, feedback: L('反复冷热会产生冷凝水，冰箱里的气味也会被吸收。', 'Repeated temperature swings cause condensation, and beans absorb fridge odours.') },
        ],
        explanation: L('密封、阴凉、避光、尽快喝完。', 'Airtight, cool, dark — and drink it soon.'),
      },
    ],
  },
  {
    id: 'exp-roast-levels-diagnose',
    lessonId: 'exp-roast-levels',
    kind: 'diagnose',
    title: L('换了烘焙度之后', 'After switching roast levels'),
    intro: L('假设场景，数字仅作示意。', 'Hypothetical scenarios; numbers are illustrative.'),
    supportedModes: COG,
    scenarios: [
      {
        id: 'light-sour',
        situation: L('你从中烘换成浅烘，手冲配方没变（15 克 : 250 克，同样研磨）。', 'You switched from a medium to a light roast and kept your pour-over recipe (15 g : 250 g, same grind).'),
        observations: { doseG: 15, outG: 250, taste: L('偏酸、单薄', 'Sour and thin') },
        choices: [
          { id: 'finer-hotter', text: L('研磨调细一点，或者用更热的水（二选一）', 'Grind a bit finer OR use hotter water (pick one)'), quality: 'best', feedback: L('浅烘往往更难萃取，向“多萃取一点”的方向迈一小步是合理的。', 'Light roasts are often harder to extract; a small step toward more extraction makes sense.') },
          { id: 'more-coffee', text: L('改用 22 克咖啡', 'Use 22 g of coffee instead'), quality: 'reasonable', feedback: L('多放粉会让咖啡更浓、可能不那么薄，但不一定改善酸感，而且变化幅度很大。', 'More coffee makes it stronger and maybe less thin, but may not fix sourness — and it’s a big jump.') },
          { id: 'give-up', text: L('结论：浅烘就是不好喝', 'Conclude that light roasts just taste bad'), quality: 'unhelpful', feedback: L('它可能只是需要不同的配方。最后不喜欢也没关系，但先试一下。', 'It may just need a different recipe. Not liking it in the end is fine — but try first.') },
        ],
        caveat: CAVEAT,
      },
      {
        id: 'dark-harsh',
        situation: L('一款深烘豆用你平常的浓缩配方（18 克 → 36 克）。', 'A dark roast at your usual espresso recipe (18 g → 36 g).'),
        observations: { doseG: 18, outG: 36, timeSec: 30, taste: L('刺口、焦苦、有灰烬感', 'Harsh, burnt, ashy') },
        choices: [
          { id: 'coarser', text: L('研磨稍微调粗', 'Grind slightly coarser'), quality: 'best', feedback: L('深烘更容易萃取，稍微减少萃取常能缓和刺口的苦。', 'Dark roasts extract easily; slightly less extraction often softens harshness.') },
          { id: 'cooler', text: L('如果机器可以调温，稍微降低水温', 'Lower the brew temperature a little, if your machine allows'), quality: 'reasonable', feedback: L('也是减少萃取的方向；不过不是所有机器都能调温，具体看说明书。', 'Also a step toward less extraction — but not every machine can adjust it; check your manual.') },
          { id: 'longer', text: L('萃取到 54 克', 'Run the shot to 54 g'), quality: 'unhelpful', feedback: L('让更多水穿过粉饼，往往会带出更多刺口的成分。', 'Pushing more water through tends to pull out more harsh compounds.') },
        ],
        caveat: CAVEAT,
      },
    ],
  },
  {
    id: 'exp-roast-levels-reflect',
    lessonId: 'exp-roast-levels',
    kind: 'reflect',
    title: L('你的烘焙偏好', 'Your roast preference'),
    supportedModes: COG,
    prompts: [
      L('你目前喝的豆子是什么烘焙度？标签和你的感受一致吗？', 'What roast level is your current coffee? Does the label match your impression?'),
      L('你的豆子是怎么储存的？有什么想改进的？', 'How are you storing your beans? Anything to improve?'),
      L('你想试试另一种烘焙度吗？为什么？', 'Would you like to try a different roast level? Why?'),
    ],
  },

  // ═════════════════════ exp-water ═════════════════════
  {
    id: 'exp-water-explain',
    lessonId: 'exp-water',
    kind: 'explain',
    title: L('水为什么重要', 'Why water matters'),
    supportedModes: COG,
    cards: [
      {
        heading: L('咖啡几乎全是水', 'Coffee is almost all water'),
        body: L(
          '一杯滤泡咖啡大约 98% 以上是水。水本身的味道和成分，会直接影响你喝到的东西。',
          'A cup of brewed coffee is roughly 98% or more water. The taste and makeup of that water directly shape what you drink.',
        ),
        illustration: 'water-drop',
      },
      {
        heading: L('矿物质在“干活”', 'Minerals do work'),
        body: L(
          '钙和镁能帮助把风味物质萃取出来；碳酸氢盐（碱度）会缓冲酸度——太多会让咖啡平淡甚至有白垩感，太少则可能显得尖酸。',
          'Calcium and magnesium help pull flavour out of the coffee; bicarbonate (alkalinity) buffers acidity — too much can taste flat or chalky, too little can taste sharp.',
        ),
        illustration: 'minerals',
        callout: { kind: 'illustrative', text: L('这是对复杂化学的简化说明。', 'This is a simplified picture of complex chemistry.') },
      },
      {
        heading: L('一个参考点，不是硬规定', 'A reference, not a rule'),
        body: L(
          'SCA 的冲煮用水标准以适中的矿物质为目标：总溶解固体（TDS）约 150 mg/L（可接受范围约 75–250），pH 接近中性，不含余氯。你不需要实验室：无异味、喝起来好喝的过滤水就是不错的起点。',
          'SCA’s brewing-water standard aims for moderate minerals: about 150 mg/L total dissolved solids (acceptable roughly 75–250), near-neutral pH and no chlorine. You don’t need a lab: odourless, good-tasting filtered water is a solid start.',
        ),
        illustration: 'water-target',
        callout: { kind: 'tip', text: L('便宜的 TDS 水质笔能帮你比较不同的水，但它分辨不出具体是哪些矿物质。', 'A cheap TDS pen helps compare waters, but it can’t tell you which minerals are present.') },
      },
      {
        heading: L('机器也在乎水', 'Machines care too'),
        body: L(
          '硬水会在锅炉和管路里结垢，可能损坏机器；而非常纯的水（蒸馏水、纯 RO 水）对某些机器也不合适，可能有腐蚀风险或让水位传感器失灵。请使用厂家推荐的水，并按说明书除垢。',
          'Hard water leaves scale in boilers and pipes that can damage machines; very pure water (distilled or straight RO) doesn’t suit some machines either — it can be corrosive or confuse level sensors. Use the water your manufacturer recommends and descale per its instructions.',
        ),
        illustration: 'machine-scale',
        callout: { kind: 'safety', text: L('不要自行拆机除垢；除垢剂和方法按厂家说明。', 'Don’t open a machine to descale it; use the descaler and method your manufacturer specifies.') },
      },
      {
        heading: L('水温只是变量之一', 'Temperature is one lever among several'),
        body: L(
          '热水萃取得更快。一项 2020 年的研究发现，在浓度和萃取率相同的情况下，87–93 °C 的滴滤咖啡在感官上差别很小——水温主要改变的是萃取速度。',
          'Hotter water extracts faster. A 2020 study found that at equal strength and extraction, drip coffee brewed at 87–93 °C differed little in sensory profile — temperature mainly changes the speed of extraction.',
        ),
        illustration: 'thermometer',
        callout: { kind: 'illustrative', text: L('该研究只测试了较窄的温度范围和滴滤方式。', 'That study covered only a narrow temperature range and drip brewing.') },
      },
    ],
  },
  {
    id: 'exp-water-quiz',
    lessonId: 'exp-water',
    kind: 'quiz',
    title: L('水质小测', 'Water check'),
    supportedModes: COG,
    questions: [
      {
        id: 'exp-water-q1',
        prompt: L('为什么蒸馏水可能不太适合冲咖啡？', 'Why might distilled water be a poor choice for coffee?'),
        options: [
          { id: 'a', text: L('缺少帮助萃取的矿物质，咖啡可能平淡；有些机器也不建议使用', 'It lacks minerals that help extraction, so coffee can taste flat; some machines advise against it'), correct: true, feedback: L('对，适量的矿物质对风味和部分机器都有好处。', 'Right — some minerals help both flavour and certain machines.') },
          { id: 'b', text: L('蒸馏水含有大量余氯', 'It contains lots of chlorine'), correct: false, feedback: L('蒸馏过程会去除余氯，问题在于矿物质太少。', 'Distillation removes chlorine; the issue is too few minerals.') },
          { id: 'c', text: L('蒸馏水的沸点高得多', 'It boils at a much higher temperature'), correct: false, feedback: L('蒸馏水的沸点和普通饮用水几乎一样。', 'Its boiling point is essentially the same as ordinary drinking water.') },
        ],
        explanation: L('水需要“恰到好处”的矿物质。', 'Water needs a “just right” amount of minerals.'),
      },
      {
        id: 'exp-water-q2',
        prompt: L('水壶内壁出现白色硬垢，说明什么？', 'Your kettle has white, crusty buildup inside. What does that suggest?'),
        options: [
          { id: 'a', text: L('水比较硬，矿物质沉积成水垢', 'Hard water — minerals deposited as scale'), correct: true, feedback: L('对。咖啡机同样会结垢，请按说明书除垢，并考虑合适的滤水方案。', 'Yes. Espresso machines scale too — descale per the manual and consider suitable filtration.') },
          { id: 'b', text: L('是咖啡油脂残留', 'Coffee oil residue'), correct: false, feedback: L('咖啡油脂通常是棕色、油腻的，水垢是白色、坚硬的。', 'Coffee oil is usually brown and greasy; scale is white and hard.') },
          { id: 'c', text: L('水太软了', 'The water is too soft'), correct: false, feedback: L('软水的矿物质少，不容易结这样的垢。', 'Soft water has few minerals and doesn’t leave this kind of crust.') },
        ],
        explanation: L('白色硬垢 = 硬水的信号。', 'White crust = a hard-water signal.'),
      },
      {
        id: 'exp-water-q3',
        prompt: L('SCA 的 TDS 目标约 150 mg/L，应该怎么理解？', 'How should you read SCA’s target of about 150 mg/L TDS?'),
        options: [
          { id: 'a', text: L('一个好的冲煮用水参考点，范围内很多水都可以', 'A useful reference for brewing water; many waters in the range work well'), correct: true, feedback: L('对，它是参考点，最终还是要用口味判断。', 'Right — a reference point; taste still has the final say.') },
          { id: 'b', text: L('超出范围的水冲出来的咖啡不能喝', 'Water outside it makes undrinkable coffee'), correct: false, feedback: L('范围外的水也能冲咖啡，只是风味可能不同，也可能更易结垢。', 'Water outside it still brews coffee — flavour may differ, and scale may be more likely.') },
          { id: 'c', text: L('TDS 越高越好', 'Higher TDS is always better'), correct: false, feedback: L('太多矿物质会让咖啡平淡，也会让机器结垢。', 'Too many minerals can flatten flavour and scale machines.') },
        ],
        explanation: L('标准是起点，不是考试。', 'Standards are a starting point, not an exam.'),
      },
    ],
  },
  {
    id: 'exp-water-taste-test',
    lessonId: 'exp-water',
    kind: 'guided-practice',
    title: L('双水对比品尝', 'Two-water taste test'),
    intro: L('用两种水冲两杯一样的手冲，看看你能不能喝出差别。完成情况由你自己确认（自我报告）。', 'Brew the same pour-over with two different waters and see whether you can taste a difference. Completion is self-reported.'),
    supportedModes: REAL,
    safetyNotes: [SAFE_HOT],
    equipment: ['dripper', 'paper-filter', 'gooseneck-kettle', 'grinder', 'scale', 'timer', 'cup'],
    recipe: {
      doseG: 15,
      outG: 250,
      ratioLabel: L('每杯约 1:16.7', 'About 1:16.7 per cup'),
      note: L('示例数值；用你平时的配方也行，两杯保持一致即可。', 'Illustrative numbers; your usual recipe works too — just keep both cups the same.'),
    },
    steps: [
      {
        id: 'choose-waters',
        text: L('选两种饮用水', 'Pick two drinking waters'),
        detail: L('例如：过滤后的自来水和一瓶矿泉水。有 TDS 笔的话记下读数。', 'For example, filtered tap water and a bottled spring water. If you have a TDS pen, note each reading.'),
        help: L('除非好奇，否则不必用蒸馏水——差别会非常明显。', 'Skip distilled water unless you’re curious — the difference can be dramatic.'),
      },
      {
        id: 'heat',
        text: L('分别加热两种水（中间冲洗水壶）', 'Heat each water separately (rinse the kettle in between)'),
        safety: L('热水会烫伤：壶放稳，倒掉热水时小心。', 'Hot water scalds: keep the kettle stable and pour out carefully.'),
        help: L('只有一个水壶也没关系，第一杯冲好后保温或盖上即可。', 'One kettle is fine — cover the first cup to keep it warm while you heat the second water.'),
      },
      {
        id: 'brew',
        text: L('用同样的豆子、研磨和配方冲两杯', 'Brew both cups with the same coffee, grind and recipe'),
        help: L('唯一的区别应该是水。', 'The only difference should be the water.'),
        illustration: 'pourover-pour',
      },
      {
        id: 'blind',
        text: L('可选：请别人把杯子标成 A 和 B，不告诉你哪杯是哪种水', 'Optional: ask someone to label the cups A and B without telling you which is which'),
        help: L('盲品能避免你的预期影响判断。', 'Blind tasting keeps expectations from steering you.'),
      },
      {
        id: 'taste',
        text: L('放凉约 5 分钟后来回品尝', 'Let them cool about 5 minutes, then taste back and forth'),
        timerSec: 300,
        safety: SAFE_HOT,
        help: L('关注明亮度、甜感和口感厚度。', 'Focus on brightness, sweetness and body.'),
      },
      {
        id: 'log',
        text: L('记下差异和你的偏好', 'Note the differences and which you prefer'),
        help: L('如果喝不出差别，这也是真实的结果——说明你的水可能已经不错了。', 'If you can’t tell a difference, that’s a real result too — your water may already be fine.'),
      },
    ],
    logFields: ['taste', 'rating', 'notes'],
  },
  {
    id: 'exp-water-diagnose',
    lessonId: 'exp-water',
    kind: 'diagnose',
    title: L('水的问题怎么判断', 'Reasoning about water problems'),
    intro: L('假设场景，用来练习判断方向。', 'Hypothetical scenarios to practise reasoning.'),
    supportedModes: COG,
    scenarios: [
      {
        id: 'hard-water-machine',
        situation: L('你的意式机说明书要求使用软化水，而你家的自来水很硬，你已经直接用了好几个月。', 'Your espresso machine manual asks for softened water, but your tap water is very hard and you’ve used it unfiltered for months.'),
        observations: {},
        choices: [
          { id: 'manual', text: L('查看说明书中的除垢和用水建议，换成它推荐的滤水或用水方案', 'Check the manual’s descaling and water advice; switch to the filtration or water it recommends'), quality: 'best', feedback: L('水垢可能损坏机器，厂家最了解自己机器能承受什么。', 'Scale can damage machines, and the manufacturer knows its tolerances best.') },
          { id: 'distilled', text: L('改用蒸馏水', 'Switch to distilled water'), quality: 'reasonable', feedback: L('能减少新水垢，但有些机器需要一定矿物质（传感器、防腐蚀），而且它去不掉已有的水垢——只有说明书允许时才这样做。', 'It reduces new scale, but some machines need some minerals (sensors, corrosion), and it won’t remove existing scale — only if your manual allows it.') },
          { id: 'vinegar', text: L('往锅炉里倒醋', 'Pour vinegar into the boiler'), quality: 'unhelpful', feedback: L('有些厂家明确不建议使用某些除垢剂；不要即兴操作，请按说明书来。', 'Some manufacturers specifically warn against certain descalers; never improvise — follow the manual.') },
        ],
        caveat: L('示意场景：你机器的说明书才是权威。', 'Illustrative: your machine’s manual is the authority.'),
      },
      {
        id: 'pool-taste',
        situation: L('你的手冲咖啡隐约有一股游泳池的味道。', 'Your pour-over has a faint swimming-pool taste.'),
        observations: { taste: L('像消毒水的味道', 'Like chlorine') },
        choices: [
          { id: 'filter', text: L('换用过滤水（如活性炭滤芯）或瓶装水再冲一杯', 'Brew again with filtered water (e.g. a carbon filter) or bottled water'), quality: 'best', feedback: L('这很可能是自来水中的余氯，活性炭过滤通常能减少这种味道。', 'Likely chlorine in the tap water; carbon filtration usually reduces it.') },
          { id: 'finer', text: L('研磨调细', 'Grind finer'), quality: 'unhelpful', feedback: L('水带来的异味不是萃取问题，调研磨解决不了。', 'An off-taste from water isn’t an extraction problem; grind won’t fix it.') },
          { id: 'hotter', text: L('用更热的水', 'Use hotter water'), quality: 'unhelpful', feedback: L('水温改变的是萃取速度，不能去掉水本身的异味。', 'Temperature changes extraction speed; it won’t remove the water’s own taint.') },
        ],
        caveat: CAVEAT,
      },
    ],
  },
  {
    id: 'exp-water-reflect',
    lessonId: 'exp-water',
    kind: 'reflect',
    title: L('关于你的水', 'About your water'),
    supportedModes: COG,
    prompts: [
      L('两杯水冲出来的咖啡，你喝出差别了吗？', 'Could you taste a difference between the two waters?'),
      L('你的咖啡机说明书对用水有什么要求？', 'What does your machine manual say about water?'),
      L('你打算以后用哪种水冲咖啡？', 'Which water will you brew with from now on?'),
    ],
  },

  // ═════════════════════ exp-cleaning-care ═════════════════════
  {
    id: 'exp-cleaning-care-explain',
    lessonId: 'exp-cleaning-care',
    kind: 'explain',
    title: L('为什么要清洁，怎样安全地清洁', 'Why clean — and how to do it safely'),
    supportedModes: COG,
    cards: [
      {
        heading: L('喝到的是咖啡，不是昨天的油', 'Taste the coffee, not yesterday’s oils'),
        body: L(
          '咖啡油脂会在器具上积累、变质，给新鲜咖啡带来苦涩、陈旧的怪味；奶渍残留会滋生细菌。干净的器具让你尝到的就是这包豆子。',
          'Coffee oils build up on gear and turn stale, adding bitter, papery off-flavours to fresh coffee; milk residue breeds bacteria. Clean gear lets you taste this coffee.',
        ),
        illustration: 'cleaning-cloth',
        callout: {
          kind: 'myth',
          text: L('误区：“器具上的棕色油膜能‘养’出好味道。”陈旧油脂只会带来怪味。', 'Myth: “A brown coating ‘seasons’ the gear.” Stale oil only adds off-flavours.'),
        },
      },
      {
        heading: L('每天的小习惯', 'Small daily habits'),
        body: L(
          '每次打奶后立即排气并擦蒸汽棒；敲掉粉饼、冲洗粉碗；冲洗滤杯、分享壶和法压壶；倒空接水盘；擦拭磨豆机外部。',
          'Purge and wipe the steam wand after every use; knock out pucks and rinse baskets; rinse drippers, carafes and presses; empty the drip tray; wipe the grinder’s outside.',
        ),
        illustration: 'daily-habits',
        callout: { kind: 'tip', text: L('准备一块只用来擦蒸汽棒的湿布。', 'Keep a damp towel used only for the steam wand.') },
      },
      {
        heading: L('定期维护因机器而异', 'Periodic tasks are machine-specific'),
        body: L(
          '除垢、反冲洗（仅限支持的机器）、冲煮头密封圈和分水网的保养、磨豆机刀盘清洁——都请严格按照你的厂家说明。适合一台机器的产品和方法，可能会损坏另一台。',
          'Descaling, backflushing (only on machines that support it), group gasket and shower-screen care, burr cleaning — follow your manufacturer’s instructions exactly. Products and methods that suit one machine can damage another.',
        ),
        illustration: 'manual-book',
        callout: { kind: 'safety', text: SAFE_MANUAL },
      },
      {
        heading: L('安全第一', 'Safety first'),
        body: L(
          '先让部件冷却；除了日常排气和擦拭，其余清洁前先关机断电；锅炉、带压部件和摩卡壶在热的时候绝不打开；电器底座不要泡水；手指绝不伸进磨豆机。',
          'Let parts cool; beyond routine purging and wiping, switch off and unplug before cleaning; never open boilers, pressurised parts or a moka pot while hot; never immerse electrical bases; never put fingers into a grinder.',
        ),
        illustration: 'safety-unplug',
        callout: { kind: 'safety', text: L('蒸汽可瞬间烫伤：排气时喷头朝下、朝外，手远离金属部分。', 'Steam burns instantly: when purging, point the tip down and away and keep fingers off the metal.') },
      },
    ],
  },
  {
    id: 'exp-cleaning-care-sequence',
    lessonId: 'exp-cleaning-care',
    kind: 'sequence',
    title: L('意式机收尾顺序', 'Espresso tidy-up order'),
    supportedModes: COG,
    prompt: L('把一次意式咖啡制作结束后的收尾步骤排好顺序。', 'Order the tidy-up steps at the end of an espresso session.'),
    steps: [
      { id: 'wand', text: L('打奶后立即排气并擦净蒸汽棒', 'Purge and wipe the steam wand right after steaming'), why: L('奶几分钟就会干结在喷头上，也关乎卫生。', 'Milk dries onto the tip within minutes, and it’s a hygiene issue.') },
      { id: 'puck', text: L('把粉饼敲进敲渣桶', 'Knock the puck into the knock box'), why: L('湿粉留在粉碗里会染色、堵孔。', 'Wet grounds left in the basket stain and clog it.') },
      { id: 'flush', text: L('冲洗粉碗，并按说明书短暂冲洗冲煮头', 'Rinse the basket and briefly flush the group head as your manual describes'), why: L('冲掉分水网和密封圈附近的残粉。', 'Clears grounds from the shower screen and gasket area.') },
      { id: 'tray', text: L('在说明书允许时倒空并冲洗接水盘', 'Empty and rinse the drip tray when your manual says it’s safe'), why: L('积水和咖啡残液很快会发出异味。', 'Standing water and coffee quickly get smelly.') },
      { id: 'wipe', text: L('擦拭机身和磨豆机外部；磨豆机断电后再刷出粉口', 'Wipe the machine and grinder exterior; brush the grinder chute only when unplugged'), why: L('防止油脂和粉末积累。', 'Keeps oils and grounds from building up.') },
      { id: 'off', text: L('按说明书关机，并记下下次定期维护的时间', 'Switch off per the manual and note when periodic maintenance is due'), why: L('除垢和反冲洗的周期因机器而异。', 'Descaling and backflushing intervals depend on the machine.') },
    ],
    hint: L('最怕“干掉”的东西先处理。', 'Deal first with whatever dries and hardens fastest.'),
    misconceptions: [
      { earlierStep: 'wand', laterStep: 'off', feedback: L('奶渍几分钟就会干结成难清理的硬壳——打完奶第一件事就是排气擦净。', 'Milk dries into a hard crust within minutes — purge and wipe the wand first.') },
      { earlierStep: 'puck', laterStep: 'flush', feedback: L('先把粉饼敲掉，冲洗才有意义。', 'Knock out the puck first — flushing only helps once it’s out.') },
    ],
  },
  {
    id: 'exp-cleaning-care-quiz',
    lessonId: 'exp-cleaning-care',
    kind: 'quiz',
    title: L('清洁与安全小测', 'Cleaning & safety check'),
    supportedModes: COG,
    questions: [
      {
        id: 'exp-clean-q1',
        prompt: L('说明书要求用指定除垢剂定期除垢，朋友建议直接用醋。你应该？', 'Your manual specifies a descaler and schedule; a friend suggests vinegar instead. What should you do?'),
        options: [
          { id: 'a', text: L('按说明书来；有些厂家明确不建议用醋或其他产品', 'Follow the manual — some manufacturers advise against vinegar or other products'), correct: true, feedback: L('对，厂家最清楚哪些材料和部件能承受什么。', 'Right — the manufacturer knows what its materials and parts can handle.') },
          { id: 'b', text: L('醋对所有机器都适用', 'Vinegar works for every machine'), correct: false, feedback: L('不同机器的材料和密封件不同，不存在通用做法。', 'Machines use different materials and seals — there’s no universal method.') },
          { id: 'c', text: L('咖啡喝着没问题就不用除垢', 'Skip descaling if the coffee tastes fine'), correct: false, feedback: L('水垢是看不见地慢慢积累的，可能在出问题前就已损坏机器。', 'Scale builds up invisibly and can damage the machine before you notice anything.') },
        ],
        explanation: L('定期维护：只听厂家的。', 'Periodic maintenance: manufacturer’s instructions only.'),
      },
      {
        id: 'exp-clean-q2',
        prompt: L('要刷掉电动磨豆机出粉口的残粉，第一步是？', 'Before brushing grounds out of an electric grinder’s chute, you should first…'),
        options: [
          { id: 'a', text: L('关机并拔掉插头', 'Switch it off and unplug it'), correct: true, feedback: L('对，断电后手和刷子靠近刀盘才安全。', 'Yes — only then is it safe to work near the burrs.') },
          { id: 'b', text: L('让它空转，把粉吹出来', 'Run it empty so the grounds fly out'), correct: false, feedback: L('运转时手或刷子靠近高速刀盘非常危险。', 'Hands or brushes near spinning burrs are dangerous.') },
          { id: 'c', text: L('边运转边用小刀拨', 'Poke it with a knife while it runs'), correct: false, feedback: L('绝对不要。既危险又可能损坏刀盘。', 'Never — it’s dangerous and can damage the burrs.') },
        ],
        explanation: L('电器清洁：先断电。', 'Cleaning electrics: unplug first.'),
      },
      {
        id: 'exp-clean-q3',
        prompt: L('为什么打完奶要立刻给蒸汽棒排气？', 'Why purge the steam wand right after steaming?'),
        options: [
          { id: 'a', text: L('把喷头里的奶冲出来，免得干结，也更卫生', 'To clear milk from inside the tip before it dries, and for hygiene'), correct: true, feedback: L('对，奶会被吸进喷头里，干了以后很难清理。', 'Right — milk can be drawn into the tip and is hard to clean once dry.') },
          { id: 'b', text: L('为了让机器降温', 'To cool the machine down'), correct: false, feedback: L('排气只有一两秒，作用是清洁喷头，不是降温。', 'A one- or two-second purge cleans the tip; it doesn’t cool the machine.') },
          { id: 'c', text: L('只是做个样子', 'It’s just for show'), correct: false, feedback: L('这是重要的卫生习惯，咖啡师每次都会做。', 'It’s an important hygiene habit baristas do every time.') },
        ],
        explanation: L('打奶、排气、擦净——一套动作。', 'Steam, purge, wipe — one routine.'),
      },
    ],
  },
  {
    id: 'exp-cleaning-care-routine',
    lessonId: 'exp-cleaning-care',
    kind: 'guided-practice',
    title: L('每日收尾：意式机与手冲器具', 'Daily reset: espresso station & pour-over gear'),
    intro: L(
      '一套安全的日常收尾流程。如果你的说明书写法不同，以说明书为准。完成情况由你自己确认（自我报告）。',
      'A safe daily reset routine. If your manual says otherwise, the manual wins. Completion is self-reported.',
    ),
    supportedModes: REAL,
    safetyNotes: [SAFE_STEAM, SAFE_GRINDER, SAFE_MANUAL],
    equipment: ['espresso-machine', 'portafilter', 'basket', 'knock-box', 'towel', 'cleaning-brush', 'grinder'],
    steps: [
      {
        id: 'manual',
        text: L('把机器说明书（或官网页面）放在手边，看看它推荐的日常清洁', 'Have your machine manual (or its web page) handy and check its recommended daily cleaning'),
        help: L('如果说明书的步骤和这里不同，按说明书来。', 'If your manual’s steps differ from these, follow the manual.'),
      },
      {
        id: 'wand',
        text: L('短暂排气蒸汽棒，再用专用湿布擦净', 'Purge the steam wand briefly, then wipe it with the wand-only damp towel'),
        safety: L('蒸汽可瞬间烫伤：喷头朝下朝外，手指不碰金属。', 'Steam burns instantly: tip pointed down and away, fingers off the metal.'),
        help: L('奶渍已经干了？用湿布包住喷头片刻软化后再擦，不要用尖锐工具刮。', 'Milk already dried? Wrap the tip in the damp towel for a moment to soften it — don’t scrape with sharp tools.'),
      },
      {
        id: 'puck',
        text: L('敲掉粉饼，冲洗粉碗和手柄', 'Knock out the puck; rinse the basket and portafilter'),
        safety: L('手柄金属部分可能还很烫，只握把手。', 'The portafilter metal may still be hot — hold the handle.'),
        help: L('粉饼散了很正常，冲洗干净即可。', 'A crumbly puck is normal — just rinse it clean.'),
      },
      {
        id: 'group',
        text: L('不装手柄，按说明书短暂冲洗冲煮头，用布擦拭密封圈周围', 'Without the portafilter, briefly flush the group head per the manual and wipe around the gasket with a cloth'),
        safety: L('热水会烫伤：手远离出水。', 'Hot water scalds: keep hands out of the stream.'),
        help: L('有人会用专用刷子刷冲煮头，只做说明书里描述的操作。', 'Some use a group brush here — only do what your manual describes.'),
      },
      {
        id: 'tray',
        text: L('在说明书允许时取下接水盘，倒空、冲洗并擦干', 'When the manual says it’s safe, remove the drip tray, empty, rinse and dry it'),
        help: L('有些接水盘有满水浮标，可以留意它。', 'Some trays have a float that shows when they’re full.'),
      },
      {
        id: 'grinder',
        text: L('拔掉磨豆机插头，再刷出粉口、擦拭外部', 'Unplug the grinder, then brush the chute and wipe the outside'),
        safety: SAFE_GRINDER,
        help: L('刀盘深度清洁请按磨豆机厂家说明进行。', 'Deep burr cleaning: follow your grinder maker’s instructions.'),
      },
      {
        id: 'pourover',
        text: L('用热水冲洗滤杯和分享壶；油脂积累时用温和洗洁精清洗并冲净', 'Rinse your dripper and carafe with hot water; wash with mild detergent when oils build up, then rinse well'),
        safety: L('玻璃遇冷热骤变可能破裂。', 'Glass can crack with sudden temperature changes.'),
        help: L('洗洁精冲不干净会留下味道，多冲几次。', 'Leftover detergent can taint flavour — rinse thoroughly.'),
      },
      {
        id: 'schedule',
        text: L('记下今天的日期，以及说明书上下一次除垢/反冲洗的时间', 'Note today’s date and when descaling/backflushing is next due per your manual'),
        help: L('Coffee Lab 不提供特定机器的维护步骤——你的说明书才是权威。', 'Coffee Lab doesn’t give machine-specific maintenance procedures — your manual is the authority.'),
      },
    ],
    logFields: ['notes'],
  },
  {
    id: 'exp-cleaning-care-reflect',
    lessonId: 'exp-cleaning-care',
    kind: 'reflect',
    title: L('你的保养习惯', 'Your care habits'),
    supportedModes: COG,
    prompts: [
      L('哪一步清洁是你之前常常跳过的？', 'Which cleaning step had you been skipping?'),
      L('你的说明书建议多久除垢一次？', 'How often does your manual recommend descaling?'),
      L('清洁后，下一杯咖啡喝起来有变化吗？', 'After cleaning, did your next coffee taste any different?'),
    ],
  },
];

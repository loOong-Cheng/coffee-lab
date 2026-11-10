/**
 * Track C — Pour-over fundamentals. Brief §4 Track C.
 * Many valid techniques exist; every number here is an illustrative starting point.
 */
import type { Activity, Lesson, LocalizedText, Mode, Track } from '../../domain/contracts';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

const CONCEPT: Mode[] = ['desktop', 'mobile'];
const SPATIAL_OK: Mode[] = ['desktop', 'mobile', 'xr'];
const REFLECT: Mode[] = ['desktop', 'mobile', 'real-world-guide'];
const REAL_WORLD: Mode[] = ['mobile', 'real-world-guide', 'desktop'];

const HOT_WATER = L(
  '接近沸腾的水会瞬间烫伤：水壶放在平稳的台面上，握住把手，慢慢倒、远离身体；滤杯要稳稳地放在分享壶或杯子上。',
  'Near-boiling water scalds instantly: keep the kettle on a stable surface, hold the handle, pour slowly and away from your body, and seat the dripper securely on the carafe or mug.',
);
const GRINDER_SAFE = L(
  '磨豆机运转时手指远离刀盘；清理或卡豆时先拔电源。',
  'Keep fingers away from the burrs while grinding; unplug before clearing or cleaning.',
);
const MANY_WAYS = L(
  '手冲有很多同样有效的方法，这里的配方只是起点。',
  'There are many equally valid pour-over methods; this recipe is just a starting point.',
);

export const track: Track = {
  id: 'pourover',
  order: 3,
  title: L('手冲基础', 'Pour-Over Fundamentals'),
  summary: L(
    '认识器具、学会粉水比和闷蒸，用自己的手冲器具冲一杯真实的咖啡，再通过品尝和记录一次次改进。',
    'Meet the gear, learn ratio and bloom, brew a real cup with your own kit, then taste, log and improve one change at a time.',
  ),
  lessonIds: ['po-meet-the-gear', 'po-ratio-bloom', 'po-first-real-cup', 'po-taste-iterate'],
};

export const lessons: Lesson[] = [
  {
    id: 'po-meet-the-gear',
    track: 'pourover',
    level: 'beginner',
    title: L('认识手冲器具', 'Meet the Gear'),
    goal: L(
      '认出手冲需要的器具——滤杯、滤纸、细口壶、分享壶、秤、磨豆机、计时器和咖啡豆——并说出它们的作用。',
      'Recognise the pour-over kit — dripper, filter, gooseneck kettle, carafe, scale, grinder, timer and beans — and say what each one does.',
    ),
    prerequisites: ['lit-tools-safety'],
    keyConcepts: [
      L('手冲 = 手动注水，靠重力穿过滤纸里的咖啡粉', 'Pour-over = hand-poured water drawn by gravity through coffee in a filter'),
      L('滤杯形状多样，各有特点，没有唯一正确', 'Drippers come in many shapes; none is the one right choice'),
      L('滤纸要先冲洗：去纸味、预热', 'Rinse paper filters: removes paper taste and preheats'),
      L('细口壶让水流更可控', 'A gooseneck kettle makes pouring controllable'),
      L('手冲研磨比意式粗得多', 'Pour-over grind is much coarser than espresso'),
    ],
    activityIds: ['po-meet-the-gear-cards', 'po-meet-the-gear-identify', 'po-meet-the-gear-quiz', 'po-meet-the-gear-reflect'],
    checkForUnderstanding: ['po-meet-the-gear-identify', 'po-meet-the-gear-quiz'],
    safetyNotes: [HOT_WATER],
    estimatedMinutes: 10,
    sources: ['sca-csp', 'sca-csp-catalog', 'coffee-lab-editorial'],
    confidence: 'verified',
    next: ['po-ratio-bloom'],
  },
  {
    id: 'po-ratio-bloom',
    track: 'pourover',
    level: 'beginner',
    title: L('粉水比与闷蒸', 'Ratio and Bloom'),
    goal: L(
      '根据粉量和比例算出注水量，解释闷蒸的作用，并把一次手冲的步骤按顺序排好。',
      'Work out the water for a dose and ratio, explain what the bloom does, and put the steps of a pour-over in order.',
    ),
    prerequisites: ['po-meet-the-gear', 'lit-brewing-concepts'],
    keyConcepts: [
      L('手冲比例 = 注水量 ÷ 粉量', 'Pour-over ratio = water ÷ dose'),
      L('15 g : 250 g ≈ 1:16.7（示意起点）', '15 g : 250 g ≈ 1:16.7 (illustrative start)'),
      L('闷蒸：先用少量水润湿咖啡粉，让气体释放', 'Bloom: wet the grounds with a little water first so gas can escape'),
      L('分段注水或连续注水都可以', 'Pulse or continuous pouring both work'),
      L('总时间是判断研磨的线索', 'Total time is a clue about grind'),
    ],
    activityIds: ['po-ratio-bloom-cards', 'po-ratio-bloom-sim', 'po-ratio-bloom-order', 'po-ratio-bloom-xr', 'po-ratio-bloom-quiz'],
    checkForUnderstanding: ['po-ratio-bloom-sim', 'po-ratio-bloom-order', 'po-ratio-bloom-quiz'],
    safetyNotes: [HOT_WATER],
    estimatedMinutes: 15,
    sources: ['sca-brew-temp', 'sca-dialing-in', 'ucdavis-ccc-2023', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['po-first-real-cup'],
  },
  {
    id: 'po-first-real-cup',
    track: 'pourover',
    level: 'beginner',
    title: L('你的第一杯真实手冲', 'Your First Real Cup'),
    goal: L(
      '用自己的手冲器具按步骤冲一杯真实的咖啡，测量粉量、水量和时间，品尝并记录。',
      'Brew a real pour-over with your own kit, step by step: measure dose, water and time, then taste and log it.',
    ),
    prerequisites: ['po-ratio-bloom'],
    keyConcepts: [
      L('示意起点：15 g 粉、250 g 水', 'Illustrative start: 15 g coffee, 250 g water'),
      L('闷蒸约 30–45 秒', 'Bloom for roughly 30–45 seconds'),
      L('分段注水到目标重量', 'Pour in stages to the target weight'),
      L('记下总时间，冷却时多尝几次', 'Note total time; taste again as it cools'),
      L('完成情况是你的自我报告', 'Completion is your own self-report'),
    ],
    activityIds: ['po-first-real-cup-cards', 'po-first-real-cup-ready', 'po-first-real-cup-guide', 'po-first-real-cup-reflect'],
    checkForUnderstanding: ['po-first-real-cup-ready'],
    safetyNotes: [HOT_WATER, GRINDER_SAFE],
    estimatedMinutes: 20,
    sources: ['sca-brew-temp', 'manufacturer-manual', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['po-taste-iterate'],
  },
  {
    id: 'po-taste-iterate',
    track: 'pourover',
    level: 'beginner',
    title: L('品尝与迭代', 'Taste and Iterate'),
    goal: L(
      '用简单的词描述一杯真实的咖啡，把常见的味道印象和可能的原因联系起来，并用记录计划下一次只改一处。',
      'Describe a real cup in simple words, link common impressions to likely causes, and use your journal to plan one change for next time.',
    ),
    prerequisites: ['po-first-real-cup'],
    keyConcepts: [
      L('分三次品尝：热、温、凉', 'Taste in three passes: hot, warm, cool'),
      L('太淡/太浓 → 先调比例', 'Too weak or too strong → adjust the ratio first'),
      L('偏酸单薄/偏苦发干 → 调研磨（或水温）', 'Sour and thin / bitter and dry → adjust grind (or temperature)'),
      L('一次只改一个，并记录下来', 'One change at a time, written down'),
      L('你的口味才是最终标准', 'Your taste is the final standard'),
    ],
    activityIds: ['po-taste-iterate-cards', 'po-taste-iterate-scenarios', 'po-taste-iterate-quiz', 'po-taste-iterate-reflect'],
    checkForUnderstanding: ['po-taste-iterate-scenarios', 'po-taste-iterate-quiz'],
    safetyNotes: [],
    estimatedMinutes: 15,
    sources: ['sca-dialing-in', 'ucdavis-ccc-2023', 'sca-brew-temp', 'coffee-lab-editorial'],
    confidence: 'rule-of-thumb',
    next: ['exp-sensory-basics'],
  },
];

export const activities: Activity[] = [
  // ═════════════════════ po-meet-the-gear ═════════════════════
  {
    id: 'po-meet-the-gear-cards',
    lessonId: 'po-meet-the-gear',
    kind: 'explain',
    title: L('手冲器具导览', 'A Tour of the Pour-Over Kit'),
    objectiveIds: ['po.parts'],
    supportedModes: SPATIAL_OK,
    cards: [
      {
        heading: L('一句话说手冲', 'Pour-over in one sentence'),
        body: L(
          '把热水手动倒在滤纸里中等偏细的咖啡粉上，水靠重力穿过咖啡、滴进分享壶或杯子。它通常得到干净、清晰的一杯，而且注水的快慢由你掌握。',
          'Hot water is poured by hand over medium-fine coffee in a filter, and gravity draws it through into a carafe or mug. It usually gives a clean, clear cup — and you control the pace.',
        ),
        illustration: 'pourover-overview',
      },
      {
        heading: L('滤杯有很多形状', 'Drippers come in many shapes'),
        body: L(
          '锥形滤杯通常只有一个大孔，流速快，更依赖注水手法；平底滤杯常有几个小孔，相对更宽容。陶瓷、玻璃、树脂、金属的保温性也不同。它们都能做出好咖啡。',
          'Cone drippers usually have one large hole: they flow fast and depend more on your pouring. Flat-bottom drippers often have a few small holes and are more forgiving. Ceramic, glass, plastic and metal hold heat differently. All of them can make great coffee.',
        ),
        illustration: 'dripper-shapes',
        callout: { kind: 'tip', text: MANY_WAYS },
      },
      {
        heading: L('滤纸与冲洗', 'Filters and rinsing'),
        body: L(
          '纸滤会拦住大部分油脂和细粉，杯子更干净、明亮；金属或布滤让更多油脂通过，口感更厚。纸滤用前先用热水冲洗，去掉纸味并预热器具——记得倒掉冲洗水。',
          'Paper filters hold back most oils and fines for a clean, bright cup; metal or cloth filters let more oils through for a heavier body. Rinse a paper filter with hot water first to remove paper taste and preheat the gear — then pour that rinse water away.',
        ),
        illustration: 'filter-rinse',
      },
      {
        heading: L('细口壶', 'The gooseneck kettle'),
        body: L(
          '细长的壶嘴让你能控制水流的速度和落点，均匀地浇湿咖啡粉。普通水壶也能用，只是要更小心、更慢。常见的起点是“刚离火”的热水。',
          'A long, thin spout lets you control how fast and where the water lands, wetting the coffee evenly. A regular kettle works too — you just need to pour more slowly and carefully. Water just off the boil is a common starting point.',
        ),
        illustration: 'gooseneck',
        callout: { kind: 'safety', text: HOT_WATER },
      },
      {
        heading: L('手冲的研磨度', 'Grind for pour-over'),
        body: L(
          '手冲的研磨通常是中等偏细到中等，大致在细盐粒到粗砂之间，比意式粗得多。研磨是你调整手冲最主要的旋钮：太快就调细一点，太慢就调粗一点。',
          'Pour-over grind is usually medium-fine to medium — roughly between table salt and coarse sand — much coarser than espresso. Grind is your main dial: too fast, go a little finer; too slow, a little coarser.',
        ),
        illustration: 'grind-size-scale',
        callout: { kind: 'illustrative', text: L('“像盐粒”只是粗略的比喻，各磨豆机刻度不同。', '"Like salt" is only a rough comparison; grinder settings differ.') },
      },
      {
        heading: L('秤、计时器和豆子', 'Scale, timer and beans'),
        body: L(
          '把整套器具放在秤上，注水时就能看到倒了多少克水。计时器帮你掌握闷蒸和总时间。新鲜的咖啡豆闷蒸时会明显鼓起，这是正常的排气。',
          'With the whole setup on a scale, you see exactly how many grams you’ve poured. A timer tracks the bloom and the total time. Fresh beans puff up noticeably during the bloom — that’s normal degassing.',
        ),
        illustration: 'scale-timer',
      },
    ],
  },
  {
    id: 'po-meet-the-gear-identify',
    lessonId: 'po-meet-the-gear',
    kind: 'identify',
    title: L('找出器具', 'Find the Gear'),
    objectiveIds: ['po.parts'],
    supportedModes: SPATIAL_OK,
    diagram: 'pourover-station',
    prompt: L('点击（或指向）每件器具。答对后会显示它的作用。', 'Select each item. Once you find it, you’ll see what it does.'),
    targets: [
      {
        partId: 'gooseneck-kettle',
        label: L('细口壶', 'Gooseneck kettle'),
        description: L('细长壶嘴让水流可控，能慢慢、均匀地注水。', 'Its thin spout gives slow, even, controllable pouring.'),
        hint: L('壶嘴又细又弯，像鹅的脖子。', 'The spout is long and curved, like a goose’s neck.'),
      },
      {
        partId: 'dripper',
        label: L('滤杯', 'Dripper'),
        description: L('托住滤纸和咖啡粉，底部的孔让咖啡滴下。', 'Holds the filter and coffee; holes in the bottom let coffee drip through.'),
        hint: L('像一个底部有孔的小漏斗。', 'Like a small funnel with holes in the bottom.'),
      },
      {
        partId: 'paper-filter',
        label: L('滤纸', 'Paper filter'),
        description: L('拦住咖啡粉和大部分油脂，让杯子更干净。用前先冲洗。', 'Holds back grounds and most oils for a clean cup. Rinse before use.'),
        hint: L('放在滤杯里面的白色或棕色纸。', 'The white or brown paper inside the dripper.'),
      },
      {
        partId: 'carafe',
        label: L('分享壶', 'Carafe'),
        description: L('接住冲好的咖啡；也可以直接用马克杯。', 'Catches the brewed coffee; a mug works too.'),
        hint: L('滤杯下面的玻璃壶。', 'The glass jug under the dripper.'),
      },
      {
        partId: 'scale',
        label: L('电子秤', 'Scale'),
        description: L('称咖啡粉，并在注水时实时显示倒了多少水。', 'Weighs the coffee and shows how much water you’ve poured in real time.'),
        hint: L('整套器具下面带显示屏的平板。', 'The flat display under the whole setup.'),
      },
      {
        partId: 'grinder',
        label: L('磨豆机', 'Grinder'),
        description: L('把豆子磨到适合手冲的粗细；研磨是主要调节旋钮。', 'Grinds beans to a pour-over size; grind is your main dial.'),
        hint: L('有豆仓或摇柄的那台机器。', 'The device with a hopper or a crank.'),
      },
      {
        partId: 'coffee-beans',
        label: L('咖啡豆', 'Coffee beans'),
        description: L('最好是有烘焙日期的新鲜豆子，冲前再磨。', 'Ideally fresh, with a roast date — grind right before brewing.'),
        hint: L('棕色的小颗粒，通常在袋子或罐子里。', 'Small brown beans, usually in a bag or jar.'),
      },
      {
        partId: 'timer',
        label: L('计时器', 'Timer'),
        description: L('掌握闷蒸时间和总冲煮时间。', 'Tracks the bloom and the total brew time.'),
        hint: L('显示分和秒的东西——手机也可以。', 'Anything showing minutes and seconds — a phone works.'),
      },
    ],
  },
  {
    id: 'po-meet-the-gear-quiz',
    lessonId: 'po-meet-the-gear',
    kind: 'quiz',
    title: L('小测：手冲器具', 'Quick Check: The Kit'),
    objectiveIds: ['po.parts'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-gooseneck',
        prompt: L('细口壶最主要的好处是？', 'What is the main benefit of a gooseneck kettle?'),
        options: [
          {
            id: 'control',
            text: L('能控制水流的速度和落点', 'Control over how fast and where water lands'),
            correct: true,
            feedback: L('对。均匀浇湿咖啡粉更容易。', 'Right — it makes wetting the coffee evenly much easier.'),
          },
          {
            id: 'hotter',
            text: L('让水更热', 'It makes the water hotter'),
            correct: false,
            feedback: L('壶嘴形状不改变水温，它改变的是水流。', 'Spout shape doesn’t change temperature; it changes the flow.'),
          },
          {
            id: 'required',
            text: L('没有它就不能做手冲', 'You can’t make pour-over without one'),
            correct: false,
            feedback: L('普通水壶也能用，只是要倒得更小心。', 'A regular kettle works — you just pour more carefully.'),
          },
        ],
        explanation: L('细口壶是“控制”工具，不是必需品。', 'A gooseneck is a control tool, not a requirement.'),
      },
      {
        id: 'q-grind',
        prompt: L('和意式相比，手冲的研磨通常？', 'Compared with espresso, pour-over grind is usually…'),
        options: [
          {
            id: 'coarser',
            text: L('粗得多', 'Much coarser'),
            correct: true,
            feedback: L('对。水靠重力流过，不需要意式那样的阻力。', 'Correct. Gravity drives the water, so it doesn’t need espresso’s resistance.'),
          },
          {
            id: 'same',
            text: L('差不多', 'About the same'),
            correct: false,
            feedback: L('用意式的细粉做手冲会堵住滤纸，变得很慢、很苦。', 'Espresso-fine grounds would clog the filter, running slow and bitter.'),
          },
          {
            id: 'finer',
            text: L('更细', 'Finer'),
            correct: false,
            feedback: L('意式已经是最细的常用研磨之一了。手冲要粗得多。', 'Espresso is already among the finest common grinds; pour-over is much coarser.'),
          },
        ],
        explanation: L('冲煮方式决定研磨粗细。', 'The brew method sets the grind size.'),
      },
      {
        id: 'q-rinse',
        prompt: L('为什么要先用热水冲洗滤纸？', 'Why rinse the paper filter with hot water first?'),
        options: [
          {
            id: 'paper-taste',
            text: L('去掉纸味并预热器具，然后倒掉冲洗水', 'To remove paper taste and preheat the gear — then discard that water'),
            correct: true,
            feedback: L('对。别忘了倒掉分享壶里的冲洗水。', 'Right. Don’t forget to tip the rinse water out of the carafe.'),
          },
          {
            id: 'stronger',
            text: L('让咖啡更浓', 'To make the coffee stronger'),
            correct: false,
            feedback: L('冲洗不影响浓度，浓度由比例决定。', 'Rinsing doesn’t affect strength — the ratio does.'),
          },
          {
            id: 'keep-water',
            text: L('冲洗水留在壶里一起喝', 'The rinse water stays in to drink'),
            correct: false,
            feedback: L('冲洗水带有纸味，还会冲淡咖啡，要倒掉。', 'Rinse water tastes papery and dilutes the coffee — pour it away.'),
          },
        ],
        explanation: L('冲洗 → 倒掉 → 再放咖啡粉。', 'Rinse → discard → then add coffee.'),
      },
      {
        id: 'q-filter-type',
        prompt: L('金属滤网和纸滤相比，通常会让咖啡？', 'Compared with paper, a metal filter usually makes coffee…'),
        options: [
          {
            id: 'body',
            text: L('油脂更多、口感更厚', 'Oilier with more body'),
            correct: true,
            feedback: L('对。纸滤则更干净、明亮。都没问题，看你喜欢。', 'Right. Paper gives a cleaner, brighter cup. Both are fine — it’s preference.'),
          },
          {
            id: 'cleaner',
            text: L('更干净、更清澈', 'Cleaner and clearer'),
            correct: false,
            feedback: L('那是纸滤的特点：它拦住更多油脂和细粉。', 'That’s paper: it holds back more oils and fines.'),
          },
          {
            id: 'no-diff',
            text: L('没有区别', 'No difference'),
            correct: false,
            feedback: L('滤材会明显影响口感和清澈度。', 'Filter material noticeably affects body and clarity.'),
          },
        ],
        explanation: L('滤材是一种风格选择。', 'Filter material is a style choice.'),
      },
    ],
  },
  {
    id: 'po-meet-the-gear-reflect',
    lessonId: 'po-meet-the-gear',
    kind: 'reflect',
    title: L('看看你的器具', 'Look at Your Kit'),
    supportedModes: REFLECT,
    prompts: [
      L('你的滤杯是锥形还是平底？有几个孔？', 'Is your dripper a cone or flat-bottomed? How many holes?'),
      L('你用的是纸滤、金属滤还是布滤？', 'Do you use paper, metal or cloth filters?'),
      L('你的水壶能设定温度吗？没有的话，你打算怎么判断“刚离火”？', 'Can your kettle set a temperature? If not, how will you judge "just off the boil"?'),
    ],
  },

  // ═════════════════════ po-ratio-bloom ═════════════════════
  {
    id: 'po-ratio-bloom-cards',
    lessonId: 'po-ratio-bloom',
    kind: 'explain',
    title: L('比例、闷蒸和注水', 'Ratio, Bloom and Pouring'),
    objectiveIds: ['po.ratio-bloom'],
    supportedModes: CONCEPT,
    cards: [
      {
        heading: L('注水量 ÷ 粉量', 'Water ÷ coffee'),
        body: L(
          '手冲比例 = 总注水量 ÷ 粉量。15 g 粉配 250 g 水：250 ÷ 15 ≈ 16.7，约 1:17。很多人从 1:15 到 1:17 之间开始；一些冲煮参考标准接近 1:18（约每升 55 g 粉）。',
          'Pour-over ratio = total water ÷ dose. 15 g of coffee with 250 g of water: 250 ÷ 15 ≈ 16.7, about 1:17. Many people start between 1:15 and 1:17; some brewing references sit near 1:18 (about 55 g of coffee per litre).',
        ),
        illustration: 'ratio-bar-pourover',
        callout: { kind: 'illustrative', text: L('15 g : 250 g 是示意起点，不是唯一正确的配方。', '15 g : 250 g is an illustrative start, not the one right recipe.') },
      },
      {
        heading: L('闷蒸', 'The bloom'),
        body: L(
          '新鲜烘焙的咖啡含有二氧化碳。先倒入约粉量 2–3 倍的水，把所有咖啡粉浇湿，你会看到它鼓起、冒泡。等 30–45 秒左右，让气体排出，之后的水就能更均匀地接触咖啡。',
          'Freshly roasted coffee holds carbon dioxide. Pour about 2–3 times the dose in water to wet all the grounds — you’ll see it puff up and bubble. Wait around 30–45 seconds so the gas escapes and later water reaches the coffee more evenly.',
        ),
        illustration: 'bloom',
        callout: { kind: 'tip', text: L('不太鼓？豆子可能放得比较久了，这很常见，照样可以冲。', 'Not much puff? The beans may be older — common, and still fine to brew.') },
      },
      {
        heading: L('分段注水或连续注水', 'Pulses or one continuous pour'),
        body: L(
          '闷蒸之后，可以分几次注水，也可以一次慢慢连续注到目标重量。两种都有效，关键是每次保持一致。以小圆圈在中间注水，尽量不要直接冲到滤纸壁上。',
          'After the bloom, add water in a few pulses or one slow continuous pour to the target weight. Both work — the key is doing it the same way each time. Pour in small circles over the middle and try not to pour straight onto the filter walls.',
        ),
        illustration: 'pour-stages',
        callout: { kind: 'tip', text: MANY_WAYS },
      },
      {
        heading: L('水温', 'Water temperature'),
        body: L(
          '常见起点是刚离火的热水，大约 90–96 °C。浅烘豆常用更热的水，深烘豆常用稍低的。SCA 报道的一项研究发现，在 87–93 °C 之间，只要浓度和萃取相近，水温本身对风味的影响不大。没有温度计？水开后等约 30 秒。',
          'A common start is water just off the boil, about 90–96 °C. Lighter roasts often get hotter water, darker roasts a little cooler. Research reported by the SCA found that between 87 and 93 °C, temperature itself mattered little once strength and extraction were similar. No thermometer? Wait about 30 seconds after boiling.',
        ),
        illustration: 'kettle-temp',
      },
      {
        heading: L('总时间是线索', 'Total time is a clue'),
        body: L(
          '一杯约 250 g 的手冲，很多人在 2 分 30 秒到 4 分钟之间完成。远快于这个范围，通常说明研磨偏粗；远慢则说明偏细。不同滤杯差别很大，所以把时间当线索，用味道做决定。',
          'Many single-cup pour-overs of about 250 g finish between 2:30 and 4:00. Much faster usually means the grind is too coarse; much slower, too fine. Drippers vary a lot, so treat time as a clue and let taste decide.',
        ),
        illustration: 'shot-timer',
        callout: { kind: 'illustrative', text: L('时间范围是经验值，取决于滤杯和手法。', 'The time range is a rule of thumb that depends on dripper and technique.') },
      },
    ],
  },
  {
    id: 'po-ratio-bloom-sim',
    lessonId: 'po-ratio-bloom',
    kind: 'parameter-lab',
    lab: 'pourover-ratio',
    title: L('粉水比调节器', 'Brew Ratio Dial'),
    intro: L('拖动粉量和注水量，比例会实时计算（注水量 ÷ 粉量）。', 'Drag dose and water; the ratio (water ÷ dose) updates live.'),
    objectiveIds: ['po.ratio-bloom'],
    supportedModes: CONCEPT,
    defaults: { doseG: 15, outG: 250 },
    ranges: { doseG: [8, 40], outG: [120, 640] },
    illustrativeNote: L(
      '15 g : 250 g（约 1:17）只是示意起点。适合你的比例取决于豆子、滤杯和你的口味——很多有效的配方从 1:14 到 1:18 都有。',
      '15 g : 250 g (about 1:17) is only an illustrative starting point. The ratio that suits you depends on beans, dripper and taste — valid recipes range from about 1:14 to 1:18.',
    ),
    challenges: [
      {
        id: 'ch-stronger',
        prompt: L('想要更浓一点的一杯：比例在 1:14.5 到 1:15.5 之间。', 'Make a slightly stronger cup: a ratio between 1:14.5 and 1:15.5.'),
        target: { ratioMin: 14.5, ratioMax: 15.5 },
        success: L('水相对更少，杯子更浓。比如 15 g 配约 225 g 水。', 'Less water per gram of coffee makes it stronger — e.g. 15 g with about 225 g.'),
      },
      {
        id: 'ch-two',
        prompt: L('给两个人冲：用 30 g 粉，比例保持在 1:16–1:17。', 'Brew for two: use 30 g of coffee and keep 1:16 to 1:17.'),
        target: { ratioMin: 16, ratioMax: 17, doseG: [29.5, 30.5] },
        success: L('30 g × 16–17 = 480–510 g 水。比例让放大很简单。', '30 g × 16–17 = 480–510 g of water. Ratios make scaling easy.'),
      },
      {
        id: 'ch-22',
        prompt: L('用 22 g 粉，比例保持在 1:15.5–1:16.5。', 'Use 22 g of coffee at 1:15.5 to 1:16.5.'),
        target: { ratioMin: 15.5, ratioMax: 16.5, doseG: [21.5, 22.5] },
        success: L('22 g × 16 = 352 g 左右，正好一大杯。', '22 g × 16 ≈ 352 g — a big mug.'),
      },
      {
        id: 'ch-lighter',
        prompt: L('更清淡的一杯：比例在 1:17.5 到 1:18.5 之间。', 'A lighter cup: a ratio between 1:17.5 and 1:18.5.'),
        target: { ratioMin: 17.5, ratioMax: 18.5 },
        success: L('更多的水，更轻盈的口感。有些人就喜欢这样。', 'More water, a lighter body. Some people prefer exactly this.'),
      },
      {
        id: 'ch-small',
        prompt: L('只冲一小杯：用 10 g 粉，比例约 1:16。', 'Just a small cup: 10 g of coffee at about 1:16.'),
        target: { ratioMin: 15.5, ratioMax: 16.5, doseG: [9.5, 10.5] },
        success: L('10 g → 约 160 g 水。', '10 g → about 160 g of water.'),
      },
    ],
  },
  {
    id: 'po-ratio-bloom-order',
    lessonId: 'po-ratio-bloom',
    kind: 'sequence',
    title: L('一次手冲的顺序', 'Pour-Over in Order'),
    objectiveIds: ['po.ratio-bloom'],
    supportedModes: SPATIAL_OK,
    prompt: L('把冲一杯手冲的步骤按顺序排好。', 'Put the steps of brewing a pour-over in order.'),
    hint: L(
      '冲洗滤纸需要热水；咖啡粉放好、秤归零之后才开始闷蒸；清洁在最后。',
      'Rinsing the filter needs hot water; the bloom starts only after the coffee is in and the scale is zeroed; cleaning is last.',
    ),
    steps: [
      {
        id: 'heat',
        text: L('烧水', 'Heat the water'),
        why: L('后面冲洗滤纸和冲煮都需要热水，先烧上最省时间。', 'You need hot water for rinsing and brewing, so start it first.'),
      },
      {
        id: 'rinse',
        text: L('滤纸放入滤杯，用热水冲洗，倒掉冲洗水', 'Put the filter in the dripper, rinse with hot water, discard the rinse water'),
        why: L('去掉纸味、预热器具；倒掉冲洗水避免冲淡咖啡。', 'Removes paper taste and preheats; discarding the water keeps it out of your coffee.'),
      },
      {
        id: 'grind',
        text: L('研磨称好的咖啡豆，倒进滤纸并轻轻摇平', 'Grind the weighed beans, add them to the filter and shake level'),
        why: L('尽量在冲煮前才研磨，香气保留更多；平整的粉床让水流更均匀。', 'Grinding just before brewing keeps aroma; a level bed helps water flow evenly.'),
      },
      {
        id: 'tare',
        text: L('整套器具放上秤，归零，准备计时', 'Set everything on the scale, tare to zero, ready the timer'),
        why: L('从零开始才能准确知道倒了多少水。', 'Starting from zero means you know exactly how much water goes in.'),
      },
      {
        id: 'bloom',
        text: L('开始计时，闷蒸：倒入约粉量 2–3 倍的水，等待', 'Start the timer and bloom: pour about 2–3× the dose in water, then wait'),
        why: L('让气体先排出，后面的水才能均匀地接触咖啡。', 'Lets gas escape so later water can reach the coffee evenly.'),
      },
      {
        id: 'pour',
        text: L('分段或连续注水，直到目标重量', 'Pour in stages or continuously up to the target weight'),
        why: L('稳定、轻柔的注水让萃取更均匀。', 'Steady, gentle pouring keeps extraction even.'),
      },
      {
        id: 'drawdown',
        text: L('等水完全滴完，记下总时间', 'Let it drain completely and note the total time'),
        why: L('总时间是下一次调整研磨的重要线索。', 'Total time is a key clue for adjusting grind next time.'),
      },
      {
        id: 'serve',
        text: L('移开滤杯，摇匀咖啡，品尝', 'Remove the dripper, swirl the coffee, taste'),
        why: L('先滴下和后滴下的咖啡浓度不同，摇匀才均衡。', 'Early and late drips differ in strength; swirling evens them out.'),
      },
      {
        id: 'clean',
        text: L('丢掉滤纸和咖啡渣，冲洗器具', 'Discard the filter and grounds, rinse the gear'),
        why: L('残留油脂会让下一杯有陈旧味。咖啡渣可以堆肥。', 'Leftover oils make the next cup taste stale. Grounds can go in compost.'),
      },
    ],
    misconceptions: [
      {
        earlierStep: 'rinse',
        laterStep: 'grind',
        feedback: L(
          '咖啡粉放进去之后再冲洗滤纸，会把咖啡粉也冲湿、冲出味道。先冲洗，再放粉。',
          'Rinsing after the coffee is in would wash the grounds too. Rinse first, then add coffee.',
        ),
      },
      {
        earlierStep: 'tare',
        laterStep: 'bloom',
        feedback: L('没归零就开始闷蒸，你就不知道倒了多少水。', 'Bloom before taring and you won’t know how much water went in.'),
      },
      {
        earlierStep: 'bloom',
        laterStep: 'pour',
        feedback: L(
          '一下子把水全倒进去会让气体把水推开，咖啡粉湿得不均匀。先闷蒸。',
          'Pouring all the water at once lets escaping gas push water away and wet the coffee unevenly. Bloom first.',
        ),
      },
      {
        earlierStep: 'drawdown',
        laterStep: 'serve',
        feedback: L('还在滴就移开滤杯，杯里的咖啡会偏淡，也会滴得到处都是。', 'Removing the dripper mid-drip leaves your cup weaker and drips everywhere.'),
      },
    ],
  },
  {
    id: 'po-ratio-bloom-xr',
    lessonId: 'po-ratio-bloom',
    kind: 'spatial-practice',
    missionId: 'pourover-bloom',
    title: L('虚拟手冲台：闷蒸与分段注水', 'Virtual Pour-over: Bloom and Staged Pours'),
    intro: L(
      '在虚拟手冲台上按顺序冲一杯：冲洗滤纸、加 15 g 粉、去皮、闷蒸，再分段注水到 250 g。',
      'Brew one cup at a virtual pour-over station: rinse the filter, add 15 g of coffee, tare, bloom, then pour in stages to 250 g.',
    ),
    objectiveIds: ['po.ratio-bloom'],
    supportedModes: ['xr', 'desktop', 'mobile'],
    summary: L(
      '水壶倾斜决定水流，瞄准位置决定水落在粉层还是滤纸壁上；秤会显示你倒了多少水，结束时会算出你的粉水比。可选“引导 / 辅助 / 独立”三档提示；用键盘操作列表时可以“定量注水”，不需要掐准时机。',
      'Kettle tilt sets the flow and your aim decides whether water lands on the bed or the filter wall; the scale shows how much you poured, and the end screen works out your ratio. Choose guided, assisted or independent cues; with the keyboard action list you can use measured pours, so no split-second timing is needed.',
    ),
    limits: L(
      '这里练习的是手冲顺序、闷蒸和看秤注水到目标重量。水流只是示意模型，不是流体模拟，也不能预测味道；它无法模拟真实水壶的重量、平衡、热度和手上的注水控制，也无法反映你自己滤杯的滴滤速度。',
      'This practises pour-over order, the bloom and pouring to a target weight on the scale. The flow is an illustrative model, not fluid physics, and cannot predict taste; it cannot reproduce a real kettle’s weight, balance and heat, real hand pour control, or how your own dripper drains.',
    ),
    safetyNotes: [
      L(
        '使用头显时请清理周围空间，可坐着玩；感到不适随时摘下休息。',
        'With a headset, clear the space around you; seated play is fine. Take it off and rest whenever you feel uncomfortable.',
      ),
    ],
  },
  {
    id: 'po-ratio-bloom-quiz',
    lessonId: 'po-ratio-bloom',
    kind: 'quiz',
    title: L('小测：比例与闷蒸', 'Quick Check: Ratio and Bloom'),
    objectiveIds: ['po.ratio-bloom'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-18-15',
        prompt: L('18 g 粉，想要 1:15，需要多少水？', '18 g of coffee at 1:15. How much water?'),
        options: [
          { id: '270', text: L('270 g', '270 g'), correct: true, feedback: L('对：18 × 15 = 270。', 'Right: 18 × 15 = 270.') },
          {
            id: '33',
            text: L('33 g', '33 g'),
            correct: false,
            feedback: L('这是 18 + 15。比例要用乘法。', 'That’s 18 + 15. Ratios use multiplication.'),
          },
          {
            id: '250',
            text: L('250 g', '250 g'),
            correct: false,
            feedback: L('250 g 是 15 g 粉时的示意配方。粉量变了，水也要变。', '250 g goes with the 15 g example. Change the dose, change the water.'),
          },
        ],
        explanation: L('水 = 粉量 × 比例数。', 'Water = dose × ratio number.'),
      },
      {
        id: 'q-bloom-amount',
        prompt: L('15 g 粉，闷蒸大约倒多少水比较合适？', 'For 15 g of coffee, roughly how much water for the bloom?'),
        options: [
          {
            id: '30-45',
            text: L('约 30–45 g', 'About 30–45 g'),
            correct: true,
            feedback: L('对：约粉量的 2–3 倍，足够浇湿所有咖啡粉。', 'Right: about 2–3× the dose — enough to wet all the grounds.'),
          },
          {
            id: '250',
            text: L('一次倒满 250 g', 'All 250 g at once'),
            correct: false,
            feedback: L('那就跳过闷蒸了。先用少量水让气体排出。', 'That skips the bloom. Use a little water first to let gas escape.'),
          },
          {
            id: '5',
            text: L('约 5 g', 'About 5 g'),
            correct: false,
            feedback: L('太少了，咖啡粉会有干的地方。', 'Too little — some grounds would stay dry.'),
          },
        ],
        explanation: L('闷蒸 = 少量水 + 短暂等待。', 'Bloom = a little water + a short wait.'),
      },
      {
        id: 'q-why-bloom',
        prompt: L('闷蒸主要是为了？', 'What is the bloom mainly for?'),
        options: [
          {
            id: 'gas',
            text: L('让二氧化碳排出，之后水能均匀接触咖啡', 'Let carbon dioxide escape so later water reaches the coffee evenly'),
            correct: true,
            feedback: L('对。', 'Correct.'),
          },
          {
            id: 'cool',
            text: L('让咖啡降温', 'To cool the coffee down'),
            correct: false,
            feedback: L('闷蒸不是为了降温，而是为了排气和均匀浸湿。', 'It isn’t about cooling — it’s about degassing and even wetting.'),
          },
          {
            id: 'paper',
            text: L('只有用纸滤时才需要', 'Only needed with paper filters'),
            correct: false,
            feedback: L('排气与滤材无关，新鲜咖啡都会排气。', 'Degassing has nothing to do with the filter; all fresh coffee releases gas.'),
          },
        ],
        explanation: L('越新鲜的豆子，闷蒸越明显。', 'The fresher the beans, the more visible the bloom.'),
      },
      {
        id: 'q-correct-ratio',
        prompt: L('“1:16 是手冲唯一正确的比例”——这句话对吗？', '"1:16 is the only correct pour-over ratio." True?'),
        options: [
          {
            id: 'start',
            text: L('不对，它只是一个常见起点', 'No — it’s just a common starting point'),
            correct: true,
            feedback: L('对。很多人喜欢 1:15，也有人喜欢 1:18。', 'Right. Some love 1:15, others 1:18.'),
          },
          {
            id: 'true',
            text: L('对，其他比例都是错的', 'Yes — other ratios are wrong'),
            correct: false,
            feedback: L('比例是口味选择，不是对错题。', 'Ratio is a taste choice, not a right-or-wrong answer.'),
          },
        ],
        explanation: L('起点帮你开始，口味帮你决定。', 'Starting points get you going; taste decides.'),
      },
    ],
  },

  // ═════════════════════ po-first-real-cup ═════════════════════
  {
    id: 'po-first-real-cup-cards',
    lessonId: 'po-first-real-cup',
    kind: 'explain',
    title: L('开始之前', 'Before You Brew'),
    objectiveIds: ['po.real-cup'],
    supportedModes: REAL_WORLD,
    cards: [
      {
        heading: L('准备好器具', 'Set out your kit'),
        body: L(
          '细口壶（或普通水壶）、滤杯和滤纸、分享壶或马克杯、电子秤、磨豆机、新鲜咖啡豆。把滤杯稳稳地放在壶或杯子上，手机放在不会溅到水的地方。',
          'Gooseneck (or regular) kettle, dripper and filter, carafe or mug, scale, grinder and fresh beans. Seat the dripper firmly on the carafe or mug, and keep your phone somewhere dry.',
        ),
        illustration: 'kit-pourover',
      },
      {
        heading: L('热水安全', 'Hot water safety'),
        body: L(
          '水壶不要装太满，倒水时握住把手、慢慢倒、远离身体。滤杯和分享壶在冲煮中会变烫。孩子和宠物远离操作区。',
          'Don’t overfill the kettle; hold the handle and pour slowly, away from your body. The dripper and carafe get hot while brewing. Keep children and pets clear.',
        ),
        illustration: 'hazard-heat',
        callout: { kind: 'safety', text: HOT_WATER },
      },
      {
        heading: L('数据，而不是考试', 'Data, not a test'),
        body: L(
          '第一杯是你的“基准”。App 看不到也尝不到你的咖啡——你记录的数字和感受都是自我报告，也正是改进下一杯的依据。',
          'Your first cup is your baseline. The app can’t see or taste your coffee — the numbers and impressions you log are self-reported, and they’re exactly what you’ll improve from.',
        ),
        illustration: 'journal',
      },
    ],
  },
  {
    id: 'po-first-real-cup-ready',
    lessonId: 'po-first-real-cup',
    kind: 'quiz',
    title: L('准备好了吗？三个快问', 'Ready? Three Quick Checks'),
    objectiveIds: ['po.real-cup'],
    supportedModes: ['desktop', 'mobile', 'real-world-guide'],
    questions: [
      {
        id: 'q-safe-pour',
        prompt: L('哪种做法最安全？', 'Which setup is safest?'),
        options: [
          {
            id: 'stable',
            text: L('滤杯稳稳放在分享壶上，握住壶柄慢慢倒', 'Dripper seated firmly on the carafe; hold the kettle handle and pour slowly'),
            correct: true,
            feedback: L('对。稳定的器具和慢速注水能避免打翻和烫伤。', 'Right. A stable setup and slow pour prevent spills and scalds.'),
          },
          {
            id: 'hand-held',
            text: L('一手拿着滤杯悬在杯子上，一手倒水', 'Hold the dripper over a mug with one hand and pour with the other'),
            correct: false,
            feedback: L('滤杯会变烫、容易晃，热水可能直接倒在手上。', 'The dripper gets hot and wobbles; hot water could land on your hand.'),
          },
          {
            id: 'full',
            text: L('水壶装到最满，一次烧够', 'Fill the kettle to the brim to boil enough at once'),
            correct: false,
            feedback: L('太满的水壶沸腾时可能溢出，倒水也难控制。', 'An overfull kettle can spit when boiling and is hard to pour with control.'),
          },
        ],
        explanation: L('稳定的器具 + 慢慢倒 = 安全。', 'Stable gear + slow pouring = safe.'),
      },
      {
        id: 'q-temp',
        prompt: L('没有温度计，水刚烧开，怎么做比较合适？', 'No thermometer and the water just boiled. What’s a sensible approach?'),
        options: [
          {
            id: 'wait',
            text: L('等约 30 秒再开始', 'Wait about 30 seconds, then start'),
            correct: true,
            feedback: L('对，这是常见的简单做法，大约落在 90–96 °C。', 'Yes — a common simple approach, landing roughly around 90–96 °C.'),
          },
          {
            id: 'cool',
            text: L('等到可以直接喝的温度', 'Wait until it’s cool enough to drink'),
            correct: false,
            feedback: L('水太凉会萃取不足，咖啡常偏酸、单薄。', 'Water that cool under-extracts — often sour and thin.'),
          },
          {
            id: 'reboil',
            text: L('反复煮沸几次', 'Boil it several more times'),
            correct: false,
            feedback: L('没有必要，也不会让咖啡更好喝。', 'Unnecessary — it won’t improve the coffee.'),
          },
        ],
        explanation: L('“刚离火”是常见起点。', '"Just off the boil" is a common start.'),
      },
      {
        id: 'q-self-report',
        prompt: L('App 会自动知道你的这杯手冲做得怎么样吗？', 'Will the app automatically know how your pour-over went?'),
        options: [
          {
            id: 'no',
            text: L('不会。我自己测量、品尝并记录，它是自我报告', 'No. I measure, taste and log it myself — it’s self-reported'),
            correct: true,
            feedback: L('对。Coffee Lab 不会假装能看见或尝到你的咖啡。', 'Correct. Coffee Lab never pretends to see or taste your coffee.'),
          },
          {
            id: 'yes',
            text: L('会，App 能检测', 'Yes, the app detects it'),
            correct: false,
            feedback: L('App 没有传感器，无法观察你的真实操作和味道。', 'The app has no sensors; it can’t observe your real actions or taste.'),
          },
        ],
        explanation: L('诚实的记录才是有用的记录。', 'Honest logs are useful logs.'),
      },
    ],
  },
  {
    id: 'po-first-real-cup-guide',
    lessonId: 'po-first-real-cup',
    kind: 'guided-practice',
    title: L('真实操作：第一杯手冲', 'Real-World Guide: Your First Pour-Over'),
    intro: L(
      '一步一步来。每步完成后点“完成”，需要时点“求助”。计时器由你自己开始，所有完成都是自我报告。',
      'One step at a time. Tap "Done" after each step or "Help" when you need it. You start the timers yourself; everything here is self-reported.',
    ),
    objectiveIds: ['po.real-cup'],
    supportedModes: REAL_WORLD,
    safetyNotes: [HOT_WATER, GRINDER_SAFE],
    equipment: ['gooseneck-kettle', 'dripper', 'paper-filter', 'carafe', 'scale', 'grinder', 'mug'],
    recipe: {
      doseG: 15,
      outG: 250,
      ratioLabel: L('约 1:17（250 ÷ 15 ≈ 16.7）', 'About 1:17 (250 ÷ 15 ≈ 16.7)'),
      note: L(
        '示意起点，不是唯一正确的配方。你的滤杯或豆子包装可能建议不同的比例；想冲更大一杯，保持比例等比放大即可。',
        'An illustrative start, not the one right recipe. Your dripper or bean bag may suggest a different ratio; for a bigger cup, scale both numbers.',
      ),
      targetTimeSec: [150, 240],
    },
    steps: [
      {
        id: 'heat',
        text: L('烧水：刚离火（约 90–96 °C，或水开后等约 30 秒）', 'Heat water to just off the boil (about 90–96 °C, or ~30 s after boiling)'),
        safety: L('水壶放在平稳处，壶嘴的蒸汽也会烫。', 'Keep the kettle on a stable surface; steam from the spout burns too.'),
        help: L('用普通水壶也可以，之后倒水时要更慢、更小心。', 'A regular kettle is fine — just pour more slowly and carefully later.'),
        illustration: 'kettle-temp',
      },
      {
        id: 'weigh',
        text: L('称 15 g 咖啡豆', 'Weigh 15 g of beans'),
        help: L('容器放上秤，按去皮归零，再倒豆子。', 'Put a container on the scale, tare it, then add the beans.'),
      },
      {
        id: 'rinse',
        text: L('滤纸放进滤杯，滤杯放在分享壶上；用热水冲洗滤纸，然后倒掉壶里的水', 'Put the filter in the dripper on the carafe; rinse it with hot water, then pour that water away'),
        safety: L('分享壶和滤杯会变烫，倒水时握住把手。', 'The carafe and dripper get hot — use the handle when tipping out the water.'),
        help: L('锥形滤纸可以沿接缝折一下，更贴合滤杯。', 'Folding a cone filter along its seam helps it sit snugly.'),
        illustration: 'filter-rinse',
      },
      {
        id: 'grind',
        text: L('中等偏细研磨（大致像细盐粒）', 'Grind medium-fine (roughly like table salt)'),
        safety: GRINDER_SAFE,
        help: L(
          '如果磨豆机标注了“手冲/滤泡”范围，从中间开始。之后根据总时间调粗或调细。',
          'If your grinder marks a pour-over/filter range, start in the middle. Adjust coarser or finer later based on total time.',
        ),
        illustration: 'grind-size-scale',
      },
      {
        id: 'load',
        text: L('倒入咖啡粉，轻轻摇平；整套放上秤，归零', 'Add the grounds and shake gently to level; put everything on the scale and tare'),
        help: L('可以在粉床中间用手指轻轻戳个小坑，帮助闷蒸时均匀浸湿。', 'A small dimple in the centre of the bed can help the bloom wet evenly.'),
      },
      {
        id: 'bloom',
        text: L('开始计时；慢慢倒入约 40 g 水，浇湿所有咖啡粉，等待', 'Start the timer; slowly pour about 40 g of water to wet all the grounds, then wait'),
        detail: L('约粉量的 2.5 倍，等 30–45 秒。', 'About 2.5× the dose; wait 30–45 seconds.'),
        timerSec: 40,
        safety: L('慢慢倒，远离身体。', 'Pour slowly, away from your body.'),
        help: L('有干的粉块？轻轻摇一下滤杯，或补一点水把它浇湿。', 'Dry clumps? Give the dripper a gentle swirl or add a splash to wet them.'),
        illustration: 'bloom',
      },
      {
        id: 'pour-1',
        text: L('从中间以小圆圈慢慢注水，到约 150 g', 'Pour slowly in small circles from the centre up to about 150 g'),
        detail: L('大约在 1 分 15 秒左右到达，不必精确。', 'Reach it around 1:15 — no need to be exact.'),
        help: L('尽量不要直接冲到滤纸壁上，那里的水会绕过咖啡粉。', 'Avoid pouring straight onto the filter walls — that water bypasses the coffee.'),
        illustration: 'pour-stages',
      },
      {
        id: 'pour-2',
        text: L('水位降下一些后，继续注水到 250 g', 'Once the level drops a little, continue pouring to 250 g'),
        detail: L('大约在 2 分钟前后完成注水。', 'Aim to finish pouring around 2:00.'),
        help: L('倒过头了也没关系，记下实际重量就好。', 'Overshot? No problem — just note the actual weight.'),
      },
      {
        id: 'drawdown',
        text: L('等水完全滴完，记下总时间', 'Let it drain completely and note the total time'),
        detail: L('很多人在约 2 分 30 秒到 4 分钟之间完成（示意，随滤杯和手法变化）。', 'Many finish somewhere around 2:30–4:00 (illustrative; varies with dripper and technique).'),
        help: L(
          '远早于 2 分钟：下次调细一点；超过 4 分 30 秒还没滴完：下次调粗一点。一次只改这一项。',
          'Done well before 2:00? Grind a little finer next time. Still dripping after 4:30? A little coarser. Change only that.',
        ),
      },
      {
        id: 'taste',
        text: L('移开滤杯，摇匀咖啡，倒一杯；稍凉后再尝几次', 'Remove the dripper, swirl, pour a cup; taste again as it cools'),
        safety: L('分享壶很烫，握住把手。', 'The carafe is hot — use the handle.'),
        help: L('说不清味道没关系，先给个 1–5 分的喜欢程度，再试着选一两个词。', 'Can’t describe it yet? Rate how much you like it 1–5, then try one or two words.'),
        illustration: 'taste-compass',
      },
      {
        id: 'clean',
        text: L('丢掉滤纸和咖啡渣，冲洗滤杯和分享壶', 'Discard the filter and grounds, rinse the dripper and carafe'),
        help: L('咖啡渣可以堆肥或丢进厨余垃圾。', 'Grounds can go in compost or food waste.'),
      },
    ],
    logFields: ['doseG', 'outG', 'timeSec', 'grind', 'taste', 'rating', 'notes'],
  },
  {
    id: 'po-first-real-cup-reflect',
    lessonId: 'po-first-real-cup',
    kind: 'reflect',
    title: L('第一杯之后', 'After Your First Cup'),
    supportedModes: REFLECT,
    prompts: [
      L('你的粉量、水量和总时间是多少？比例是多少？', 'What were your dose, water and total time? What ratio is that?'),
      L('热的时候和凉一些的时候，味道有什么不同？', 'How did it taste hot versus a bit cooler?'),
      L('哪一步最难？下次你想怎么做？', 'Which step was hardest? What will you try next time?'),
    ],
  },

  // ═════════════════════ po-taste-iterate ═════════════════════
  {
    id: 'po-taste-iterate-cards',
    lessonId: 'po-taste-iterate',
    kind: 'explain',
    title: L('品尝与改进', 'Tasting and Improving'),
    objectiveIds: ['po.iterate'],
    supportedModes: CONCEPT,
    cards: [
      {
        heading: L('分三次品尝', 'Taste in three passes'),
        body: L(
          '刚冲好时尝一口，温热时再尝，快凉时再尝。随着温度下降，酸质和甜感往往更容易分辨，缺点也更明显。每次只问自己一个问题：浓还是淡？酸还是苦？喜欢吗？',
          'Taste when it’s hot, again when warm, and again when nearly cool. As it cools, acidity and sweetness are often easier to notice — and so are flaws. Ask one question each time: strong or weak? sour or bitter? do I like it?',
        ),
        illustration: 'taste-three-temps',
      },
      {
        heading: L('先分清“浓淡”和“酸苦”', 'Separate strength from extraction'),
        body: L(
          '太淡、水感，或太浓、太重：通常先调比例（粉量或水量）。偏尖酸、单薄，或偏苦、发干：通常调研磨（有时也可以调水温）。先判断问题属于哪一类，就知道该拧哪个旋钮。',
          'Too weak and watery, or too strong and heavy: usually adjust the ratio (dose or water). Sharp-sour and thin, or bitter and dry: usually adjust grind (sometimes temperature). Decide which kind of problem it is, and you’ll know which dial to turn.',
        ),
        illustration: 'strength-vs-extraction',
        callout: {
          kind: 'illustrative',
          text: L('这些是经验规律；豆子、烘焙和你的口味都会改变结果。', 'These are rules of thumb; beans, roast and your taste all change the outcome.'),
        },
      },
      {
        heading: L('一次只改一处，并写下来', 'One change, written down'),
        body: L(
          '在记录里写下：粉量、水量、总时间、研磨格数、两三个味道词、喜欢程度，以及下次只改的一件事。下一杯冲完，对比两次记录，你就真正学到了东西。',
          'Log: dose, water, total time, grind setting, two or three taste words, a rating, and the ONE thing you’ll change next time. After the next cup, compare the two entries — that’s where real learning happens.',
        ),
        illustration: 'journal',
      },
      {
        heading: L('你的口味说了算', 'Your taste decides'),
        body: L(
          '有人喜欢清淡明亮，有人喜欢浓郁厚重。研究也发现，消费者的偏好会分成不同群体，没有一个对所有人都最好的数字。目标是你喜欢的那一杯。',
          'Some people love light and bright, others rich and heavy. Research has found consumer preferences split into different groups — no single number is best for everyone. The goal is the cup you enjoy.',
        ),
        illustration: 'preference',
        callout: { kind: 'myth', text: L('误区：“专家的配方一定比我的好喝”。', 'Myth: "an expert’s recipe will always taste better to me."') },
      },
    ],
  },
  {
    id: 'po-taste-iterate-scenarios',
    lessonId: 'po-taste-iterate',
    kind: 'diagnose',
    title: L('品尝情景（示意）', 'Tasting Scenarios (Illustrative)'),
    intro: L('以下都是假设的一杯手冲。每次只选一个下一杯要改的地方。', 'These are hypothetical cups. For each, choose ONE change for next time.'),
    objectiveIds: ['po.iterate'],
    supportedModes: CONCEPT,
    scenarios: [
      {
        id: 'fast-sour',
        situation: L('水很快就滴完了，咖啡喝起来尖酸、单薄。', 'The water drained very quickly, and the coffee tastes sharp-sour and thin.'),
        observations: { doseG: 15, outG: 250, timeSec: 105, taste: L('尖酸、单薄', 'sour, thin') },
        choices: [
          {
            id: 'finer',
            text: L('把研磨调细一点', 'Grind a little finer'),
            quality: 'best',
            feedback: L('很好：更细的粉让水流慢下来、萃取更多。', 'Good: finer grounds slow the flow and extract more.'),
          },
          {
            id: 'hotter',
            text: L('用更热的水（如果你之前等了很久才冲）', 'Use hotter water (if you’d let it cool a lot before)'),
            quality: 'reasonable',
            feedback: L(
              '可能有帮助，尤其是浅烘豆。但这么快的流速，研磨通常是更主要的原因。',
              'Could help, especially with light roasts. But with flow this fast, grind is usually the bigger cause.',
            ),
          },
          {
            id: 'everything',
            text: L('同时换豆子、调细研磨、改比例', 'Switch beans, grind finer and change the ratio together'),
            quality: 'unhelpful',
            feedback: L('改太多，就算变好了也不知道为什么。', 'Too many changes — even if it improves, you won’t know why.'),
          },
        ],
        caveat: L('有些浅烘豆本身就很明亮。如果你喜欢这种明亮，也许不需要改。', 'Some light roasts are naturally bright. If you enjoy that brightness, maybe nothing needs fixing.'),
      },
      {
        id: 'slow-bitter',
        situation: L('水很久才滴完，咖啡喝起来苦、发干、有点涩。', 'It took a long time to drain, and the coffee tastes bitter, dry and a little harsh.'),
        observations: { doseG: 15, outG: 250, timeSec: 330, taste: L('苦、发干', 'bitter, dry') },
        choices: [
          {
            id: 'coarser',
            text: L('把研磨调粗一点', 'Grind a little coarser'),
            quality: 'best',
            feedback: L('对：更粗的粉让水流更快、萃取更少。', 'Right: coarser grounds flow faster and extract less.'),
          },
          {
            id: 'cooler',
            text: L('用稍低一点的水温（尤其是深烘豆）', 'Use slightly cooler water (especially for dark roasts)'),
            quality: 'reasonable',
            feedback: L('可能会柔和一些，但太慢的流速通常首先指向研磨。', 'May soften it, but very slow flow usually points to grind first.'),
          },
          {
            id: 'finer',
            text: L('把研磨调细', 'Grind finer'),
            quality: 'unhelpful',
            feedback: L('这会更慢、可能更苦，方向反了。', 'That makes it slower and likely more bitter — wrong direction.'),
          },
        ],
        caveat: L('很深的烘焙怎么冲都可能偏苦；苦的敏感度也因人而异。', 'Very dark roasts can taste bitter however you brew; sensitivity to bitterness varies.'),
      },
      {
        id: 'weak',
        situation: L('时间正常，味道也挺舒服，但整体太淡、像水。', 'Time is normal and the flavors are pleasant, but it’s too weak and watery overall.'),
        observations: { doseG: 15, outG: 250, timeSec: 190, taste: L('淡、水感', 'weak, watery') },
        choices: [
          {
            id: 'stronger-ratio',
            text: L('水量不变，粉量加到约 16–17 g（比例更浓）', 'Keep the water, raise the dose to about 16–17 g (stronger ratio)'),
            quality: 'best',
            feedback: L('对：浓度主要由比例决定。味道舒服，说明萃取可能已经不错。', 'Right: strength is mostly the ratio. Pleasant flavors suggest extraction may already be fine.'),
          },
          {
            id: 'finer',
            text: L('把研磨调细一点', 'Grind a little finer'),
            quality: 'reasonable',
            feedback: L('会稍微增加浓度，但也会改变萃取和时间。先改比例更直接。', 'It raises strength a bit but also changes extraction and time. Changing the ratio is more direct.'),
          },
          {
            id: 'more-water',
            text: L('多倒一些水', 'Pour more water'),
            quality: 'unhelpful',
            feedback: L('更多的水只会更淡。', 'More water only makes it weaker.'),
          },
        ],
        caveat: L('“淡”是个人感受：有人恰好喜欢更清淡的一杯。', '"Weak" is personal — some people prefer a lighter cup.'),
      },
      {
        id: 'too-strong',
        situation: L('你这次只倒了 200 g 水。味道平衡，但太浓、太重。', 'This time you only poured 200 g of water. It’s balanced, but too strong and heavy.'),
        observations: { doseG: 15, outG: 200, timeSec: 160, taste: L('浓、厚重', 'strong, heavy') },
        choices: [
          {
            id: 'more-water',
            text: L('下次倒到约 250 g（或现在往杯里加一点热水）', 'Pour to about 250 g next time (or add a splash of hot water to this cup now)'),
            quality: 'best',
            feedback: L('对：加水能直接降低浓度。往杯里兑一点热水也是完全可以的。', 'Right: more water lowers strength directly. Topping up the cup with hot water is perfectly valid too.'),
          },
          {
            id: 'less-dose',
            text: L('水量不变，粉量减少到约 12–13 g', 'Keep 200 g of water, reduce the dose to about 12–13 g'),
            quality: 'reasonable',
            feedback: L('比例同样会变淡，只是杯量更小。', 'That also lightens the ratio — just a smaller cup.'),
          },
          {
            id: 'finer',
            text: L('把研磨调细', 'Grind finer'),
            quality: 'unhelpful',
            feedback: L('调细通常会让它更浓、更重，方向反了。', 'Finer usually makes it stronger and heavier — wrong direction.'),
          },
        ],
        caveat: L('喜欢浓一点也完全没问题——只要是你想要的。', 'Liking it strong is completely fine — if that’s what you want.'),
      },
      {
        id: 'enjoy',
        situation: L('时间和配方都和你的起点差不多，你觉得甜、干净，很喜欢。', 'Time and recipe are close to your start, and it tastes sweet and clean to you. You love it.'),
        observations: { doseG: 15, outG: 250, timeSec: 195, taste: L('甜、干净', 'sweet, clean') },
        choices: [
          {
            id: 'log',
            text: L('把这次的全部参数和研磨格数记下来，作为你的基准', 'Log every number and the grind setting as your baseline'),
            quality: 'best',
            feedback: L('对！喜欢就是目标，记录让你能重复它。', 'Yes! Enjoying it is the goal; logging lets you repeat it.'),
          },
          {
            id: 'explore',
            text: L('出于好奇，下次只改一处做对比', 'Out of curiosity, change just one thing next time to compare'),
            quality: 'reasonable',
            feedback: L('很好的探索方式，只要保留这次作为对照。', 'A fine way to explore — keep this cup as your reference.'),
          },
          {
            id: 'copy',
            text: L('改成网上某位冠军的配方', 'Switch to a champion’s recipe from the internet'),
            quality: 'unhelpful',
            feedback: L('别人的配方是别人的起点；你已经找到了自己喜欢的。', 'Their recipe is their starting point; you’ve found one you enjoy.'),
          },
        ],
        caveat: L('豆子会随时间变化，同一配方过几天味道可能不同。', 'Beans change with age, so the same recipe may taste different in a few days.'),
      },
    ],
  },
  {
    id: 'po-taste-iterate-quiz',
    lessonId: 'po-taste-iterate',
    kind: 'quiz',
    title: L('小测：品尝与调整', 'Quick Check: Taste and Adjust'),
    objectiveIds: ['po.iterate'],
    supportedModes: CONCEPT,
    questions: [
      {
        id: 'q-strength-knob',
        prompt: L('哪一项最直接地改变一杯手冲的“浓度”？', 'Which most directly changes the strength of a pour-over?'),
        options: [
          {
            id: 'ratio',
            text: L('比例：粉量和水量', 'The ratio: dose and water'),
            correct: true,
            feedback: L('对。', 'Correct.'),
          },
          {
            id: 'grind',
            text: L('只有研磨', 'Only the grind'),
            correct: false,
            feedback: L('研磨主要影响萃取和时间，对浓度影响较间接。', 'Grind mainly affects extraction and time; its effect on strength is indirect.'),
          },
          {
            id: 'cup',
            text: L('杯子的颜色', 'The colour of the cup'),
            correct: false,
            feedback: L('杯子会影响感受，但不改变咖啡的实际浓度。', 'A cup can affect perception, not the coffee’s actual strength.'),
          },
        ],
        explanation: L('浓淡 → 比例；酸苦 → 研磨/水温。', 'Strength → ratio; sour/bitter → grind or temperature.'),
      },
      {
        id: 'q-cooling',
        prompt: L('为什么建议在咖啡变凉的过程中多尝几次？', 'Why taste the coffee several times as it cools?'),
        options: [
          {
            id: 'perception',
            text: L('温度会改变我们对酸、甜、苦的感受，凉一些时往往更容易分辨', 'Temperature changes how we perceive sour, sweet and bitter; it’s often easier to tell when cooler'),
            correct: true,
            feedback: L('对。这能帮你更全面地了解这杯咖啡。', 'Right. It gives you a fuller picture of the cup.'),
          },
          {
            id: 'changes-coffee',
            text: L('因为凉了以后咖啡会变浓', 'Because coffee gets stronger as it cools'),
            correct: false,
            feedback: L('浓度基本不变，变的是我们的感受。', 'Strength barely changes; our perception does.'),
          },
          {
            id: 'no-reason',
            text: L('没有特别的原因', 'There’s no particular reason'),
            correct: false,
            feedback: L('热的时候很多味道会被“掩盖”，凉一点更容易察觉。', 'Heat masks many flavors; they’re easier to notice a bit cooler.'),
          },
        ],
        explanation: L('同一杯咖啡，不同温度，会说不同的话。', 'The same cup says different things at different temperatures.'),
      },
      {
        id: 'q-preference',
        prompt: L('你喜欢 1:15 的浓郁，家人喜欢 1:17 的清淡。谁是对的？', 'You like a rich 1:15; a family member likes a lighter 1:17. Who’s right?'),
        options: [
          {
            id: 'both',
            text: L('都对，这是口味偏好', 'Both — it’s preference'),
            correct: true,
            feedback: L('对。好咖啡的标准是喝的人喜欢。', 'Right. Good coffee is coffee the drinker enjoys.'),
          },
          {
            id: 'me',
            text: L('我，浓的才是好咖啡', 'Me — strong coffee is better'),
            correct: false,
            feedback: L('浓不等于好，只是一种风格。', 'Strong isn’t better — it’s a style.'),
          },
          {
            id: 'them',
            text: L('家人，因为 1:17 更接近标准', 'Them — 1:17 is closer to the standard'),
            correct: false,
            feedback: L('参考标准是起点，不是口味的裁判。', 'Reference standards are starting points, not judges of taste.'),
          },
        ],
        explanation: L('数字帮你重复喜欢的味道，而不是告诉你应该喜欢什么。', 'Numbers help you repeat what you like — not tell you what to like.'),
      },
    ],
  },
  {
    id: 'po-taste-iterate-reflect',
    lessonId: 'po-taste-iterate',
    kind: 'reflect',
    title: L('写下你的下一杯', 'Plan Your Next Cup'),
    supportedModes: REFLECT,
    prompts: [
      L('用两三个词描述你最近的一杯手冲。', 'Describe your latest pour-over in two or three words.'),
      L('它的问题更像“浓淡”还是“酸苦”？你会拧哪个旋钮？', 'Was its issue more strength or extraction? Which dial will you turn?'),
      L('写下下一杯只改的那一件事，以及你预期会发生什么。', 'Write the ONE change for your next cup, and what you expect to happen.'),
    ],
  },
];

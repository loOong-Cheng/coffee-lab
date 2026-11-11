/**
 * Optional CULTURE track: coffee history and world traditions.
 * Owner: coffee-curriculum (atlas).
 *
 * Rules for this file: legends are labelled as legends ('myth' callouts),
 * disputed dates are given as ranges, cultures are described respectfully and
 * as varying across regions and families. Never a prerequisite for core lessons.
 */
import type { Activity, Lesson, LocalizedText, Mode, Track } from '../../domain/contracts';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });
const COG: Mode[] = ['desktop', 'mobile'];

export const track: Track = {
  id: 'culture',
  order: 5,
  title: L('咖啡文化：历史与世界传统', 'Coffee culture: history & world traditions'),
  summary: L(
    '可选旅程：从埃塞俄比亚的森林、也门的苏菲修士，到伊斯坦布尔、伦敦、维也纳、东京和香港的咖啡馆；了解意式浓缩的诞生、世界各地的咖啡仪式，以及“精品咖啡浪潮”。学会分辨历史与传说。',
    'An optional journey: from Ethiopian forests and Yemeni Sufis to the coffeehouses of Istanbul, London, Vienna, Tokyo and Hong Kong; the birth of espresso, coffee rituals around the world, and the “waves” of specialty coffee. Learn to tell history from legend.',
  ),
  lessonIds: [
    'cul-origins-legends',
    'cul-coffeehouses',
    'cul-espresso-bar',
    'cul-world-traditions',
    'cul-waves-specialty',
  ],
  optional: true,
};

export const lessons: Lesson[] = [
  {
    id: 'cul-origins-legends',
    track: 'culture',
    level: 'beginner',
    title: L('起源：历史与传说', 'Origins: history and legend'),
    goal: L(
      '能讲出咖啡从埃塞俄比亚、也门走向世界的主要脉络，按时间排序几个关键事件，并分辨哪些是有据可查的历史、哪些是传说。',
      'Trace coffee’s path from Ethiopia and Yemen to the wider world, order key events in time, and tell documented history from legend.',
    ),
    prerequisites: [],
    keyConcepts: [
      L('野生阿拉比卡源自埃塞俄比亚高地森林', 'Wild arabica comes from the Ethiopian highland forests'),
      L('牧羊人与跳舞山羊的故事是传说', 'The goatherd and dancing goats story is a legend'),
      L('最早可信的饮用证据：15 世纪也门的苏菲派', 'Earliest credible evidence of drinking: 15th-century Sufis in Yemen'),
      L('咖啡的传播与贸易、殖民和种植园劳动紧密相连', 'Coffee’s spread is tied to trade, colonialism and plantation labour'),
      L('中国云南咖啡的由来', 'How coffee came to Yunnan, China'),
    ],
    activityIds: [
      'cul-origins-legends-explain',
      'cul-origins-legends-quiz',
      'cul-origins-legends-timeline',
      'cul-origins-legends-reflect',
    ],
    checkForUnderstanding: ['cul-origins-legends-quiz', 'cul-origins-legends-timeline'],
    safetyNotes: [],
    estimatedMinutes: 15,
    sources: ['atlas-nca-history', 'atlas-wiki-history', 'atlas-yunnan-case'],
    confidence: 'verified',
    next: ['cul-coffeehouses'],
  },
  {
    id: 'cul-coffeehouses',
    track: 'culture',
    level: 'beginner',
    title: L('咖啡馆：思想与闲谈的空间', 'Coffeehouses: rooms for ideas and gossip'),
    goal: L(
      '能举例说明咖啡馆在不同城市和时代扮演的社会角色，按时间排序几座城市的早期咖啡馆，并识别维也纳咖啡馆起源中的传说成分。',
      'Give examples of the social role coffeehouses played in different cities and eras, order early coffeehouses in time, and spot the legend in Vienna’s origin story.',
    ),
    prerequisites: [],
    keyConcepts: [
      L('奥斯曼咖啡馆：“智者的学校”', 'Ottoman coffeehouses: “schools of the wise”'),
      L('伦敦的“便士大学”与劳合社', 'London’s “penny universities” and Lloyd’s'),
      L('维也纳：传说与记录', 'Vienna: legend versus record'),
      L('东京的喫茶店与香港的茶餐厅', 'Tokyo’s kissaten and Hong Kong’s cha chaan teng'),
      L('咖啡馆作为家和工作之外的“第三空间”', 'The café as a “third place” beyond home and work'),
    ],
    activityIds: [
      'cul-coffeehouses-explain',
      'cul-coffeehouses-timeline',
      'cul-coffeehouses-quiz',
      'cul-coffeehouses-reflect',
    ],
    checkForUnderstanding: ['cul-coffeehouses-timeline', 'cul-coffeehouses-quiz'],
    safetyNotes: [],
    estimatedMinutes: 15,
    sources: ['atlas-wiki-coffeehouse', 'atlas-nca-history', 'atlas-japan-kissaten', 'atlas-hk-milk-tea'],
    confidence: 'verified',
    next: ['cul-espresso-bar'],
  },
  {
    id: 'cul-espresso-bar',
    track: 'culture',
    level: 'beginner',
    title: L('意式浓缩与意大利吧台', 'Espresso and the Italian bar'),
    goal: L(
      '能按时间排列意式咖啡机发展的几个关键节点，解释油脂从何而来，并纠正关于浓缩咖啡的常见误解。',
      'Order key milestones in espresso machine history, explain where crema comes from, and correct common espresso misconceptions.',
    ),
    prerequisites: [],
    keyConcepts: [
      L('浓缩是一种冲煮方法，不是一种豆子', 'Espresso is a brewing method, not a bean'),
      L('从蒸汽机器到拉杆，再到电动泵', 'From steam machines to levers to electric pumps'),
      L('拉杆机器的高压带来了油脂', 'High-pressure lever machines brought crema'),
      L('摩卡壶把浓咖啡带进了意大利家庭', 'The moka pot brought strong coffee into Italian homes'),
      L('吧台习俗是文化习惯，不是规则', 'Bar customs are habits, not rules'),
    ],
    activityIds: [
      'cul-espresso-bar-explain',
      'cul-espresso-bar-timeline',
      'cul-espresso-bar-quiz',
      'cul-espresso-bar-reflect',
    ],
    checkForUnderstanding: ['cul-espresso-bar-timeline', 'cul-espresso-bar-quiz'],
    safetyNotes: [],
    estimatedMinutes: 15,
    sources: ['atlas-wiki-espresso-machine', 'atlas-bialetti', 'atlas-wiki-cappuccino', 'atlas-practice-consensus'],
    confidence: 'verified',
    next: ['cul-world-traditions'],
  },
  {
    id: 'cul-world-traditions',
    track: 'culture',
    level: 'beginner',
    title: L('世界各地的咖啡传统', 'Coffee traditions around the world'),
    goal: L(
      '能描述至少三种咖啡传统的特点与礼仪（如土耳其、阿拉伯、埃塞俄比亚、越南、香港、墨西哥），排出土耳其咖啡的制作顺序，并理解各地做法因地区和家庭而异。',
      'Describe the character and etiquette of at least three coffee traditions (e.g. Turkish, Arabic, Ethiopian, Vietnamese, Hong Kong, Mexican), order the steps of Turkish coffee, and appreciate that practices vary by region and family.',
    ),
    prerequisites: [],
    keyConcepts: [
      L('土耳其咖啡文化（联合国教科文组织非遗，2013）', 'Turkish coffee culture (UNESCO intangible heritage, 2013)'),
      L('阿拉伯咖啡：慷慨的象征（2015 年列入，2024 年扩展）', 'Arabic coffee, a symbol of generosity (inscribed 2015, extended 2024)'),
      L('埃塞俄比亚咖啡仪式的三轮', 'The three rounds of the Ethiopian coffee ceremony'),
      L('越南滴滤、香港鸳鸯、墨西哥陶罐咖啡、瑞典 fika', 'Vietnamese phin, Hong Kong yuenyeung, Mexican café de olla, Swedish fika'),
      L('尊重差异：没有唯一正宗的做法', 'Respect variation: there is no single authentic way'),
    ],
    activityIds: [
      'cul-world-traditions-explain',
      'cul-world-traditions-turkish-steps',
      'cul-world-traditions-quiz',
      'cul-world-traditions-reflect',
    ],
    checkForUnderstanding: ['cul-world-traditions-turkish-steps', 'cul-world-traditions-quiz'],
    safetyNotes: [
      L('炉上煮咖啡（土耳其咖啡、陶罐咖啡等）容易溢出：全程看着火，只握把手。', 'Stovetop coffees (Turkish, café de olla…) can boil over: stay with the pot and hold handles only.'),
      L('传统釉面陶器可能含铅；无法确认无铅时，用普通锅具煮和盛装。', 'Some traditional glazed pottery can leach lead; unless confirmed lead-free, use ordinary cookware for brewing and serving.'),
    ],
    estimatedMinutes: 20,
    sources: [
      'atlas-unesco-turkish',
      'atlas-unesco-arabic',
      'atlas-barista-mag-jebena',
      'atlas-wiki-vietnam-coffee',
      'atlas-hk-milk-tea',
      'atlas-barista-mag-olla',
      'atlas-fda-lead-pottery',
    ],
    confidence: 'verified',
    next: ['cul-waves-specialty'],
  },
  {
    id: 'cul-waves-specialty',
    track: 'culture',
    level: 'intermediate',
    title: L('咖啡“浪潮”与精品咖啡', 'Coffee “waves” and specialty coffee'),
    goal: L(
      '能解释“咖啡浪潮”这一说法及其局限，说出“精品咖啡”大致指什么、不保证什么，并能以尊重的态度谈论咖啡农、可追溯性和各种咖啡风格。',
      'Explain the “waves” framing and its limits, say roughly what “specialty” means and doesn’t guarantee, and talk respectfully about farmers, traceability and every style of coffee.',
    ),
    prerequisites: [],
    keyConcepts: [
      L('“三波浪潮”是方便但不精确的叙事', 'The “three waves” are a handy but imprecise story'),
      L('“精品”是品质分级，不是口味保证', '“Specialty” is a quality grade, not a taste guarantee'),
      L('可追溯性：产地、庄园、品种、处理法', 'Traceability: origin, farm, variety, process'),
      L('咖啡农面对价格波动和气候变化', 'Farmers face volatile prices and climate change'),
      L('尊重每一杯：速溶和摩卡壶也是真正的咖啡', 'Respect every cup: instant and moka coffee are real coffee too'),
    ],
    activityIds: ['cul-waves-specialty-explain', 'cul-waves-specialty-quiz', 'cul-waves-specialty-reflect'],
    checkForUnderstanding: ['cul-waves-specialty-quiz'],
    safetyNotes: [],
    estimatedMinutes: 15,
    sources: ['atlas-wiki-third-wave', 'atlas-sca-csp', 'atlas-ico', 'atlas-wcr-varieties'],
    confidence: 'rule-of-thumb',
    next: ['exp-origin-processing', 'exp-sensory-basics'],
  },
];

export const activities: Activity[] = [
  // ═════════════════════ cul-origins-legends ═════════════════════
  {
    id: 'cul-origins-legends-explain',
    lessonId: 'cul-origins-legends',
    kind: 'explain',
    title: L('咖啡从哪里来', 'Where coffee came from'),
    supportedModes: COG,
    cards: [
      {
        heading: L('诞生在埃塞俄比亚的森林', 'Born in Ethiopia’s forests'),
        body: L(
          '野生的阿拉比卡咖啡树原产于埃塞俄比亚西南部的高地森林。在有文字记载之前，当地人很可能早已在利用咖啡。',
          'Wild arabica coffee originated in the highland forests of southwestern Ethiopia. People there very likely used coffee long before anything was written down.',
        ),
        illustration: 'map-ethiopia-yemen',
        callout: {
          kind: 'culture',
          text: L('今天在埃塞俄比亚，咖啡仍是待客的核心——见“世界各地的咖啡传统”。', 'In Ethiopia today, coffee is still at the heart of hospitality — see “Coffee traditions around the world”.'),
        },
      },
      {
        heading: L('跳舞的山羊（传说）', 'The dancing goats (a legend)'),
        body: L(
          '流传最广的故事说：一位牧羊人发现山羊吃了某种红色果实后格外兴奋，于是咖啡被“发现”了。后来的版本把他叫作 Kaldi。',
          'The best-known story says a goatherd noticed his goats grew lively after eating red berries, and so coffee was “discovered”. Later retellings call him Kaldi.',
        ),
        illustration: 'goat-legend',
        callout: {
          kind: 'myth',
          text: L(
            '这是传说：已知最早的文字版本写于 1671 年，距离故事发生的年代已过去好几个世纪；人物名字和细节在不同版本中各不相同。',
            'This is a legend: the earliest known written version dates from 1671 (Antoine Faustus Nairon), centuries after the supposed events, and names and details vary between retellings.',
          ),
        },
      },
      {
        heading: L('最早可信的证据：15 世纪的也门', 'First credible evidence: 15th-century Yemen'),
        body: L(
          '目前可信的最早饮用证据来自 15 世纪也门的苏菲派社群，他们喝咖啡以便在夜间祈祷时保持清醒。咖啡经红海港口摩卡对外贸易。',
          'The earliest credible evidence of coffee drinking comes from Sufi communities in 15th-century Yemen, who drank it to stay alert for night devotions. Coffee was traded through the Red Sea port of Mocha.',
        ),
        illustration: 'mocha-port',
        callout: { kind: 'tip', text: L('这就是“摩卡”这个词出现在咖啡世界里的原因。', 'That’s why the word “mocha” turns up all over the coffee world.') },
      },
      {
        heading: L('争议与禁令', 'Controversy and bans'),
        body: L(
          '咖啡和咖啡馆曾引起激烈争论：1511 年麦加当局曾一度禁止咖啡，但禁令没有持续多久。后来欧洲也有过类似争议。',
          'Coffee and coffeehouses stirred fierce debate: in 1511 authorities in Mecca banned coffee for a time, but the ban didn’t last. Europe later saw similar arguments.',
        ),
        illustration: 'scroll-ban',
        callout: {
          kind: 'myth',
          text: L('“教皇为咖啡‘施洗’”的故事流传很广，但缺乏可靠记载，应当作轶事看待。', 'The story that a pope “baptised” coffee is popular but poorly documented — treat it as an anecdote.'),
        },
      },
      {
        heading: L('走向世界——也伴随着苦难', 'Spreading worldwide — with a painful side'),
        body: L(
          '荷兰人在 17 世纪末把咖啡种到爪哇；1720 年代法国军官 de Clieu 把一株树苗带到马提尼克岛；约 1727 年咖啡传入巴西。这一扩张建立在殖民种植园之上，大量依赖被奴役和被强迫的劳动——这是咖啡史中不可回避的一部分。',
          'The Dutch planted coffee in Java in the late 1600s; in the 1720s the French officer de Clieu carried a seedling to Martinique; around 1727 coffee reached Brazil. This expansion was built on colonial plantations that relied heavily on enslaved and coerced labour — an unavoidable part of coffee’s history.',
        ),
        illustration: 'map-spread',
        callout: {
          kind: 'myth',
          text: L('“巴西咖啡来自总督夫人藏在花束里的种子”这类细节很生动，但带有传说色彩。', 'Colourful details — like seeds hidden in a governor’s wife’s bouquet for Brazil — carry a strong whiff of legend.'),
        },
      },
      {
        heading: L('咖啡在中国', 'Coffee in China'),
        body: L(
          '一般认为，1900 年前后有传教士把咖啡种在云南大理宾川县的朱苦拉村（不同资料给出的年份从 1892 到 1904 年不等）。如今中国大部分咖啡产自云南。',
          'Coffee is generally said to have been planted by missionaries in Zhukula village, Binchuan County, Yunnan, around 1900 (sources give dates from 1892 to 1904). Today most of China’s coffee grows in Yunnan.',
        ),
        illustration: 'map-yunnan',
        callout: { kind: 'culture', text: L('你喝过云南咖啡吗？可以在“产地与处理法”一课里看看怎么读豆袋标签。', 'Tried Yunnan coffee? “Origin & processing” shows you how to read the bag.') },
      },
    ],
  },
  {
    id: 'cul-origins-legends-quiz',
    lessonId: 'cul-origins-legends',
    kind: 'quiz',
    title: L('历史还是传说？', 'History or legend?'),
    supportedModes: COG,
    questions: [
      {
        id: 'cul-origins-q1',
        prompt: L('下列哪一项最有历史证据支持？', 'Which statement is best supported by historical evidence?'),
        options: [
          { id: 'a', text: L('15 世纪也门的苏菲派社群已经在喝咖啡', 'Sufi communities in Yemen drank coffee by the 15th century'), correct: true, feedback: L('对，这是目前最早的可信证据。', 'Yes — the earliest credible evidence we have.') },
          { id: 'b', text: L('9 世纪一位名叫 Kaldi 的牧羊人发现了咖啡', 'A goatherd named Kaldi discovered coffee in the 9th century'), correct: false, feedback: L('这是传说，最早的文字记录晚了好几个世纪。', 'That’s a legend, first written down centuries later.') },
          { id: 'c', text: L('咖啡最早是在意大利被饮用的', 'Coffee was first drunk in Italy'), correct: false, feedback: L('咖啡到欧洲要晚得多，它先在也门和奥斯曼世界流行。', 'Coffee reached Europe much later; it spread first through Yemen and the Ottoman world.') },
        ],
        explanation: L('可信的证据指向 15 世纪的也门。', 'Credible evidence points to 15th-century Yemen.'),
      },
      {
        id: 'cul-origins-q2',
        prompt: L('为什么说山羊的故事是“传说”？', 'Why do we call the goat story a “legend”?'),
        options: [
          { id: 'a', text: L('最早的文字版本写于 1671 年，晚了几个世纪，且没有其他证据', 'Its earliest written version dates from 1671, centuries later, with no supporting evidence'), correct: true, feedback: L('对，这就是区分历史和传说的方法：看证据和时间。', 'Right — that’s how to separate history from legend: evidence and timing.') },
          { id: 'b', text: L('因为山羊不吃咖啡果', 'Because goats can’t eat coffee cherries'), correct: false, feedback: L('这不是原因；问题在于故事缺乏同时代的证据。', 'That’s not the reason; the problem is the lack of contemporary evidence.') },
          { id: 'c', text: L('因为埃塞俄比亚和咖啡没有关系', 'Because Ethiopia has nothing to do with coffee'), correct: false, feedback: L('埃塞俄比亚恰恰是阿拉比卡的故乡，只是这个故事本身无法证实。', 'Ethiopia is arabica’s homeland — only this particular story is unverified.') },
        ],
        explanation: L('传说可以很美，但要和证据分开看。', 'Legends can be lovely — just keep them separate from evidence.'),
      },
      {
        id: 'cul-origins-q3',
        prompt: L('“摩卡”这个名字来自哪里？', 'Where does the name “mocha” come from?'),
        options: [
          { id: 'a', text: L('也门的港口摩卡', 'The port of Mocha in Yemen'), correct: true, feedback: L('对，它曾是咖啡贸易的重要港口。', 'Yes — once a key coffee-trading port.') },
          { id: 'b', text: L('西班牙语里的“巧克力”', 'The Spanish word for chocolate'), correct: false, feedback: L('巧克力的联系是后来才有的，名字本身来自港口。', 'The chocolate link came later; the name comes from the port.') },
          { id: 'c', text: L('一家 20 世纪的连锁咖啡店', 'A 20th-century coffee chain'), correct: false, feedback: L('这个名字比任何连锁店都古老得多。', 'The name is far older than any chain.') },
        ],
        explanation: L('摩卡港让也门咖啡闻名世界。', 'The port of Mocha made Yemeni coffee famous.'),
      },
      {
        id: 'cul-origins-q4',
        prompt: L('怎样诚实地描述咖啡传入美洲的过程？', 'What is an honest description of how coffee spread to the Americas?'),
        options: [
          { id: 'a', text: L('通过殖民种植园经济传播，大量依赖被奴役和被强迫的劳动', 'Through colonial plantation economies that relied heavily on enslaved and coerced labour'), correct: true, feedback: L('对，这是咖啡史中重要而沉重的一面。', 'Yes — an important and painful part of coffee history.') },
          { id: 'b', text: L('靠鸟类自然传播过去的', 'Birds carried it there naturally'), correct: false, feedback: L('咖啡在美洲的种植是人为引入和扩张的。', 'Coffee in the Americas was deliberately introduced and expanded by people.') },
          { id: 'c', text: L('咖啡原本就生长在美洲', 'Coffee was always native there'), correct: false, feedback: L('咖啡原产于非洲，美洲的咖啡都是后来引入的。', 'Coffee is native to Africa; coffee in the Americas was introduced.') },
        ],
        explanation: L('了解历史的全貌，也包括它的代价。', 'Knowing the whole story includes its costs.'),
      },
    ],
  },
  {
    id: 'cul-origins-legends-timeline',
    lessonId: 'cul-origins-legends',
    kind: 'sequence',
    title: L('咖啡时间线', 'Coffee timeline'),
    supportedModes: COG,
    prompt: L('把这些事件按时间先后排列。', 'Put these events in chronological order.'),
    steps: [
      { id: 'yemen', text: L('也门的苏菲派社群饮用咖啡（15 世纪）', 'Sufi communities in Yemen drink coffee (15th century)'), why: L('最早可信的饮用证据。', 'The earliest credible evidence of drinking.') },
      { id: 'mecca-ban', text: L('麦加当局一度禁止咖啡（1511 年）', 'Authorities in Mecca briefly ban coffee (1511)'), why: L('咖啡流行起来后引发了争议。', 'Coffee’s popularity sparked controversy.') },
      { id: 'istanbul', text: L('伊斯坦布尔开设咖啡馆（约 1554—1555 年）', 'Coffeehouses open in Istanbul (c. 1554–55)'), why: L('咖啡馆文化在奥斯曼世界兴起。', 'Coffeehouse culture rises in the Ottoman world.') },
      { id: 'london', text: L('伦敦第一家咖啡馆（1652 年）', 'London’s first coffeehouse (1652)'), why: L('咖啡在 17 世纪中期进入英国。', 'Coffee reaches England in the mid-1600s.') },
      { id: 'martinique', text: L('咖啡树苗被带到马提尼克岛（1720 年代）', 'A coffee seedling is taken to Martinique (1720s)'), why: L('咖啡种植扩展到加勒比地区。', 'Coffee growing spreads to the Caribbean.') },
      { id: 'brazil', text: L('咖啡传入巴西（约 1727 年）', 'Coffee reaches Brazil (c. 1727)'), why: L('巴西后来成为全球最大的咖啡生产国。', 'Brazil later becomes the world’s largest producer.') },
    ],
    hint: L('先从人们最早喝咖啡的地方开始，欧洲来得较晚。', 'Start where people first drank coffee — Europe comes later.'),
    misconceptions: [
      { earlierStep: 'yemen', laterStep: 'london', feedback: L('欧洲来得很晚——伦敦有咖啡馆之前，咖啡在中东已经流行了一个多世纪。', 'Europe was late — coffee had been popular in the Middle East for over a century before London’s first coffeehouse.') },
      { earlierStep: 'istanbul', laterStep: 'london', feedback: L('伊斯坦布尔的咖啡馆比伦敦早了大约一百年。', 'Istanbul had coffeehouses roughly a century before London.') },
    ],
  },
  {
    id: 'cul-origins-legends-reflect',
    lessonId: 'cul-origins-legends',
    kind: 'reflect',
    title: L('想一想', 'Think it over'),
    supportedModes: COG,
    prompts: [
      L('哪段历史最让你意外？', 'Which part of the story surprised you most?'),
      L('你觉得为什么传说比历史更容易流传？', 'Why do you think legends spread more easily than history?'),
      L('在常见的咖啡起源故事里，谁的声音常常被忽略了？', 'Whose voices are often missing from the usual coffee origin stories?'),
    ],
  },

  // ═════════════════════ cul-coffeehouses ═════════════════════
  {
    id: 'cul-coffeehouses-explain',
    lessonId: 'cul-coffeehouses',
    kind: 'explain',
    title: L('改变城市的咖啡馆', 'Coffeehouses that changed cities'),
    supportedModes: COG,
    cards: [
      {
        heading: L('伊斯坦布尔，约 1555 年', 'Istanbul, c. 1555'),
        body: L(
          '奥斯曼史学家佩切维记载，两位分别来自阿勒颇和大马士革的商人在伊斯坦布尔开了咖啡馆。人们在这里聊天、下棋、听诗、交换消息，咖啡馆因此被称为“智者的学校”。',
          'The Ottoman chronicler İbrahim Peçevi recorded two merchants from Aleppo and Damascus opening coffeehouses in Istanbul. People came to talk, play games, hear poetry and trade news — hence the nickname “schools of the wise”.',
        ),
        illustration: 'coffeehouse-ottoman',
      },
      {
        heading: L('伦敦的“便士大学”', 'London’s “penny universities”'),
        body: L(
          '伦敦第一家咖啡馆在 1652 年由 Pasqua Rosée 开设。花一便士买杯咖啡，就能加入各种辩论，所以有了“便士大学”的绰号。著名的劳合社保险市场就起源于 17 世纪末 Edward Lloyd 的咖啡馆。',
          'London’s first coffeehouse was opened by Pasqua Rosée in 1652. For a penny’s coffee you could join any debate — hence “penny universities”. The Lloyd’s insurance market grew out of Edward Lloyd’s coffeehouse in the late 1600s.',
        ),
        illustration: 'coffeehouse-london',
        callout: {
          kind: 'culture',
          text: L('当时很多咖啡馆基本只接待男性——“对所有人开放”并不完全属实。', 'Many of these coffeehouses were largely male spaces — “open to everyone” wasn’t quite true.'),
        },
      },
      {
        heading: L('维也纳：传说与记录', 'Vienna: legend versus record'),
        body: L(
          '流行的故事说：1683 年维也纳之围后，一位叫 Kolschitzky 的人用奥斯曼军队留下的咖啡豆开了第一家咖啡馆。而更被认可的记录是：亚美尼亚商人 Johannes Diodato 于 1685 年开设了第一家获得许可的咖啡馆。维也纳咖啡馆以报纸、一杯清水和可以坐上半天的从容闻名。',
          'The popular story says that after the 1683 siege, a man named Kolschitzky opened Vienna’s first café with coffee left by the Ottoman army. The more accepted record credits Armenian merchant Johannes Diodato with the first licensed coffeehouse in 1685. Viennese cafés are famous for newspapers, a glass of water and lingering for hours.',
        ),
        illustration: 'coffeehouse-vienna',
        callout: { kind: 'myth', text: L('Kolschitzky 的故事是传说，不是可靠的历史。', 'The Kolschitzky tale is legend, not reliable history.') },
      },
      {
        heading: L('巴黎的文学咖啡馆', 'Paris and its literary cafés'),
        body: L(
          '普罗可布咖啡馆开业于 1680 年代末（资料记为 1686 或 1689 年），后来成为作家和思想家的聚会场所。巴黎的咖啡馆与沙龙一起，成为思想交流的重要空间。',
          'Café Procope opened in the late 1680s (sources say 1686 or 1689) and became a meeting place for writers and thinkers. Alongside salons, Paris cafés became key spaces for exchanging ideas.',
        ),
        illustration: 'coffeehouse-paris',
      },
      {
        heading: L('东京 1888：日本第一家咖啡馆', 'Tokyo 1888: Japan’s first coffeehouse'),
        body: L(
          '1888 年，曾在美国留学的郑永庆在东京上野开设“可否茶馆”，提供报纸和西式陈设，想做一个人人可以交流的沙龙。它几年后就关门了，但后来日本发展出丰富的喫茶店文化：手冲、虹吸、爵士喫茶……',
          'In 1888, Tei Eikei, who had studied in the United States, opened Kahiichakan in Ueno, Tokyo — a salon with newspapers and Western furnishings. It closed within a few years, but Japan later developed a rich kissaten culture: hand-drip, siphon, jazz cafés…',
        ),
        illustration: 'coffeehouse-kissaten',
        callout: { kind: 'culture', text: L('在 Drink Atlas 里看看“虹吸咖啡”和“日式冰手冲”。', 'See “Siphon coffee” and “Japanese-style iced pour-over” in the Drink Atlas.') },
      },
      {
        heading: L('香港的茶餐厅', 'Hong Kong’s cha chaan teng'),
        body: L(
          '茶餐厅把西式餐点本地化，快捷又实惠。港式奶茶、鸳鸯和冻柠茶是它们的招牌，茶餐厅本身也成了香港身份认同的一部分。',
          'Cha chaan teng localised Western dishes, fast and affordable. Milk tea, yuenyeung and iced lemon tea are signatures — and the cha chaan teng itself became part of Hong Kong identity.',
        ),
        illustration: 'cha-chaan-teng',
        callout: { kind: 'culture', text: L('港式奶茶制作技艺于 2017 年列入香港首份非物质文化遗产代表作名录。', 'Hong Kong-style milk tea making was placed on Hong Kong’s first intangible heritage inventory in 2017.') },
      },
      {
        heading: L('“第三空间”', 'The “third place”'),
        body: L(
          '社会学家 Ray Oldenburg 提出“第三空间”的概念：家和工作场所之外、让人非正式相聚的地方。从伊斯坦布尔到上海，咖啡馆常常扮演这个角色。',
          'Sociologist Ray Oldenburg described “third places”: informal gathering spots beyond home and work. From Istanbul to Shanghai, cafés often play that role.',
        ),
        illustration: 'third-place',
      },
    ],
  },
  {
    id: 'cul-coffeehouses-timeline',
    lessonId: 'cul-coffeehouses',
    kind: 'sequence',
    title: L('咖啡馆时间线', 'Coffeehouse timeline'),
    supportedModes: COG,
    prompt: L('把这些城市的早期咖啡馆按开业时间排序。', 'Order these early coffeehouses by opening date.'),
    steps: [
      { id: 'istanbul', text: L('伊斯坦布尔（约 1555 年）', 'Istanbul (c. 1555)'), why: L('奥斯曼世界是咖啡馆文化的发源地之一。', 'The Ottoman world was a cradle of coffeehouse culture.') },
      { id: 'oxford', text: L('牛津（1650 或 1651 年）', 'Oxford (1650 or 1651)'), why: L('英国最早的咖啡馆出现在牛津。', 'England’s first coffeehouse appeared in Oxford.') },
      { id: 'london', text: L('伦敦（1652 年）', 'London (1652)'), why: L('不久之后伦敦也有了咖啡馆。', 'London followed soon after.') },
      { id: 'vienna', text: L('维也纳（1685 年，Diodato）', 'Vienna (1685, Diodato)'), why: L('维也纳之围后不久，第一家获许可的咖啡馆开业。', 'The first licensed café opened soon after the siege.') },
      { id: 'paris', text: L('巴黎普罗可布（1680 年代末）', 'Paris, Café Procope (late 1680s)'), why: L('后来成为文人聚集的咖啡馆。', 'It became a gathering place for writers.') },
      { id: 'tokyo', text: L('东京可否茶馆（1888 年）', 'Tokyo, Kahiichakan (1888)'), why: L('日本第一家咖啡馆。', 'Japan’s first coffeehouse.') },
    ],
    hint: L('咖啡馆文化从东向西传播，日本要到 19 世纪末。', 'Coffeehouse culture travelled west first; Japan came in the late 19th century.'),
    misconceptions: [
      { earlierStep: 'istanbul', laterStep: 'london', feedback: L('奥斯曼世界的咖啡馆比伦敦早了大约一百年。', 'Ottoman coffeehouses were common about a century before London had one.') },
      { earlierStep: 'oxford', laterStep: 'london', feedback: L('英国第一家咖啡馆开在牛津，伦敦稍晚一两年。', 'England’s first coffeehouse was in Oxford; London followed a year or two later.') },
    ],
  },
  {
    id: 'cul-coffeehouses-quiz',
    lessonId: 'cul-coffeehouses',
    kind: 'quiz',
    title: L('咖啡馆小测', 'Coffeehouse check'),
    supportedModes: COG,
    questions: [
      {
        id: 'cul-houses-q1',
        prompt: L('英国的咖啡馆为什么被叫作“便士大学”？', 'Why were English coffeehouses nicknamed “penny universities”?'),
        options: [
          { id: 'a', text: L('花一杯咖啡的钱，就能加入各种谈话和辩论', 'For the price of a coffee you could join conversations and debates'), correct: true, feedback: L('对，咖啡馆是交换消息和观点的地方。', 'Right — they were places to swap news and opinions.') },
          { id: 'b', text: L('它们开设正式的大学课程', 'They offered formal university courses'), correct: false, feedback: L('没有正式课程，“大学”指的是谈话中能学到很多东西。', 'No formal courses — “university” refers to how much you could learn from talk.') },
          { id: 'c', text: L('咖啡免费，学习收一便士', 'Coffee was free and lessons cost a penny'), correct: false, feedback: L('一便士买的是咖啡（和入场），谈话是免费的。', 'The penny bought the coffee (and entry); the conversation was free.') },
        ],
        explanation: L('早期咖啡馆的核心是交流。', 'Early coffeehouses were all about exchange.'),
      },
      {
        id: 'cul-houses-q2',
        prompt: L('“Kolschitzky 用奥斯曼军队留下的咖啡豆开了维也纳第一家咖啡馆”，这是？', '“Kolschitzky opened Vienna’s first café with coffee left by the Ottoman army” is…'),
        options: [
          { id: 'a', text: L('流行的传说；记录显示 1685 年 Diodato 开了第一家获许可的咖啡馆', 'A popular legend; records credit Diodato’s licensed coffeehouse in 1685'), correct: true, feedback: L('对，传说和记录是两回事。', 'Right — legend and record are different things.') },
          { id: 'b', text: L('有档案证明的史实', 'A fact proven by archives'), correct: false, feedback: L('档案更支持 Diodato 的说法，Kolschitzky 的故事属于传说。', 'Archives support Diodato; the Kolschitzky story is legend.') },
          { id: 'c', text: L('关于巴黎的故事', 'A story about Paris'), correct: false, feedback: L('这是关于维也纳的故事，与 1683 年维也纳之围有关。', 'It’s a Vienna story, tied to the 1683 siege.') },
        ],
        explanation: L('好故事不等于真历史。', 'A good story isn’t the same as history.'),
      },
      {
        id: 'cul-houses-q3',
        prompt: L('很多城市的早期咖啡馆有什么共同点？', 'What did early coffeehouses in many cities have in common?'),
        options: [
          { id: 'a', text: L('都是交流消息和聊天的社交场所', 'They were social places for news and conversation'), correct: true, feedback: L('对。不过要注意，很多早期咖啡馆基本只接待男性。', 'Yes — though note that many early coffeehouses were largely male spaces.') },
          { id: 'b', text: L('都要求保持安静、只能读书', 'They required silence for study'), correct: false, feedback: L('恰恰相反，它们以热闹的讨论著称。', 'Quite the opposite — they were known for lively talk.') },
          { id: 'c', text: L('只对贵族开放', 'They were only for nobility'), correct: false, feedback: L('很多咖啡馆向不同阶层开放，这也是它们引起争议的原因之一。', 'Many mixed social classes, which was part of why they were controversial.') },
        ],
        explanation: L('咖啡馆一直是城市的“客厅”。', 'Coffeehouses have long been a city’s living room.'),
      },
    ],
  },
  {
    id: 'cul-coffeehouses-reflect',
    lessonId: 'cul-coffeehouses',
    kind: 'reflect',
    title: L('你的咖啡馆', 'Your café'),
    supportedModes: COG,
    prompts: [
      L('你最喜欢的咖啡馆是什么样的？它对你来说是“第三空间”吗？', 'What’s your favourite café like? Is it a “third place” for you?'),
      L('你所在的城市，咖啡馆在过去十年有什么变化？', 'How have cafés in your city changed over the past decade?'),
      L('如果穿越回某家历史咖啡馆，你想去哪一家？', 'If you could visit one historical coffeehouse, which would it be?'),
    ],
  },

  // ═════════════════════ cul-espresso-bar ═════════════════════
  {
    id: 'cul-espresso-bar-explain',
    lessonId: 'cul-espresso-bar',
    kind: 'explain',
    title: L('意式浓缩是怎样诞生的', 'How espresso was born'),
    supportedModes: COG,
    cards: [
      {
        heading: L('蒸汽时代的“快”', 'Speed in the age of steam'),
        body: L(
          '1884 年，都灵的 Angelo Moriondo 展出了一台利用蒸汽和热水批量冲煮咖啡的机器，通常被视为最早的意式咖啡机之一。',
          'In 1884, Angelo Moriondo of Turin exhibited a machine that used steam and hot water to brew coffee in bulk — usually counted among the earliest espresso-style machines.',
        ),
        illustration: 'espresso-history-steam',
      },
      {
        heading: L('一杯一杯地快速做', 'One cup at a time, quickly'),
        body: L(
          '20 世纪初，Luigi Bezzera 改进并申请了专利，Desiderio Pavoni 买下专利开始量产，并在 1906 年米兰博览会上展示。这些早期机器靠蒸汽压力，压力较低，咖啡常偏苦。',
          'In the early 1900s Luigi Bezzera patented improvements; Desiderio Pavoni bought the patent, began production and showed it at the 1906 Milan fair. These early machines used steam pressure — fairly low — and the coffee was often bitter.',
        ),
        illustration: 'espresso-history-pavoni',
      },
      {
        heading: L('拉杆与油脂', 'The lever and crema'),
        body: L(
          'Achille Gaggia 的拉杆活塞机器（专利在 1930 年代末，战后才大规模商用）能产生高得多的压力，做出表面那层金棕色的油脂。今天我们熟悉的浓缩风格由此成形。',
          'Achille Gaggia’s lever-piston machines (patented in the late 1930s, widely sold after WWII) produced much higher pressure and the golden-brown crema on top. The espresso style we know took shape here.',
        ),
        illustration: 'espresso-lever',
      },
      {
        heading: L('电动泵与 E61', 'Pumps and the E61'),
        body: L(
          '1961 年 Faema 推出 E61，用电动泵供水并采用热交换设计。它的冲煮头设计影响深远，今天仍有很多机器沿用类似结构。',
          'In 1961 Faema launched the E61, using an electric pump and a heat-exchanger design. Its group head was hugely influential — many machines still use a similar design today.',
        ),
        illustration: 'espresso-e61',
      },
      {
        heading: L('在意大利的吧台', 'At the Italian bar'),
        body: L(
          '在意大利点“un caffè”就是一杯浓缩，许多人站在吧台前一两分钟喝完，站着喝通常也比坐下便宜。卡布奇诺多在早上喝——这是习惯，不是规则。',
          'In Italy “un caffè” is an espresso, often drunk standing at the bar (al banco) in a minute or two — standing is usually cheaper than sitting. Cappuccino is mostly a morning drink — a custom, not a rule.',
        ),
        illustration: 'italian-bar',
        callout: { kind: 'culture', text: L('在意大利只说“latte”，你很可能会得到一杯牛奶。', 'Ask for just “latte” in Italy and you’ll probably get a glass of milk.') },
      },
      {
        heading: L('家里的摩卡壶（1933）', 'The moka pot at home (1933)'),
        body: L(
          'Alfonso Bialetti 在 1933 年推出铝制 Moka Express，让意大利家庭在炉子上就能做出浓咖啡。',
          'Alfonso Bialetti’s aluminium Moka Express of 1933 let Italian households brew strong coffee on the stove.',
        ),
        illustration: 'moka-pot',
        callout: {
          kind: 'myth',
          text: L(
            '误区：“摩卡壶做的就是真正的浓缩。”摩卡壶的压力远低于常被引用的意式机约 9 bar，风格相近但不同。',
            'Myth: “A moka pot makes true espresso.” Its pressure is a small fraction of the roughly 9 bar often cited for espresso machines — similar spirit, different drink.',
          ),
        },
      },
    ],
  },
  {
    id: 'cul-espresso-bar-timeline',
    lessonId: 'cul-espresso-bar',
    kind: 'sequence',
    title: L('意式咖啡机时间线', 'Espresso machine timeline'),
    supportedModes: COG,
    prompt: L('把这些里程碑按时间顺序排列。', 'Order these milestones in time.'),
    steps: [
      { id: 'moriondo', text: L('Moriondo 在都灵展出蒸汽咖啡机（1884）', 'Moriondo shows a steam coffee machine in Turin (1884)'), why: L('最早的意式咖啡机原型之一。', 'One of the earliest espresso-style machines.') },
      { id: 'pavoni', text: L('Pavoni 量产机器亮相米兰博览会（1906）', 'Pavoni’s production machine appears at the Milan fair (1906)'), why: L('一杯一杯快速制作开始普及。', 'Fast, cup-by-cup coffee starts to spread.') },
      { id: 'moka', text: L('Bialetti 推出 Moka Express（1933）', 'Bialetti launches the Moka Express (1933)'), why: L('浓咖啡进入家庭厨房。', 'Strong coffee enters home kitchens.') },
      { id: 'gaggia', text: L('Gaggia 的拉杆机器带来油脂（1930 年代末至 1940 年代）', 'Gaggia’s lever machines bring crema (late 1930s–1940s)'), why: L('高压让现代浓缩风格成形。', 'High pressure shapes modern espresso.') },
      { id: 'e61', text: L('Faema E61 采用电动泵（1961）', 'Faema E61 uses an electric pump (1961)'), why: L('影响深远的冲煮头设计沿用至今。', 'An influential group-head design still used today.') },
    ],
    hint: L('先有蒸汽，再有拉杆，最后是电动泵。', 'Steam first, then levers, then pumps.'),
    misconceptions: [
      { earlierStep: 'pavoni', laterStep: 'gaggia', feedback: L('能做出油脂的拉杆机器，比最早的蒸汽机器晚了几十年。', 'Crema-making lever machines came decades after the first steam machines.') },
      { earlierStep: 'gaggia', laterStep: 'e61', feedback: L('电动泵机器是在拉杆机之后出现的。', 'Pump machines came after the lever era.') },
    ],
  },
  {
    id: 'cul-espresso-bar-quiz',
    lessonId: 'cul-espresso-bar',
    kind: 'quiz',
    title: L('浓缩迷思小测', 'Espresso myths check'),
    supportedModes: COG,
    questions: [
      {
        id: 'cul-espresso-q1',
        prompt: L('“Espresso”指的是什么？', 'What is “espresso”?'),
        options: [
          { id: 'a', text: L('一种冲煮方法：加压热水快速穿过细粉', 'A brewing method: pressurised hot water through fine coffee'), correct: true, feedback: L('对，任何咖啡豆都可以做浓缩。', 'Right — any coffee can be brewed as espresso.') },
          { id: 'b', text: L('一种特别的咖啡豆', 'A special type of bean'), correct: false, feedback: L('没有“浓缩豆”这种植物；标签上的“意式拼配”只是烘焙商的推荐。', 'There’s no espresso plant; “espresso blend” is a roaster’s suggestion.') },
          { id: 'c', text: L('一种深烘烘焙度', 'A dark roast level'), correct: false, feedback: L('浓缩可以用任何烘焙度，浅烘浓缩也很常见。', 'Espresso can use any roast; light-roast espresso is common too.') },
        ],
        explanation: L('浓缩 = 方法，而不是豆子。', 'Espresso = a method, not a bean.'),
      },
      {
        id: 'cul-espresso-q2',
        prompt: L('一份双份浓缩和一大杯滴滤咖啡，哪个咖啡因多？', 'Which has more caffeine: a double espresso or a large mug of drip coffee?'),
        options: [
          { id: 'a', text: L('要看用了多少咖啡；一大杯滴滤常常不比浓缩少，虽然浓缩每毫升更浓', 'It depends on how much coffee is used; a big mug of drip often has as much or more, even though espresso is more concentrated per ml'), correct: true, feedback: L('对，“浓”指的是每毫升，不是每杯。', 'Right — “strong” is per millilitre, not per serving.') },
          { id: 'b', text: L('浓缩每杯一定多得多', 'Espresso always has far more per serving'), correct: false, feedback: L('浓缩体积小，按整杯算咖啡因不一定更多。', 'Espresso servings are small; per serving it isn’t necessarily more.') },
          { id: 'c', text: L('浓缩不含咖啡因', 'Espresso has no caffeine'), correct: false, feedback: L('浓缩当然含有咖啡因，除非用的是脱因豆。', 'Of course it does, unless it’s made with decaf.') },
        ],
        explanation: L('比较咖啡因要看用了多少咖啡粉。', 'To compare caffeine, look at how much coffee went in.'),
      },
      {
        id: 'cul-espresso-q3',
        prompt: L('关于油脂，哪句话最准确？', 'Which statement about crema is most accurate?'),
        options: [
          { id: 'a', text: L('它是压力带来的气泡和油脂，能反映新鲜度，但不能保证好喝', 'It’s gas bubbles and oils created by pressure; it can hint at freshness but doesn’t guarantee a tasty shot'), correct: true, feedback: L('对，好看的油脂下面也可能是一杯酸涩的浓缩。', 'Right — beautiful crema can sit on a sour shot.') },
          { id: 'b', text: L('有油脂就说明这杯一定好喝', 'Crema proves the shot is good'), correct: false, feedback: L('新鲜豆子即使萃取不足也能产生很多油脂，口味才是裁判。', 'Fresh beans make lots of crema even when under-extracted; taste is the judge.') },
          { id: 'c', text: L('油脂是加进去的奶泡', 'Crema is added milk foam'), correct: false, feedback: L('油脂来自咖啡本身，与牛奶无关。', 'Crema comes from the coffee itself, not milk.') },
        ],
        explanation: L('油脂是线索，不是成绩单。', 'Crema is a clue, not a report card.'),
      },
      {
        id: 'cul-espresso-q4',
        prompt: L('在意大利午饭后点卡布奇诺……', 'Ordering a cappuccino after lunch in Italy is…'),
        options: [
          { id: 'a', text: L('很多意大利人不这么做，但这只是习惯，你想喝就点', 'Something many Italians don’t do — but it’s a custom; order what you like'), correct: true, feedback: L('对，了解习俗，但不必被它束缚。', 'Right — know the custom, don’t be ruled by it.') },
          { id: 'b', text: L('违法的', 'Illegal'), correct: false, feedback: L('当然不违法，只是不太常见。', 'Of course not — just less common.') },
          { id: 'c', text: L('大家都这么做', 'What everyone does'), correct: false, feedback: L('传统上卡布奇诺多在早上喝。', 'Traditionally cappuccino is mostly a morning drink.') },
        ],
        explanation: L('文化习俗值得了解，也可以被尊重地打破。', 'Customs are worth knowing — and can be respectfully broken.'),
      },
    ],
  },
  {
    id: 'cul-espresso-bar-reflect',
    lessonId: 'cul-espresso-bar',
    kind: 'reflect',
    title: L('想一想', 'Think it over'),
    supportedModes: COG,
    prompts: [
      L('你的意式机和历史上的哪种机器最像？', 'Which historical machine is your own espresso machine most like?'),
      L('你觉得站着快速喝一杯浓缩，和坐下慢慢喝咖啡，各有什么吸引力？', 'What’s appealing about a quick espresso standing up versus a slow coffee sitting down?'),
      L('哪个关于浓缩的误解，你以前也相信过？', 'Which espresso myth had you believed before?'),
    ],
  },

  // ═════════════════════ cul-world-traditions ═════════════════════
  {
    id: 'cul-world-traditions-explain',
    lessonId: 'cul-world-traditions',
    kind: 'explain',
    title: L('一杯咖啡，许多种仪式', 'One drink, many rituals'),
    supportedModes: COG,
    cards: [
      {
        heading: L('土耳其咖啡', 'Turkish coffee'),
        body: L(
          '极细的咖啡粉与冷水（和糖）在长柄小壶里慢慢加热，形成泡沫；配一杯水上桌。人们在咖啡馆聊天、读报，订婚和节日里也有咖啡的身影；喝完后有人会用杯底的咖啡渣“占卜”。“土耳其咖啡文化与传统”于 2013 年列入联合国教科文组织非遗名录。',
          'Powder-fine coffee and cold water (with sugar) are heated slowly in a long-handled pot until foam forms, then served with a glass of water. It’s central to conversation, engagement customs and holidays, and grounds are sometimes read for fortunes. “Turkish coffee culture and tradition” was inscribed by UNESCO in 2013.',
        ),
        illustration: 'cezve',
        callout: { kind: 'culture', text: L('土耳其谚语说：一杯咖啡的情谊，能记四十年。', 'A Turkish proverb says a single cup of coffee is remembered for forty years.') },
      },
      {
        heading: L('阿拉伯咖啡：慷慨的象征', 'Arabic coffee: a symbol of generosity'),
        body: L(
          '浅烘咖啡常加豆蔻，用 dallah 壶倒进无把小杯，每次只倒几口，配椰枣。先敬长者和客人，用右手倒；喝够了就轻轻摇一摇杯子。2015 年列入联合国教科文组织非遗名录，2024 年扩展加入约旦。',
          'Lightly roasted coffee, often with cardamom, poured from a dallah into small handleless cups a few sips at a time, with dates. Elders and guests are served first, poured with the right hand; gently shaking your cup means you’ve had enough. Inscribed by UNESCO in 2015, extended in 2024 to include Jordan.',
        ),
        illustration: 'dallah',
        callout: { kind: 'tip', text: L('不想再喝时摇一摇杯子，是礼貌的表示。', 'Shaking your cup when you’re done is the polite signal.') },
      },
      {
        heading: L('埃塞俄比亚咖啡仪式', 'The Ethiopian coffee ceremony'),
        body: L(
          '主人在客人面前烘焙生豆、研磨，在传统陶壶里煮，常伴有焚香和爆米花等小食。咖啡分三轮奉上——阿姆哈拉语称 abol、tona、baraka（“祝福”），一轮比一轮淡。整个仪式可能持续很久，是相聚和交流的时间。',
          'The host roasts green beans in front of guests, grinds them and brews in a clay jebena, often with incense and snacks such as popcorn. Coffee comes in three rounds — in Amharic abol, tona and baraka (“blessing”) — each lighter than the last. It can take a long time: the point is being together.',
        ),
        illustration: 'jebena',
        callout: { kind: 'culture', text: L('各地区和家庭的做法不同，厄立特里亚也有相似的传统。', 'Practices vary by region and family; Eritrea shares a similar tradition.') },
      },
      {
        heading: L('越南：慢慢滴的那一杯', 'Vietnam: the slow drip'),
        body: L(
          '金属滴滤壶放在杯口，浓咖啡一滴一滴落在炼乳上，再倒在冰上就是越南滴滤冰奶咖。越南是世界主要咖啡生产国之一，以罗布斯塔为主；河内还有蛋咖啡等变化。',
          'A metal phin sits on the glass and strong coffee drips onto condensed milk; pour it over ice for cà phê sữa đá. Vietnam is one of the world’s major producers, mostly of robusta; Hanoi also offers variations such as egg coffee.',
        ),
        illustration: 'phin',
        callout: {
          kind: 'myth',
          text: L('“因为鲜奶稀缺才用炼乳”的解释流传很广，但难以证实。', 'The “condensed milk because fresh milk was scarce” explanation is widely told but hard to verify.'),
        },
      },
      {
        heading: L('香港：鸳鸯', 'Hong Kong: yuenyeung'),
        body: L(
          '港式奶茶和咖啡混在一起，名字寓意“成双成对”。它是茶餐厅的经典饮品，冷热皆宜，每家店的比例都不一样。',
          'Hong Kong-style milk tea mixed with coffee — the name evokes a devoted pair. A cha chaan teng classic, hot or iced, with a different ratio in every shop.',
        ),
        illustration: 'yuenyeung',
      },
      {
        heading: L('墨西哥：陶罐咖啡', 'Mexico: café de olla'),
        body: L(
          '咖啡与肉桂、粗糖一起在陶罐里煮，名字就来自陶罐（olla）。常说它源自墨西哥革命时期的女兵，但这只是流行故事。',
          'Coffee simmered with cinnamon and piloncillo in a clay pot — the olla that gives it its name. It is often linked to the women soldiers of the Mexican Revolution, but that is a popular story, not documented history.',
        ),
        illustration: 'olla',
        callout: { kind: 'safety', text: L('部分传统釉面陶罐可能含铅；无法确认无铅时请用普通锅。', 'Some traditional glazed clay pots can leach lead; use an ordinary pot unless it’s confirmed lead-free.') },
      },
      {
        heading: L('瑞典：fika', 'Sweden: fika'),
        body: L(
          'Fika 是喝咖啡配点心、停下来和人聊一聊的时间，在很多瑞典职场和家庭里都是日常。它说明咖啡的意义常常在于“暂停”和“陪伴”。',
          'Fika is a pause for coffee, something sweet and conversation — a daily habit in many Swedish workplaces and homes. It shows how coffee is often about pausing and company.',
        ),
        illustration: 'fika',
        callout: { kind: 'culture', text: L('这些饮品的家庭版做法都收录在 Drink Atlas 里。', 'Home versions of these drinks are in the Drink Atlas.') },
      },
    ],
  },
  {
    id: 'cul-world-traditions-turkish-steps',
    lessonId: 'cul-world-traditions',
    kind: 'sequence',
    title: L('土耳其咖啡的步骤', 'Making Turkish coffee'),
    supportedModes: COG,
    prompt: L('把制作一杯土耳其咖啡的步骤排好顺序。', 'Put the steps for a cup of Turkish coffee in order.'),
    steps: [
      { id: 'mix', text: L('在壶里放冷水、极细的咖啡粉（和糖），搅匀', 'Combine cold water, very fine coffee (and sugar, if any) in the cezve and stir'), why: L('糖要在加热前放，因为后面不能再搅拌。', 'Sugar goes in first because you shouldn’t stir later.') },
      { id: 'heat', text: L('小火慢慢加热', 'Heat slowly on low'), why: L('慢慢加热才能形成细腻的泡沫。', 'Slow heating builds a fine foam.') },
      { id: 'foam', text: L('看着泡沫升起，不再搅拌', 'Watch the foam rise; stop stirring'), why: L('搅拌会破坏泡沫。', 'Stirring breaks the foam.') },
      { id: 'remove', text: L('快要沸腾前离火', 'Remove just before it boils'), why: L('沸腾会破坏泡沫，还容易溢出。', 'Boiling destroys the foam and can boil over.') },
      { id: 'serve', text: L('先把泡沫舀进杯里，再缓缓倒入咖啡，配一杯水', 'Spoon the foam into the cup, pour gently, serve with a glass of water'), why: L('泡沫备受珍视，清水用来清口。', 'The foam is prized; water refreshes the palate.') },
      { id: 'settle', text: L('等咖啡渣沉底再喝', 'Wait for the grounds to settle before sipping'), why: L('咖啡渣留在杯里，不要喝到底。', 'The grounds stay in the cup — don’t drink to the bottom.') },
    ],
    hint: L('糖和咖啡在最开始就放进去。', 'Sugar and coffee go in at the very start.'),
    misconceptions: [
      { earlierStep: 'mix', laterStep: 'remove', feedback: L('糖和咖啡要在一开始就放好——泡沫形成后就不能再搅了。', 'Sugar and coffee go in at the start — once foam forms you shouldn’t stir anymore.') },
      { earlierStep: 'serve', laterStep: 'settle', feedback: L('马上喝会喝到一嘴咖啡渣，等一两分钟让它沉底。', 'Sip right away and you’ll get a mouthful of grounds — give it a minute or two.') },
      { earlierStep: 'remove', laterStep: 'serve', feedback: L('要先离火让泡沫稳定，再分到杯中。', 'Take it off the heat first so the foam settles, then pour.') },
    ],
  },
  {
    id: 'cul-world-traditions-quiz',
    lessonId: 'cul-world-traditions',
    kind: 'quiz',
    title: L('世界传统小测', 'World traditions check'),
    supportedModes: COG,
    questions: [
      {
        id: 'cul-world-q1',
        prompt: L('在阿拉伯咖啡的传统中，轻轻摇一摇空杯子表示什么？', 'In the Arabic coffee tradition, gently shaking your empty cup means…'),
        options: [
          { id: 'a', text: L('“我喝够了，谢谢”', '“I’ve had enough, thank you”'), correct: true, feedback: L('对，这是礼貌地表示不再续杯。', 'Right — a polite way to decline more.') },
          { id: 'b', text: L('“请快点给我续杯”', '“Please refill me quickly”'), correct: false, feedback: L('正好相反；不摇杯子，主人通常会继续为你倒。', 'The opposite — if you don’t shake it, your host will usually keep pouring.') },
          { id: 'c', text: L('“这咖啡不好喝”', '“This coffee is bad”'), correct: false, feedback: L('这不是批评，只是示意喝够了。', 'It isn’t a criticism — just a signal you’re done.') },
        ],
        explanation: L('了解礼仪，能让你成为更好的客人。', 'Knowing the etiquette makes you a better guest.'),
      },
      {
        id: 'cul-world-q2',
        prompt: L('关于埃塞俄比亚咖啡仪式的三轮，哪句话正确？', 'Which is true about the three rounds of the Ethiopian coffee ceremony?'),
        options: [
          { id: 'a', text: L('三轮分别叫 abol、tona、baraka，一轮比一轮淡', 'They’re called abol, tona and baraka, each lighter than the last'), correct: true, feedback: L('对，最后一轮 baraka 意为“祝福”。', 'Right — the last, baraka, means “blessing”.') },
          { id: 'b', text: L('只煮一大壶，一次喝完', 'One big pot, drunk all at once'), correct: false, feedback: L('仪式分三轮，在同一份咖啡渣上补水再煮。', 'There are three rounds, re-brewing the same grounds with fresh water.') },
          { id: 'c', text: L('一轮比一轮浓', 'Each round gets stronger'), correct: false, feedback: L('因为重复使用咖啡渣，后面的几轮会更淡。', 'Because the grounds are reused, later rounds get lighter.') },
        ],
        explanation: L('三轮咖啡，也是三段相聚的时光。', 'Three rounds of coffee, three rounds of company.'),
      },
      {
        id: 'cul-world-q3',
        prompt: L('关于越南炼乳咖啡，哪种说法最诚实？', 'Which statement about Vietnamese condensed-milk coffee is most honest?'),
        options: [
          { id: 'a', text: L('常说是因为当年鲜奶稀缺，但难以证实；如今它就是一种深受喜爱的风格', 'It’s often said fresh milk was scarce, though that’s hard to verify; today it’s simply a beloved style'), correct: true, feedback: L('对，区分“常见说法”和“已证实的史实”。', 'Right — separate “commonly told” from “documented”.') },
          { id: 'b', text: L('法律规定必须加炼乳', 'Condensed milk was required by law'), correct: false, feedback: L('没有这样的规定，这是饮食习惯的演变。', 'No such law — it’s a culinary habit that evolved.') },
          { id: 'c', text: L('越南咖啡从来不加奶', 'Vietnamese coffee is never drunk with milk'), correct: false, feedback: L('黑咖啡和奶咖啡都很常见。', 'Both black (cà phê đen) and milk versions are common.') },
        ],
        explanation: L('诚实地讲文化，就要标出不确定的部分。', 'Telling culture honestly means flagging what’s uncertain.'),
      },
      {
        id: 'cul-world-q4',
        prompt: L('墨西哥“café de olla”的名字从何而来？', 'Where does the name “café de olla” come from?'),
        options: [
          { id: 'a', text: L('来自煮它的陶罐（olla de barro）', 'From the clay pot (olla de barro) it’s brewed in'), correct: true, feedback: L('对，“olla”就是陶罐。', 'Yes — “olla” means pot.') },
          { id: 'b', text: L('来自一座城市的名字', 'From the name of a town'), correct: false, feedback: L('名字指的是器具，不是地名。', 'The name refers to the pot, not a place.') },
          { id: 'c', text: L('来自一种咖啡豆', 'From a variety of coffee bean'), correct: false, feedback: L('它可以用各种咖啡豆，名字来自陶罐。', 'Any coffee can be used; the name comes from the pot.') },
        ],
        explanation: L('很多咖啡的名字，都藏着器具和地方的故事。', 'Many coffee names carry stories of tools and places.'),
      },
    ],
  },
  {
    id: 'cul-world-traditions-reflect',
    lessonId: 'cul-world-traditions',
    kind: 'reflect',
    title: L('你的咖啡传统', 'Your coffee traditions'),
    supportedModes: COG,
    prompts: [
      L('你最想在家试做哪一种传统咖啡？需要准备什么？', 'Which tradition would you most like to try at home? What would you need?'),
      L('在你的家庭或城市里，咖啡（或茶）有什么待客习惯？', 'What hospitality customs around coffee (or tea) exist in your family or city?'),
      L('不同文化的咖啡仪式有什么共同点？', 'What do coffee rituals across cultures have in common?'),
    ],
  },

  // ═════════════════════ cul-waves-specialty ═════════════════════
  {
    id: 'cul-waves-specialty-explain',
    lessonId: 'cul-waves-specialty',
    kind: 'explain',
    title: L('浪潮、精品与咖啡农', 'Waves, specialty and farmers'),
    supportedModes: COG,
    cards: [
      {
        heading: L('一个好用但不精确的故事', 'A handy but imprecise story'),
        body: L(
          '常见的说法把现代咖啡分为三波：第一波，咖啡成为大众日常商品（罐装、速溶）；第二波，咖啡连锁店和意式奶咖普及；第三波，把咖啡当作手工产品，重视产地、庄园、处理法、较浅的烘焙和细致的冲煮。这一说法由烘焙师 Trish Rothgeb 在 2000 年代初推广开来。',
          'A common framing splits modern coffee into three waves: first, coffee becomes an everyday mass product (cans, instant); second, café chains and espresso milk drinks spread; third, coffee treated as a craft product — origin, farm, processing, lighter roasts, careful brewing. Roaster Trish Rothgeb popularised the term in the early 2000s.',
        ),
        illustration: 'waves',
        callout: {
          kind: 'myth',
          text: L(
            '“浪潮”不是严格的时代划分：它们相互重叠，各国的路径也不同。有人说“第四波”，但并没有公认的定义。',
            'The waves aren’t strict eras: they overlap and every country’s path differs. Some speak of a “fourth wave”, but there’s no agreed definition.',
          ),
        },
      },
      {
        heading: L('“精品咖啡”是什么意思', 'What “specialty” means'),
        body: L(
          '传统上，按 SCA 杯测方法得分 80 分以上的咖啡被称为“精品咖啡”；SCA 近年也在发展更全面的评价方式。它是品质分级，不保证你一定喜欢它的风味。',
          'Traditionally, coffee scoring 80+ points under the SCA cupping protocol has been called “specialty”; the SCA has since been developing broader assessment approaches. It’s a quality grade — not a promise you’ll love the flavour.',
        ),
        illustration: 'cupping-score',
        callout: { kind: 'tip', text: L('看不懂分数也没关系，你的口味才是最终标准。', 'Can’t read the scores? No problem — your taste is the final say.') },
      },
      {
        heading: L('可追溯性', 'Traceability'),
        body: L(
          '越来越多的豆袋会写出国家、产区、庄园或合作社、品种和处理法。有的烘焙商与生产者建立长期关系；“直接贸易”这类说法含义各不相同，可以问问具体指什么。',
          'More and more bags name the country, region, farm or co-op, variety and process. Some roasters build long-term relationships with producers; terms like “direct trade” mean different things — it’s fair to ask what they mean.',
        ),
        illustration: 'coffee-bag-label',
      },
      {
        heading: L('是谁种了你的咖啡', 'Who grows your coffee'),
        body: L(
          '世界上很多咖啡由小农户种植。咖啡价格波动很大，气候变化也在影响适合种植的土地。各种认证和溢价试图提供帮助，效果因地而异。',
          'Much of the world’s coffee is grown by smallholder farmers. Prices swing widely, and climate change is affecting where coffee can grow. Certifications and premiums try to help, with results that vary from place to place.',
        ),
        illustration: 'farmer-hands',
        callout: { kind: 'culture', text: L('云南的咖啡农也在经历从商品豆到精品豆的转变。', 'Yunnan’s farmers, too, are navigating a shift from commodity to specialty coffee.') },
      },
      {
        heading: L('中国的咖啡时刻', 'China’s coffee moment'),
        body: L(
          '从速溶咖啡和早期连锁店，到近些年城市里大量涌现的独立咖啡馆和连锁品牌，中国的咖啡文化正在快速成长，云南咖啡也越来越多地出现在菜单上。',
          'From instant coffee and early chains to a recent boom of independent and chain cafés in cities, China’s coffee culture is growing fast — and Yunnan beans increasingly appear on menus.',
        ),
        illustration: 'city-cafes',
      },
      {
        heading: L('尊重每一杯', 'Respect every cup'),
        body: L(
          '一杯用心冲的速溶、外婆的摩卡壶咖啡，和比赛级的手冲一样都是“真正的咖啡”。最好的咖啡，是适合此刻和此人的那一杯。',
          'A carefully made instant coffee or a grandmother’s moka pot is as “real” as a competition pour-over. The best coffee is the one that suits the moment and the person.',
        ),
        illustration: 'many-cups',
      },
    ],
  },
  {
    id: 'cul-waves-specialty-quiz',
    lessonId: 'cul-waves-specialty',
    kind: 'quiz',
    title: L('浪潮与精品小测', 'Waves & specialty check'),
    supportedModes: COG,
    questions: [
      {
        id: 'cul-waves-q1',
        prompt: L('“第三波咖啡”最好的描述是？', '“Third wave coffee” is best described as…'),
        options: [
          { id: 'a', text: L('一个宽泛的标签，指注重手工与产地的咖啡运动，2000 年代初开始流行', 'A loose label for the craft- and origin-focused coffee movement, popularised in the early 2000s'), correct: true, feedback: L('对，它是一种叙事，不是精确的定义。', 'Right — a narrative, not a precise definition.') },
          { id: 'b', text: L('一个科学定义、有明确开始日期的时代', 'A scientifically defined era with a fixed start date'), correct: false, feedback: L('浪潮相互重叠，各国情况不同，没有精确的起点。', 'The waves overlap and differ by country; there’s no exact start.') },
          { id: 'c', text: L('一种冲煮方法', 'A brewing method'), correct: false, feedback: L('它描述的是行业和文化的趋势，不是冲煮方法。', 'It describes industry and cultural trends, not a brewing method.') },
        ],
        explanation: L('把“浪潮”当作地图，而不是法律。', 'Treat the waves as a map, not a law.'),
      },
      {
        id: 'cul-waves-q2',
        prompt: L('豆袋上写着“精品咖啡”，这意味着？', 'A bag says “specialty”. This means…'),
        options: [
          { id: 'a', text: L('按某种品质评价方法被评为高品质；你可能喜欢也可能不喜欢它的风味', 'It was graded high-quality under a quality protocol; you may or may not enjoy its flavour'), correct: true, feedback: L('对，品质分级和个人口味是两回事。', 'Right — quality grades and personal taste are different things.') },
          { id: 'b', text: L('保证你会觉得好喝', 'It’s guaranteed to taste good to you'), correct: false, feedback: L('没有任何分级能预测你的个人喜好。', 'No grade can predict your personal preference.') },
          { id: 'c', text: L('它是有机咖啡', 'It’s organic'), correct: false, feedback: L('“精品”与有机认证无关，两者是不同的标准。', '“Specialty” has nothing to do with organic certification.') },
        ],
        explanation: L('品质 ≠ 偏好。', 'Quality ≠ preference.'),
      },
      {
        id: 'cul-waves-q3',
        prompt: L('下面哪种说法比较公允？', 'Which statement is fair?'),
        options: [
          { id: 'a', text: L('很多咖啡农面对价格波动，向烘焙商询问采购方式是合理的', 'Many farmers face volatile prices, and asking roasters about sourcing is reasonable'), correct: true, feedback: L('对，好奇和提问是支持生产者的一种方式。', 'Right — curiosity and questions are one way to support producers.') },
          { id: 'b', text: L('精品咖啡保证咖啡农得到公平的报酬', 'Specialty coffee guarantees farmers are paid fairly'), correct: false, feedback: L('品质分级本身不保证收入公平，要看具体的采购关系。', 'A quality grade alone doesn’t guarantee fair pay; it depends on the actual sourcing.') },
          { id: 'c', text: L('咖啡农决定全球咖啡价格', 'Farmers set global coffee prices'), correct: false, feedback: L('全球价格受市场、天气、汇率等多种因素影响，农户通常难以左右。', 'Global prices are driven by markets, weather, currencies and more — rarely by farmers.') },
        ],
        explanation: L('关心咖啡，也关心种咖啡的人。', 'Caring about coffee includes caring about who grows it.'),
      },
      {
        id: 'cul-waves-q4',
        prompt: L('关于速溶咖啡，哪种态度更合适？', 'Which attitude toward instant coffee fits best?'),
        options: [
          { id: 'a', text: L('它有自己的历史和风格（比如希腊冰咖啡），按它本来的样子欣赏', 'It’s a legitimate style with its own history (e.g. Greek frappé) — enjoy it for what it is'), correct: true, feedback: L('对，很多文化里的经典咖啡都用速溶。', 'Right — several classic drinks around the world use instant.') },
          { id: 'b', text: L('速溶“不算真正的咖啡”', 'Instant “isn’t real coffee”'), correct: false, feedback: L('速溶是用真正的咖啡制成的，只是工艺不同。', 'Instant is made from real coffee — just processed differently.') },
          { id: 'c', text: L('速溶里根本没有咖啡', 'Instant contains no coffee at all'), correct: false, feedback: L('速溶咖啡是把冲好的咖啡干燥后制成的。', 'Instant coffee is brewed coffee that has been dried.') },
        ],
        explanation: L('尊重每一杯咖啡和喝它的人。', 'Respect every cup — and the person drinking it.'),
      },
    ],
  },
  {
    id: 'cul-waves-specialty-reflect',
    lessonId: 'cul-waves-specialty',
    kind: 'reflect',
    title: L('你在哪一波？', 'Which wave are you riding?'),
    supportedModes: COG,
    prompts: [
      L('你平时喝的咖啡更像哪一波？你喜欢它的什么？', 'Which “wave” is your everyday coffee closest to? What do you like about it?'),
      L('下次买豆子时，你想问烘焙商什么问题？', 'What would you like to ask a roaster next time you buy beans?'),
      L('有没有一种你曾经看不上、后来却喜欢上的咖啡？', 'Is there a kind of coffee you once looked down on but came to enjoy?'),
    ],
  },
];

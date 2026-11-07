/**
 * Café Counter build specs: drinkId (from src/content/drinks.ts) → structure + acceptable ranges.
 *
 * DEFINITIONS VARY by café, country and era. Each spec is ONE common version, chosen to match the
 * illustrative recipes in the Drink Atlas so the two never contradict each other. The game says so
 * on every screen where a recipe card or result appears.
 */
import type { LocalizedText } from '../../domain/contracts';
import type { BuildSpecCore, CafeLevelId, Component, CompleteBuild } from './model';

const L = (zh: string, en: string): LocalizedText => ({ zh, en });

export interface BuildSpec extends BuildSpecCore {
  /** The one structural idea this drink teaches (recipe card + correct feedback). */
  keyPoint: LocalizedText;
  /** Drink-specific reasons shown when a component is off (fallback: generic text). */
  why: Partial<Record<Component, LocalizedText>>;
  /** Extra words on the ticket, e.g. a sugar level. */
  orderNote?: LocalizedText;
}

const base: Omit<CompleteBuild, 'method' | 'cup'> = {
  shots: 2,
  shotStyle: 'normal',
  water: 'none',
  waterMl: 100,
  milk: 'none',
  milkMl: 120,
  ice: false,
  extras: [],
};
const build = (p: Partial<CompleteBuild> & Pick<CompleteBuild, 'method' | 'cup'>): CompleteBuild => ({ ...base, ...p });

// Shared reasons
const W_NO_MILK_BLACK = L('这是一杯黑咖啡——不加奶。', 'This is a black coffee — no milk.');
const W_HOT = L('这杯是热饮，不加冰。', 'This one is served hot — no ice.');

export const BUILD_SPECS: readonly BuildSpec[] = [
  // ─────────────── Level 1 · Espresso bar basics ───────────────
  {
    drinkId: 'espresso-shot',
    level: 'bar',
    canonical: build({ method: 'espresso', cup: 'demitasse' }),
    accept: { method: ['espresso'], shots: [1, 2], shotStyle: ['normal'], water: ['none'], milk: ['none'], ice: [false], extras: [], cup: ['demitasse'] },
    keyPoint: L(
      '一小份浓缩（约 1:2，例如 18 克粉 → 约 36 克液体），什么都不加，装在浓缩小杯里。',
      'A small concentrated shot (≈1:2, e.g. 18 g in → about 36 g out), nothing added, in a demitasse.',
    ),
    why: {
      shotStyle: L('标准浓缩大约是 1:2——芮斯崔朵更短、朗戈更长。', 'A standard espresso sits around 1:2 — a ristretto is shorter, a lungo longer.'),
      water: L('加水就变成美式或长黑了——浓缩是直接喝的。', 'Adding water turns it into an americano or long black — an espresso is served straight.'),
      milk: L('加奶就成了玛奇朵、可塔朵等奶咖——浓缩不加奶。', 'Milk makes it a macchiato, cortado or more — an espresso is served straight.'),
      cup: L('一份浓缩只有约 20–40 毫升，用浓缩小杯能保温，也能看到油脂。', 'An espresso is only ~20–40 ml; a demitasse keeps it hot and shows off the crema.'),
    },
  },
  {
    drinkId: 'ristretto',
    level: 'bar',
    canonical: build({ method: 'espresso', shotStyle: 'ristretto', cup: 'demitasse' }),
    accept: { method: ['espresso'], shots: [1, 2], shotStyle: ['ristretto'], water: ['none'], milk: ['none'], ice: [false], extras: [], cup: ['demitasse'] },
    keyPoint: L(
      '“受限”的一份：同样的粉，流过的水更少（约 1:1–1:1.5），更短、更浓。',
      'A “restricted” shot: same coffee, less water through it (≈1:1–1:1.5) — shorter and more concentrated.',
    ),
    why: {
      shotStyle: L(
        'Ristretto 意为“受限”：在更少的液重处停止（例如 18 克 → 约 24 克），常配合稍细的研磨。',
        'Ristretto means “restricted”: stop at a shorter yield (e.g. 18 g → about 24 g), often with a slightly finer grind.',
      ),
      water: L('短萃的重点就是“少水、更浓”——事后加水正好相反。', 'A ristretto is all about less water — adding water afterwards does the opposite.'),
      cup: L('这么短的一份，用浓缩小杯。', 'A shot this short belongs in a demitasse.'),
    },
  },
  {
    drinkId: 'lungo',
    level: 'bar',
    canonical: build({ method: 'espresso', shotStyle: 'lungo', cup: 'small' }),
    accept: { method: ['espresso'], shots: [1, 2], shotStyle: ['lungo'], water: ['none'], milk: ['none'], ice: [false], extras: [], cup: ['demitasse', 'small'] },
    keyPoint: L(
      '长萃：让更多的水流过粉饼（约 1:2.5–1:3），之后不再额外加水。',
      'A long shot: more water runs through the puck (≈1:2.5–1:3). Nothing is added afterwards.',
    ),
    why: {
      shotStyle: L('Lungo 意为“长”：让萃取多流一会儿（例如 18 克 → 约 54 克）。', 'Lungo means “long”: let the shot run longer (e.g. 18 g → about 54 g).'),
      water: L(
        '朗戈不是美式：所有的水都流过咖啡粉，事后不再加水。',
        'A lungo is not an americano: all of its water passes through the coffee; nothing is added afterwards.',
      ),
      cup: L('约 50–60 毫升，浓缩小杯或小杯都可以。', 'About 50–60 ml — a demitasse or small cup both work.'),
    },
  },
  {
    drinkId: 'americano',
    level: 'bar',
    canonical: build({ method: 'espresso', water: 'after', waterMl: 150, cup: 'large' }),
    accept: {
      method: ['espresso'],
      shots: [1, 2],
      shotStyle: ['normal'],
      water: ['after'],
      waterMl: [150, 200],
      milk: ['none'],
      ice: [false],
      extras: [],
      cup: ['medium', 'large'],
    },
    keyPoint: L(
      '先萃浓缩，再加热水（例如双份 + 约 120–180 毫升），得到一杯更长、更淡的黑咖啡。',
      'Espresso first, then hot water (e.g. a double + ~120–180 ml) — a longer, lighter black coffee.',
    ),
    why: {
      water: L(
        '美式是在浓缩之后加热水；先放水再把浓缩萃在上面，是长黑。',
        'An americano adds the hot water after the shot. Water first with the shot on top is a long black.',
      ),
      waterMl: L('美式一般加约 120–180 毫升水——真实做的时候按口味调整。', 'An americano typically adds about 120–180 ml of water — adjust to taste in real life.'),
      shotStyle: L('从标准浓缩开始，加长的工作交给热水。', 'Start from a normal shot; the water does the lengthening.'),
      milk: W_NO_MILK_BLACK,
      cup: L('浓缩加上一百多毫升水，需要马克杯或中杯。', 'A shot plus 150-odd ml of water needs a cup or mug.'),
    },
  },
  {
    drinkId: 'long-black',
    level: 'bar',
    canonical: build({ method: 'espresso', water: 'before', waterMl: 100, cup: 'medium' }),
    accept: {
      method: ['espresso'],
      shots: [2],
      shotStyle: ['normal', 'ristretto'],
      water: ['before'],
      waterMl: [100],
      milk: ['none'],
      ice: [false],
      extras: [],
      cup: ['small', 'medium'],
    },
    keyPoint: L(
      '先在杯里放热水，再把双份浓缩萃在上面——水比美式少，油脂也能留在表面。',
      'Hot water in the cup first, then a double shot on top — less water than an americano, and the crema survives.',
    ),
    why: {
      water: L(
        '顺序很重要：长黑是把浓缩倒在热水上，油脂留在表面；先浓缩后加水是美式。',
        'Order matters: a long black pours the shot onto hot water, so the crema stays on top. Shot first, then water, is an americano.',
      ),
      waterMl: L('长黑通常比美式水少——约 100–120 毫升。', 'A long black usually uses less water than an americano — about 100–120 ml.'),
      shots: L('长黑通常用双份浓缩。', 'A long black is usually built on a double shot.'),
      milk: W_NO_MILK_BLACK,
      cup: L('总量约 130–150 毫升，用小杯或中杯。', 'About 130–150 ml in total: a small cup or regular cup.'),
    },
  },
  {
    drinkId: 'affogato',
    level: 'bar',
    canonical: build({ method: 'espresso', extras: ['ice-cream'], cup: 'small' }),
    accept: {
      method: ['espresso'],
      shots: [1, 2],
      shotStyle: ['normal', 'ristretto'],
      water: ['none'],
      milk: ['none'],
      ice: [false],
      extras: ['ice-cream'],
      cup: ['small', 'medium'],
    },
    keyPoint: L(
      '“淹没”的冰淇淋：一球香草冰淇淋，浇上一份热浓缩——在意大利当甜点吃。',
      '“Drowned” ice cream: a scoop of vanilla gelato with a hot shot poured over — served as a dessert.',
    ),
    why: {
      extras: L('Affogato 意为“淹没”——浓缩浇在一球冰淇淋上。', 'Affogato means “drowned” — the espresso is poured over a scoop of ice cream.'),
      ice: L('不加冰块——冰凉来自冰淇淋。', 'No ice cubes — the cold comes from the ice cream.'),
      milk: L('不加奶：冰淇淋已经带来了奶香。', 'No milk: the ice cream already brings the creaminess.'),
      cup: L('小玻璃杯或小碗正好装下一球冰淇淋和一份浓缩。', 'A small glass or bowl holds the scoop and the shot.'),
    },
  },

  // ─────────────── Level 2 · Milk classics ───────────────
  {
    drinkId: 'espresso-macchiato',
    level: 'milk',
    canonical: build({ method: 'espresso', milk: 'foam', milkMl: 15, cup: 'demitasse' }),
    accept: {
      method: ['espresso'],
      shots: [1, 2],
      shotStyle: ['normal'],
      water: ['none'],
      milk: ['foam', 'microfoam'],
      milkMl: [15],
      ice: [false],
      extras: [],
      cup: ['demitasse'],
    },
    keyPoint: L(
      '“做了记号”的浓缩：一份浓缩，表面只点一两勺奶泡（约 10–20 毫升）。',
      '“Marked” espresso: a shot with just a spoonful or two of foam on top (~10–20 ml).',
    ),
    why: {
      milkMl: L('Macchiato 意为“标记、点染”——只点一点奶泡，不是一杯奶。', 'Macchiato means “marked” or “stained” — only a dot of foam, not a cup of milk.'),
      milk: L('这个“记号”就是浓缩表面的一点奶泡。', 'The “mark” is a little foam on top of the shot.'),
      cup: L('它仍然是浓缩的大小：用浓缩小杯。', 'It stays espresso-sized: a demitasse.'),
    },
  },
  {
    drinkId: 'cortado',
    level: 'milk',
    canonical: build({ method: 'espresso', milk: 'steamed', milkMl: 50, cup: 'small' }),
    accept: {
      method: ['espresso'],
      shots: [2],
      shotStyle: ['normal'],
      water: ['none'],
      milk: ['steamed', 'microfoam'],
      milkMl: [50],
      ice: [false],
      extras: [],
      cup: ['small'],
    },
    keyPoint: L(
      '用差不多等量的热奶（约 40–60 毫升）“切”一下浓缩，几乎没有奶泡，常用小玻璃杯。',
      'Espresso “cut” with about as much warm milk (~40–60 ml), very little foam, often in a small glass.',
    ),
    why: {
      milkMl: L('Cortado 意为“切”：奶和咖啡差不多一样多——比澳白、拿铁少得多。', 'Cortado means “cut”: roughly as much milk as coffee — far less than a flat white or latte.'),
      milk: L('可塔朵几乎没有奶泡——是温热的蒸奶，不是蓬松的奶泡帽。', 'A cortado has very little foam — warm steamed milk, not an airy cap.'),
      cup: L('总量约 80–100 毫升，正好一个小玻璃杯。', 'About 80–100 ml in total fits a small glass or cup.'),
      shots: L('这里用双份浓缩，和奶大约一比一。', 'Here it’s a double shot, roughly matched one-to-one with milk.'),
    },
  },
  {
    drinkId: 'cappuccino',
    level: 'milk',
    canonical: build({ method: 'espresso', milk: 'foam', milkMl: 120, cup: 'medium' }),
    accept: {
      method: ['espresso'],
      shots: [1, 2],
      shotStyle: ['normal'],
      water: ['none'],
      milk: ['foam'],
      milkMl: [120],
      ice: [false],
      extras: [],
      cup: ['medium'],
    },
    keyPoint: L(
      '浓缩 + 蒸奶 + 一层厚而蓬松的奶泡（约 1–1.5 厘米），装在约 150–180 毫升的杯子里。',
      'Espresso, steamed milk and a thick, airy foam cap (~1–1.5 cm) in a ~150–180 ml cup.',
    ),
    why: {
      milk: L('卡布奇诺的标志是厚而蓬松的奶泡——比拿铁和澳白都多。', 'A cappuccino is defined by its thick, airy foam — more foam than a latte or flat white.'),
      milkMl: L('大约 100–120 毫升奶——卡布奇诺比拿铁小。', 'Around 100–120 ml of milk — a cappuccino is smaller than a latte.'),
      cup: L('经典卡布奇诺杯约 150–180 毫升。', 'A classic cappuccino cup holds about 150–180 ml.'),
    },
  },
  {
    drinkId: 'flat-white',
    level: 'milk',
    canonical: build({ method: 'espresso', milk: 'microfoam', milkMl: 120, cup: 'medium' }),
    accept: {
      method: ['espresso'],
      shots: [2],
      shotStyle: ['normal', 'ristretto'],
      water: ['none'],
      milk: ['microfoam'],
      milkMl: [120],
      ice: [false],
      extras: [],
      cup: ['medium'],
    },
    keyPoint: L(
      '双份浓缩（或短萃）+ 约 100–130 毫升细腻、薄的奶泡，约 160–180 毫升的杯子——咖啡味更突出。',
      'A double (or ristretto) with ~100–130 ml of silky, thin microfoam in a ~160–180 ml cup — coffee-forward.',
    ),
    why: {
      milk: L(
        '澳白的奶泡通常比卡布奇诺更薄——是丝滑的细奶泡，不是蓬松的奶泡帽。',
        'A flat white usually has a thinner microfoam layer than a cappuccino — silky milk, not an airy cap.',
      ),
      milkMl: L('奶比拿铁少（约 100–130 毫升），咖啡味更明显。', 'Less milk than a latte (~100–130 ml), so the coffee stays in front.'),
      cup: L('澳白比拿铁小：约 160–180 毫升的杯子。', 'A flat white is smaller than a latte: a ~160–180 ml cup.'),
      shots: L('澳白通常用双份浓缩（有时是短萃）。', 'Flat whites are usually built on a double shot (sometimes ristretto).'),
    },
  },
  {
    drinkId: 'caffe-latte',
    level: 'milk',
    canonical: build({ method: 'espresso', milk: 'microfoam', milkMl: 200, cup: 'large' }),
    accept: {
      method: ['espresso'],
      shots: [1, 2],
      shotStyle: ['normal', 'ristretto'],
      water: ['none'],
      milk: ['microfoam', 'steamed'],
      milkMl: [200],
      ice: [false],
      extras: [],
      cup: ['large'],
    },
    keyPoint: L(
      '最“奶”的经典款：双份浓缩 + 约 180–250 毫升蒸奶，表面一层薄奶泡（约 0.5–1 厘米），大杯。',
      'The milkiest classic: a double with ~180–250 ml steamed milk and a thin foam layer (~0.5–1 cm) in a big cup.',
    ),
    why: {
      milkMl: L('拿铁是经典奶咖里奶最多的——约 180–250 毫升。', 'A latte has the most milk of the classics — roughly 180–250 ml.'),
      milk: L('拿铁的奶泡是薄而丝滑的一层——厚奶泡会让它更像卡布奇诺。', 'A latte’s foam is a thin, silky layer — thick airy foam makes it closer to a cappuccino.'),
      cup: L('这么多奶需要马克杯或高玻璃杯（约 250–350 毫升）。', 'All that milk needs a mug or tall glass (~250–350 ml).'),
    },
  },
  {
    drinkId: 'mocha',
    level: 'milk',
    canonical: build({ method: 'espresso', milk: 'microfoam', milkMl: 200, extras: ['chocolate'], cup: 'large' }),
    accept: {
      method: ['espresso'],
      shots: [2],
      shotStyle: ['normal'],
      water: ['none'],
      milk: ['microfoam', 'steamed'],
      milkMl: [200],
      ice: [false],
      extras: ['chocolate'],
      cup: ['large'],
    },
    keyPoint: L(
      '加了巧克力的拿铁：杯底放巧克力酱，加入浓缩搅匀，再倒入蒸奶。',
      'A latte with chocolate: chocolate sauce in the mug, the shot stirred in, then steamed milk.',
    ),
    why: {
      extras: L('摩卡需要巧克力——这正是它和拿铁的区别。', 'A mocha needs chocolate — that’s the whole difference from a latte.'),
      milkMl: L('和拿铁一样，约 150–200 毫升蒸奶。', 'Like a latte: about 150–200 ml of steamed milk.'),
      milk: L('用热的蒸奶，表面一层薄奶泡。', 'Hot steamed milk with a thin layer of foam.'),
      cup: L('巧克力 + 浓缩 + 一大杯奶，需要马克杯。', 'Chocolate + shot + lots of milk needs a mug.'),
    },
  },
  {
    drinkId: 'iced-latte',
    level: 'milk',
    canonical: build({ method: 'espresso', milk: 'cold', milkMl: 200, ice: true, cup: 'large' }),
    accept: {
      method: ['espresso'],
      shots: [2],
      shotStyle: ['normal'],
      water: ['none'],
      milk: ['cold'],
      milkMl: [200],
      ice: [true],
      extras: [],
      cup: ['large'],
    },
    keyPoint: L(
      '高杯里放冰块和冷牛奶，再把双份浓缩倒在上面——不需要打奶。',
      'Ice and cold milk in a tall glass with a double shot poured on top — no steaming.',
    ),
    why: {
      milk: L('冰拿铁用冷牛奶；热奶会让冰块融化，奶泡也会塌。', 'Iced lattes use cold milk; steamed milk would melt the ice and the foam collapses.'),
      ice: L('冰拿铁就是建立在冰块上的。', 'It’s built over ice.'),
      milkMl: L('约 150–200 毫升冷牛奶。', 'About 150–200 ml of cold milk.'),
      cup: L('冰块 + 约 200 毫升奶 + 浓缩，需要高玻璃杯。', 'Ice + ~200 ml milk + a shot needs a tall glass.'),
    },
  },

  // ─────────────── Level 3 · World café ───────────────
  {
    drinkId: 'vietnamese-phin',
    level: 'world',
    canonical: build({ method: 'phin', ice: true, extras: ['condensed-milk'], cup: 'large' }),
    accept: { method: ['phin'], water: ['none'], milk: ['none'], ice: [true], extras: ['condensed-milk'], cup: ['medium', 'large'] },
    keyPoint: L(
      '浓咖啡透过 phin 慢慢滴在炼乳上，搅匀后倒在冰上。',
      'Strong coffee drips slowly through a phin onto sweetened condensed milk; stir and pour over ice.',
    ),
    why: {
      method: L(
        '越南冰奶咖用 phin 冲煮——放在杯口的小金属滴滤器，滴大约 4–5 分钟。',
        'Cà phê sữa đá is brewed in a phin — a small metal drip filter that sits on the glass and drips for ~4–5 minutes.',
      ),
      extras: L('“Sữa”是奶——这里指甜炼乳，不是鲜奶。', '“Sữa” means milk — here sweetened condensed milk, not fresh milk.'),
      milk: L('不加鲜奶：炼乳就是这杯的“奶”。', 'No fresh milk: the condensed milk is the “milk”.'),
      ice: L('“Đá”是冰——这位客人点的是冰的版本。', '“Đá” means ice — this order is the iced version.'),
      cup: L('冰块加咖啡和炼乳，用中杯或高玻璃杯。', 'Ice, coffee and condensed milk fit a cup or tall glass.'),
    },
  },
  {
    drinkId: 'yuenyeung',
    level: 'world',
    canonical: build({ method: 'moka', extras: ['milk-tea'], cup: 'large' }),
    accept: {
      method: ['moka', 'espresso'],
      shots: [1, 2],
      shotStyle: ['normal', 'ristretto', 'lungo'],
      water: ['none', 'after'],
      milk: ['none'],
      ice: [true, false],
      extras: ['milk-tea'],
      cup: ['large'],
    },
    keyPoint: L(
      '香港的“鸳鸯”：浓咖啡兑港式奶茶（红茶 + 淡奶），常说大约三分咖啡七分茶。',
      'Hong Kong’s pairing: strong coffee mixed with HK-style milk tea (black tea + evaporated milk), often said to be about 3 parts coffee to 7 parts tea.',
    ),
    why: {
      extras: L('鸳鸯 = 咖啡 + 奶茶。没有茶，就只是咖啡。', 'Yuenyeung = coffee + milk tea. Without the tea it’s just coffee.'),
      milk: L('奶已经在奶茶里（淡奶）——不需要另外的蒸奶。', 'The milk comes in the milk tea (evaporated milk) — no separate steamed milk.'),
      method: L('茶餐厅常用很浓的冲煮咖啡；在家可以用摩卡壶（或意式浓缩）。', 'Cha chaan tengs use strong brewed coffee; a moka pot (or espresso) makes a good home version.'),
      cup: L('咖啡加奶茶是一大杯的量。', 'Coffee plus milk tea is a mug-sized drink.'),
    },
  },
  {
    drinkId: 'cafe-de-olla',
    level: 'world',
    canonical: build({ method: 'pot', extras: ['cinnamon-piloncillo'], cup: 'medium' }),
    accept: { method: ['pot'], water: ['none'], milk: ['none'], ice: [false], extras: ['cinnamon-piloncillo'], cup: ['medium', 'large'] },
    keyPoint: L(
      '把水和肉桂、粗糖（piloncillo）一起煮，离火后放入咖啡浸泡，再过滤——传统上用陶罐（olla）。',
      'Simmer water with cinnamon and piloncillo, take it off the heat, steep the coffee, strain — traditionally in a clay pot (olla).',
    ),
    why: {
      method: L('Café de olla 在锅（陶罐）里浸泡——“olla”就是锅的意思。', 'Café de olla is steeped in a pot — “olla” means pot.'),
      extras: L('肉桂和 piloncillo（未精制蔗糖）是它的灵魂。', 'Cinnamon and piloncillo (unrefined cane sugar) are what make it café de olla.'),
      milk: L('传统做法不加奶。', 'Traditionally served without milk.'),
      ice: W_HOT,
      cup: L('常用陶杯（jarrito），一般是中杯或马克杯大小。', 'Often served in a clay jarrito — cup or mug sized.'),
    },
  },
  {
    drinkId: 'turkish-coffee',
    level: 'world',
    canonical: build({ method: 'ibrik', extras: ['sugar'], cup: 'demitasse' }),
    accept: { method: ['ibrik'], water: ['none'], milk: ['none'], ice: [false], extras: ['sugar'], cup: ['demitasse'] },
    orderNote: L('要中等甜度（orta）。', 'Medium sweet (orta), please.'),
    keyPoint: L(
      '极细的咖啡粉、冷水和（按要求的）糖一起放进土耳其壶加热到起泡；不过滤，倒进小杯，旁边配一杯水。',
      'Powder-fine coffee, cold water and (if asked) sugar heated together in a cezve until it foams; served unfiltered in a small cup with water on the side.',
    ),
    why: {
      method: L('土耳其咖啡用 cezve/ibrik 煮——咖啡粉留在杯中，不过滤。', 'Turkish coffee is made in a cezve/ibrik — the grounds stay in the cup, unfiltered.'),
      extras: L(
        '糖要在加热前放进壶里——之后再搅会破坏泡沫。这位客人点的是中等甜度。',
        'Sugar goes into the cezve before heating — stirring it in later would ruin the foam. This customer asked for medium sweet.',
      ),
      milk: L('传统上不加奶。', 'Traditionally served without milk.'),
      ice: W_HOT,
      cup: L('用小杯（fincan）盛，约 60–70 毫升。', 'It’s served in a small cup (fincan), about 60–70 ml.'),
    },
  },
  {
    drinkId: 'cafe-cubano',
    level: 'world',
    canonical: build({ method: 'moka', extras: ['sugar'], cup: 'demitasse' }),
    accept: {
      method: ['moka', 'espresso'],
      shots: [1, 2],
      shotStyle: ['normal', 'ristretto'],
      water: ['none'],
      milk: ['none'],
      ice: [false],
      extras: ['sugar'],
      cup: ['demitasse'],
    },
    keyPoint: L(
      '摩卡壶（或意式）浓咖啡，加入打发成浅色泡沫的糖（espumita）——小杯、甜、浓。',
      'Strong moka-pot (or espresso) coffee with sugar whipped into a pale foam (espumita) — small, sweet and strong.',
    ),
    why: {
      extras: L(
        '糖是这杯饮品的一部分：和最先流出的几滴咖啡一起打成“espumita”泡沫。',
        'The sugar is part of the drink: whipped with the first drops of coffee into “espumita”.',
      ),
      method: L('家里通常用摩卡壶，咖啡馆用意式咖啡机。', 'At home it’s usually a moka pot; cafés use an espresso machine.'),
      milk: L('古巴咖啡不加奶（加奶的叫 cortadito）。', 'A cubano has no milk (with milk it becomes a cortadito).'),
      cup: L('用很小的杯子——常常倒成一壶“colada”和朋友分着喝。', 'Served in tiny cups — often shared out of a larger “colada”.'),
      ice: W_HOT,
    },
  },
  {
    drinkId: 'arabic-qahwa',
    level: 'world',
    canonical: build({ method: 'pot', extras: ['cardamom'], cup: 'demitasse' }),
    accept: { method: ['pot'], water: ['none'], milk: ['none'], ice: [false], extras: ['cardamom'], cup: ['demitasse'] },
    keyPoint: L(
      '浅烘咖啡在锅里慢煮，加小豆蔻调香，从 dallah 壶倒进无把小杯——通常不加糖，配椰枣。',
      'Light-roast coffee simmered in a pot, spiced with cardamom, poured from a dallah into tiny handleless cups — usually unsweetened, with dates.',
    ),
    why: {
      extras: L(
        '小豆蔻是招牌香料；阿拉伯咖啡通常不加糖——甜味来自一旁的椰枣。',
        'Cardamom is the signature spice; gahwa is usually unsweetened — the sweetness comes from dates on the side.',
      ),
      method: L('阿拉伯咖啡在锅里慢煮，再倒进 dallah 壶里待客。', 'Gahwa is simmered in a pot, then poured into a dallah for serving.'),
      milk: L('传统上不加奶。', 'Traditionally served without milk.'),
      ice: W_HOT,
      cup: L('用无把小杯（finjan）盛，只倒小半杯。', 'It’s served in small handleless cups (finjan), poured only partly full.'),
    },
  },
];

const SPEC_INDEX = new Map(BUILD_SPECS.map((s) => [s.drinkId, s]));
export const getBuildSpec = (drinkId: string): BuildSpec | undefined => SPEC_INDEX.get(drinkId);
export const specsForLevel = (level: CafeLevelId): BuildSpec[] => BUILD_SPECS.filter((s) => s.level === level);

// ───────────────────────────── customers ─────────────────────────────
export interface Customer {
  id: string;
  name: LocalizedText;
  /** Avatar tint token suffix (decorative). */
  tone: 'accent' | 'culture' | 'info' | 'success' | 'warning' | 'crema';
}

export const CUSTOMERS: readonly Customer[] = [
  { id: 'mei', name: L('小美', 'Mei'), tone: 'culture' },
  { id: 'luca', name: L('卢卡', 'Luca'), tone: 'accent' },
  { id: 'amara', name: L('阿玛拉', 'Amara'), tone: 'success' },
  { id: 'diego', name: L('迭戈', 'Diego'), tone: 'warning' },
  { id: 'linh', name: L('阿玲', 'Linh'), tone: 'info' },
  { id: 'kenji', name: L('健二', 'Kenji'), tone: 'crema' },
  { id: 'fatima', name: L('法蒂玛', 'Fatima'), tone: 'accent' },
  { id: 'sofia', name: L('索菲亚', 'Sofia'), tone: 'culture' },
  { id: 'omar', name: L('奥马尔', 'Omar'), tone: 'info' },
  { id: 'ana', name: L('安娜', 'Ana'), tone: 'success' },
  { id: 'tom', name: L('汤姆', 'Tom'), tone: 'warning' },
  { id: 'priya', name: L('普丽娅', 'Priya'), tone: 'crema' },
];

/** Polite order phrasings; `d` is the drink name in the same locale. */
export const ORDER_LINES: ReadonlyArray<(d: LocalizedText) => LocalizedText> = [
  (d) => L(`请给我一杯${d.zh}。`, `One ${d.en}, please.`),
  (d) => L(`能帮我做一杯${d.zh}吗？`, `Could I get one ${d.en}?`),
  (d) => L(`我想要一杯${d.zh}，谢谢！`, `I’d love one ${d.en}, thanks!`),
  (d) => L(`一杯${d.zh}，在这儿喝。`, `One ${d.en} for here, please.`),
];

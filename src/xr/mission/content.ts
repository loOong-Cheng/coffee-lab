/**
 * Bilingual mission content (colocated LocalizedText, per CONTRACTS §4).
 * Wording rules: beginner-first, no taste predictions, no claims of sensing
 * real touch/force; numbers are illustrative starting points.
 */
import type { LocalizedText } from '../../domain/contracts';
import type { FeedbackCode, InspectableId, StepId } from './types';
import { RECIPE } from './extraction';

export interface StepContent {
  id: StepId;
  title: LocalizedText;
  /** Instruction when using controllers in a headset. */
  doXr: LocalizedText;
  /** Instruction for mouse/touch (and the keyboard action list). */
  doScreen: LocalizedText;
  /** Why this step matters (shown on completion and in hints). */
  why: LocalizedText;
}

export const STEP_ORDER: readonly StepId[] = [
  'locate',
  'grab-portafilter',
  'dose',
  'tamp',
  'attach',
  'place-cup',
  'tare',
  'brew',
  'stop',
  'serve',
  'remove',
  'knock-out',
  'flush',
];

export const STEPS: Record<StepId, StepContent> = {
  locate: {
    id: 'locate',
    title: { en: 'Find the espresso machine', zh: '找到意式咖啡机' },
    doXr: {
      en: 'Point your controller ray at the espresso machine and pull the trigger. Point at any tool to read what it does.',
      zh: '用手柄射线指向咖啡机并扣动扳机。指向任意工具即可查看它的用途。',
    },
    doScreen: {
      en: 'Click or tap the espresso machine. Hover over (or tap) any tool to read what it does.',
      zh: '点击咖啡机。把鼠标悬停在（或轻点）任意工具上，可查看它的用途。',
    },
    why: {
      en: 'Knowing where each tool lives keeps the workflow smooth: grinder → tamping mat → machine → scale.',
      zh: '先熟悉每样工具的位置，流程才顺：磨豆机 → 压粉垫 → 咖啡机 → 秤。',
    },
  },
  'grab-portafilter': {
    id: 'grab-portafilter',
    title: { en: 'Pick up the portafilter', zh: '拿起手柄' },
    doXr: {
      en: 'Reach the portafilter on the tamping mat and hold the grip (side) button. Or point at it and squeeze to pull it to your hand.',
      zh: '伸手到压粉垫上的手柄处，按住握持键（侧键）。也可以用射线指向它，再按握持键把它拉到手里。',
    },
    doScreen: {
      en: 'Press on the portafilter (handle with a metal basket) on the tamping mat and drag it.',
      zh: '按住压粉垫上的手柄（带金属粉碗的把手）并拖动。',
    },
    why: {
      en: 'The portafilter holds the basket of ground coffee and locks into the machine.',
      zh: '手柄里装着盛咖啡粉的粉碗，最后要扣进咖啡机。',
    },
  },
  dose: {
    id: 'dose',
    title: { en: 'Dose: grind into the basket', zh: '取粉：把咖啡粉磨进粉碗' },
    doXr: {
      en: "Rest the portafilter in the grinder's fork, let go, then press the grinder's green button.",
      zh: '把手柄架到磨豆机的支架上，松手，然后按磨豆机的绿色按钮。',
    },
    doScreen: {
      en: "Drop the portafilter onto the grinder's fork, then click the grinder's green button.",
      zh: '把手柄拖到磨豆机支架上松开，再点击磨豆机的绿色按钮。',
    },
    why: {
      en: `Ground coffee loses aroma quickly, so grind right before brewing. This simulated grinder doses ${RECIPE.doseG} g for you; with a real grinder, weigh your dose.`,
      zh: `咖啡粉磨好后香气流失很快，所以要现磨现做。这台模拟磨豆机会自动出 ${RECIPE.doseG} 克粉；用真实磨豆机时请称重。`,
    },
  },
  tamp: {
    id: 'tamp',
    title: { en: 'Tamp the grounds', zh: '压粉' },
    doXr: {
      en: 'Rest the portafilter on the tamping mat (or hold it in your other hand). Grab the tamper and press it straight down into the basket — keep it level.',
      zh: '把手柄放在压粉垫上（或用另一只手拿着）。拿起压粉器，垂直压进粉碗——保持水平。',
    },
    doScreen: {
      en: 'Put the portafilter back on the tamping mat, then drag the tamper onto the basket.',
      zh: '把手柄放回压粉垫，然后把压粉器拖到粉碗上。',
    },
    why: {
      en: "Tamping makes an even, compact coffee bed so water flows through evenly. This simulation can't feel pressure — a firm, level tamp is something to practise by hand.",
      zh: '压粉让粉层平整紧实，水才能均匀地穿过。模拟无法感知力度——用力均匀、保持水平需要你亲手练习。',
    },
  },
  attach: {
    id: 'attach',
    title: { en: 'Lock the portafilter into the group head', zh: '把手柄扣入冲煮头' },
    doXr: {
      en: 'Lift the portafilter up under the group head with the handle pointing toward you. Let go when its ring turns green — it twists in to lock.',
      zh: '把手柄举到冲煮头正下方，把手朝向自己。圆环变绿时松手——它会旋转扣紧。',
    },
    doScreen: {
      en: 'Drag the portafilter to the group head under the front of the machine and release.',
      zh: '把手柄拖到咖啡机前方下侧的冲煮头处再松开。',
    },
    why: {
      en: 'The group head seals against the basket so hot, pressurised water is pushed through the coffee instead of around it.',
      zh: '冲煮头与粉碗紧密贴合，带压力的热水才会穿过咖啡粉，而不是绕过去。',
    },
  },
  'place-cup': {
    id: 'place-cup',
    title: { en: 'Put the cup on the scale', zh: '把杯子放到秤上' },
    doXr: {
      en: 'Grab the cup and set it on the scale on the drip tray, right under the spouts.',
      zh: '拿起杯子，放到滴水盘上的秤上，正对出液口下方。',
    },
    doScreen: {
      en: 'Drag the cup onto the scale under the portafilter spouts.',
      zh: '把杯子拖到出液口下方的秤上。',
    },
    why: {
      en: 'The cup must sit under the spouts, and the scale shows how much espresso lands in it.',
      zh: '杯子要对准出液口，秤能告诉你杯里有多少咖啡液。',
    },
  },
  tare: {
    id: 'tare',
    title: { en: 'Tare (zero) the scale', zh: '秤归零（去皮）' },
    doXr: {
      en: "Point at the scale's TARE button and pull the trigger, so it reads 0.0 g with the cup on it.",
      zh: '用射线指向秤上的「去皮」键并扣动扳机，让放着杯子的秤显示 0.0 克。',
    },
    doScreen: {
      en: "Click the scale's TARE button so it reads 0.0 g with the cup on it.",
      zh: '点击秤上的「去皮」键，让放着杯子的秤显示 0.0 克。',
    },
    why: {
      en: 'Taring subtracts the cup, so the number you watch is only your espresso.',
      zh: '去皮会扣掉杯子的重量，你看到的读数就只是咖啡液。',
    },
  },
  brew: {
    id: 'brew',
    title: { en: 'Start the shot', zh: '开始萃取' },
    doXr: {
      en: 'Point at the amber brew button on the machine and pull the trigger.',
      zh: '用射线指向咖啡机上的琥珀色冲煮按钮并扣动扳机。',
    },
    doScreen: {
      en: 'Click the amber brew button on the machine.',
      zh: '点击咖啡机上的琥珀色冲煮按钮。',
    },
    why: {
      en: 'The machine pushes hot water through the coffee puck. Watch the scale — the weight in the cup is what you control.',
      zh: '机器把热水压过粉饼。盯住秤——杯中的重量才是你要掌控的。',
    },
  },
  stop: {
    id: 'stop',
    title: { en: `Stop near ${RECIPE.targetYieldG} g`, zh: `在约 ${RECIPE.targetYieldG} 克时停止` },
    doXr: {
      en: `Watch the scale and press the brew button again as it nears ${RECIPE.targetYieldG} g. A few drops still fall after you stop.`,
      zh: `看着秤，快到 ${RECIPE.targetYieldG} 克时再按一次冲煮按钮。停止后还会滴下几滴。`,
    },
    doScreen: {
      en: `Watch the scale and click the brew button again as it nears ${RECIPE.targetYieldG} g. A few drops still fall after you stop.`,
      zh: `看着秤，快到 ${RECIPE.targetYieldG} 克时再点一次冲煮按钮。停止后还会滴下几滴。`,
    },
    why: {
      en: `${RECIPE.doseG} g in → ${RECIPE.targetYieldG} g out is a 1:2 ratio, a common starting point. It is illustrative: real recipes vary with beans, grinder and taste.`,
      zh: `${RECIPE.doseG} 克粉 → ${RECIPE.targetYieldG} 克液，是 1:2 的粉液比，一个常见的起点。这只是示例：真实配方因豆子、磨豆机和口味而异。`,
    },
  },
  serve: {
    id: 'serve',
    title: { en: 'Move the espresso to the serving board', zh: '把咖啡端到出品板' },
    doXr: {
      en: 'Grab the cup and set it on the wooden serving board.',
      zh: '拿起杯子，放到木质出品板上。',
    },
    doScreen: {
      en: 'Drag the cup to the wooden serving board.',
      zh: '把杯子拖到木质出品板上。',
    },
    why: {
      en: 'Clear the drip tray before cleaning, so rinse water never lands in a drink.',
      zh: '清洁前先把杯子移走，冲洗水就不会流进饮品。',
    },
  },
  remove: {
    id: 'remove',
    title: { en: 'Remove the portafilter', zh: '取下手柄' },
    doXr: {
      en: 'Grab the portafilter at the group head to unlock and take it out.',
      zh: '握住冲煮头上的手柄，把它解锁取下。',
    },
    doScreen: {
      en: 'Drag the portafilter away from the group head.',
      zh: '把手柄从冲煮头上拖下来。',
    },
    why: {
      en: 'Only remove it once the shot has stopped: on a real machine the group head is hot and was under pressure.',
      zh: '必须等萃取停止后才能取下：真实咖啡机的冲煮头很烫，萃取时还带着压力。',
    },
  },
  'knock-out': {
    id: 'knock-out',
    title: { en: 'Knock out the used puck', zh: '敲掉粉饼' },
    doXr: {
      en: 'Bring the portafilter over the knock box and let go.',
      zh: '把手柄移到敲渣桶上方再松手。',
    },
    doScreen: {
      en: 'Drag the portafilter onto the knock box.',
      zh: '把手柄拖到敲渣桶上。',
    },
    why: {
      en: 'The used coffee "puck" goes into the knock box so the basket is clean for the next shot.',
      zh: '用过的咖啡「粉饼」倒进敲渣桶，粉碗就干净了，方便下一杯。',
    },
  },
  flush: {
    id: 'flush',
    title: { en: 'Flush the group head', zh: '冲洗冲煮头' },
    doXr: {
      en: 'With the portafilter out and the cup moved away, press the brew button for a short rinse.',
      zh: '手柄已取下、杯子已移开后，按一下冲煮按钮做短暂冲洗。',
    },
    doScreen: {
      en: 'With the portafilter out and the cup moved away, click the brew button for a short rinse.',
      zh: '手柄已取下、杯子已移开后，点击冲煮按钮做短暂冲洗。',
    },
    why: {
      en: "A quick flush rinses loose grounds off the shower screen. For real cleaning, follow your machine's manual.",
      zh: '短暂放水能冲掉分水网上的残粉。真实清洁请按你的机器说明书操作。',
    },
  },
};

/** Tool info for hover/inspect panels — so an XR-only learner still learns what each tool is. */
export const TOOL_INFO: Record<InspectableId, { name: LocalizedText; purpose: LocalizedText }> = {
  'espresso-machine': {
    name: { en: 'Espresso machine', zh: '意式咖啡机' },
    purpose: {
      en: 'Heats water and pushes it through finely ground coffee under pressure.',
      zh: '加热清水，并用压力把水压过细研磨的咖啡粉。',
    },
  },
  'group-head': {
    name: { en: 'Group head', zh: '冲煮头' },
    purpose: {
      en: 'Where the hot water comes out. The portafilter locks in underneath.',
      zh: '热水流出的地方，手柄扣在它下方。',
    },
  },
  'brew-button': {
    name: { en: 'Brew button', zh: '冲煮按钮' },
    purpose: { en: 'Starts and stops the water (simulated).', zh: '开始 / 停止出水（模拟）。' },
  },
  'drip-tray': {
    name: { en: 'Drip tray', zh: '滴水盘' },
    purpose: { en: 'Catches drips. The scale and cup sit on it.', zh: '接住滴落的水，秤和杯子放在上面。' },
  },
  grinder: {
    name: { en: 'Grinder', zh: '磨豆机' },
    purpose: {
      en: 'Grinds beans fresh — very fine for espresso. Its fork holds the portafilter.',
      zh: '现磨咖啡豆——意式需要很细的研磨。支架可以托住手柄。',
    },
  },
  scale: {
    name: { en: 'Scale', zh: '电子秤' },
    purpose: { en: 'Weighs the espresso in the cup. TARE zeroes it.', zh: '称量杯中的咖啡液，「去皮」键可归零。' },
  },
  'knock-box': {
    name: { en: 'Knock box', zh: '敲渣桶' },
    purpose: { en: 'Collects used coffee pucks.', zh: '收集用过的咖啡粉饼。' },
  },
  'tamp-mat': {
    name: { en: 'Tamping mat', zh: '压粉垫' },
    purpose: { en: 'A stable spot to rest and tamp the portafilter.', zh: '放置手柄、压粉用的稳固垫子。' },
  },
  serve: {
    name: { en: 'Serving board', zh: '出品板' },
    purpose: { en: 'Where the finished drink goes.', zh: '做好的饮品放这里。' },
  },
  portafilter: {
    name: { en: 'Portafilter', zh: '手柄（冲煮手柄）' },
    purpose: {
      en: 'A handle with a metal basket that holds the coffee and locks into the group head.',
      zh: '带金属粉碗的把手，装粉后扣入冲煮头。',
    },
  },
  tamper: {
    name: { en: 'Tamper', zh: '压粉器' },
    purpose: { en: 'A flat press that compacts the grounds evenly.', zh: '平底压具，把咖啡粉压平压实。' },
  },
  cup: {
    name: { en: 'Espresso cup', zh: '浓缩咖啡杯' },
    purpose: { en: 'Small, thick cup. It sits on the scale under the spouts.', zh: '小而厚的杯子，放在出液口下方的秤上。' },
  },
};

/** Fill `{name}` placeholders; LocalizedText values are inserted per language. */
export function fmt(text: LocalizedText, vars: Record<string, string | number | LocalizedText>): LocalizedText {
  const rep = (s: string, lang: 'en' | 'zh') =>
    s.replace(/\{(\w+)\}/g, (_, k: string) => {
      if (!(k in vars)) return `{${k}}`;
      const v = vars[k];
      return typeof v === 'object' ? v[lang] : String(v);
    });
  return { en: rep(text.en, 'en'), zh: rep(text.zh, 'zh') };
}

/** Short item names for action labels. */
export const ITEM_NAME: Record<'portafilter' | 'cup' | 'tamper', LocalizedText> = {
  portafilter: { en: 'portafilter', zh: '手柄' },
  cup: { en: 'cup', zh: '杯子' },
  tamper: { en: 'tamper', zh: '压粉器' },
};

export const ZONE_NAME: Record<
  'tamp-mat' | 'grinder-fork' | 'group-head' | 'knock-box' | 'cup-home' | 'scale' | 'serve' | 'tamper-stand' | 'basket',
  LocalizedText
> = {
  'tamp-mat': { en: 'the tamping mat', zh: '压粉垫' },
  'grinder-fork': { en: 'the grinder fork', zh: '磨豆机支架' },
  'group-head': { en: 'the group head', zh: '冲煮头' },
  'knock-box': { en: 'the knock box', zh: '敲渣桶' },
  'cup-home': { en: 'the cup shelf', zh: '杯架' },
  scale: { en: 'the scale', zh: '秤' },
  serve: { en: 'the serving board', zh: '出品板' },
  'tamper-stand': { en: 'the tamper stand', zh: '压粉器座' },
  basket: { en: 'the basket', zh: '粉碗' },
};

export const ACTION_LABEL = {
  locate: { en: 'Look at the espresso machine', zh: '查看意式咖啡机' },
  grab: { en: 'Pick up the {item}', zh: '拿起{item}' },
  place: { en: 'Put the {item} on {zone}', zh: '把{item}放到{zone}' },
  attach: { en: 'Lock the portafilter into the group head', zh: '把手柄扣入冲煮头' },
  knock: { en: 'Knock the portafilter out over the knock box', zh: '在敲渣桶上敲出粉饼' },
  tamp: { en: 'Tamp: press the tamper into the basket', zh: '压粉：把压粉器压进粉碗' },
  putBack: { en: 'Put the {item} back', zh: '把{item}放回原处' },
  grinder: { en: "Press the grinder's button", zh: '按磨豆机按钮' },
  tare: { en: 'Press TARE on the scale', zh: '按秤上的「去皮」键' },
  brew: { en: 'Press the brew button', zh: '按冲煮按钮' },
  stop: { en: 'Press the brew button to STOP', zh: '按冲煮按钮停止' },
} as const satisfies Record<string, LocalizedText>;

/** Feedback messages keyed by code. `{vars}` are filled by the reducer. */
export const FEEDBACK: Record<FeedbackCode, LocalizedText> = {
  'step-complete': { en: 'Done: {title}', zh: '完成：{title}' },
  'mission-complete': {
    en: 'Mission complete — you pulled a (simulated) first shot and cleaned up.',
    zh: '任务完成——你完成了一杯（模拟的）浓缩咖啡，并做好了清洁。',
  },
  inspect: { en: '{name}: {purpose}', zh: '{name}：{purpose}' },
  'located-other': {
    en: 'That is the {name}. Now find the espresso machine — the big steel box in the middle.',
    zh: '这是{name}。现在找找意式咖啡机——中间那台不锈钢机器。',
  },
  'hand-full': { en: 'That hand is already holding something. Put it down first.', zh: '这只手已经拿着东西了，先放下吧。' },
  'grinding-wait': { en: 'The grinder is still running — wait a moment.', zh: '磨豆机还在工作——稍等一下。' },
  'settling-wait': { en: 'Let the last drops fall first.', zh: '先让最后几滴落完。' },
  'remove-during-shot': {
    en: 'Stop the shot first. On a real machine the portafilter is under pressure while brewing — never remove it mid-shot.',
    zh: '请先停止萃取。真实咖啡机在萃取时手柄处有压力——萃取中千万不要取下手柄。',
  },
  'cup-during-shot': {
    en: 'Keep the cup under the spouts until you stop the shot.',
    zh: '停止萃取前，请让杯子留在出液口下方。',
  },
  'near-miss': { en: 'Almost — bring it a little closer to the ring, then let go.', zh: '差一点——再靠近圆环一些后松手。' },
  'near-miss-angle': {
    en: 'Close! Turn the handle to point toward you, then let go.',
    zh: '很接近了！把手柄转到朝向自己的方向，再松手。',
  },
  returned: { en: 'Released away from a spot — it went back to its place.', zh: '没有放到指定位置——它回到了原处。' },
  'attach-empty': {
    en: 'The basket is empty, so there is nothing to brew. Dose it at the grinder first.',
    zh: '粉碗是空的，没有可萃取的咖啡。先去磨豆机取粉。',
  },
  'attach-untamped': {
    en: 'Tamp the grounds before locking in — a loose bed lets water rush through unevenly.',
    zh: '扣入前先压粉——松散的粉层会让水流不均匀地冲过。',
  },
  'attach-spent': {
    en: 'There is a used puck in the basket — knock it out first.',
    zh: '粉碗里还有用过的粉饼——先把它敲掉。',
  },
  'attach-keep-warm': {
    en: 'Empty portafilter locked in — baristas often store it there to keep it warm.',
    zh: '空手柄已扣上——咖啡师常把手柄扣在机器上保温。',
  },
  'grind-no-portafilter': {
    en: 'Nothing is under the grinder — grounds would spill. Rest the portafilter in the fork first.',
    zh: '磨豆机下面没有手柄——粉会撒出来。先把手柄架到支架上。',
  },
  'grind-basket-full': {
    en: 'The basket already has coffee in it; grinding more would overfill it.',
    zh: '粉碗里已经有粉了，再磨会溢出来。',
  },
  'grind-busy': { en: 'Already grinding…', zh: '正在研磨……' },
  'tamp-empty': { en: 'The basket is empty — dose it at the grinder before tamping.', zh: '粉碗是空的——先去磨豆机取粉再压粉。' },
  'tamp-already': { en: 'Already tamped — one firm, level tamp is enough.', zh: '已经压好了——一次平稳压实就够了。' },
  'tamp-spent': { en: 'That is a used puck. Knock it out instead.', zh: '那是用过的粉饼，应该把它敲掉。' },
  'tamp-not-resting': {
    en: 'Rest the portafilter on the tamping mat (or hold it in your other hand) so it stays steady.',
    zh: '把手柄放在压粉垫上（或用另一只手拿稳），这样才稳当。',
  },
  'tamp-no-tamper': { en: 'Pick up the tamper first.', zh: '先拿起压粉器。' },
  'tamp-tilted': {
    en: 'Tamped, but tilted about {deg}°. Aim for level so water flows evenly (simulated angle).',
    zh: '压好了，但倾斜了约 {deg}°。尽量保持水平，水流才均匀（模拟角度）。',
  },
  'tare-no-cup': {
    en: 'Scale zeroed, but with no cup on it. Place the cup first, then tare, so the reading ignores the cup.',
    zh: '秤已归零，但上面没有杯子。先放杯子再去皮，读数才不含杯重。',
  },
  'tare-ok': { en: 'Scale reads 0.0 g.', zh: '秤显示 0.0 克。' },
  'tare-during-shot': {
    en: "Don't re-zero mid-shot — you would lose track of the espresso weight.",
    zh: '萃取中不要归零——那样就看不出咖啡液的重量了。',
  },
  'brew-no-portafilter': {
    en: 'No portafilter in the group head — that would only flush plain water. Lock in the dosed, tamped portafilter first.',
    zh: '冲煮头上没有手柄——这样只会放出清水。先扣上已取粉、已压粉的手柄。',
  },
  'brew-no-cup': {
    en: 'No cup under the spouts — the espresso would land in the drip tray. Put the cup on the scale first.',
    zh: '出液口下没有杯子——咖啡会流进滴水盘。先把杯子放到秤上。',
  },
  'brew-not-tared': {
    en: 'The scale still counts the cup ({g} g). Tare it to 0.0 g so you can read the espresso weight.',
    zh: '秤还算着杯子的重量（{g} 克）。先去皮归零，才能读出咖啡液的重量。',
  },
  'brew-busy': { en: 'The machine is busy — wait a moment.', zh: '机器正在工作——稍等一下。' },
  'shot-stopped': { en: 'Shot stopped at {g} g.', zh: '萃取在 {g} 克时停止。' },
  'shot-auto-stopped': {
    en: 'The simulated machine cut off at {g} g — far past the {target} g target. Next time, press brew again as the scale nears the target.',
    zh: '模拟咖啡机在 {g} 克时自动停止——远超 {target} 克的目标。下次在接近目标时再按一次冲煮键。',
  },
  'shot-approaching': { en: 'Getting close to {target} g — get ready to stop.', zh: '快到 {target} 克了——准备停止。' },
  'flush-cup-in-place': {
    en: 'Your espresso is still under the group head — move it to the serving board before flushing.',
    zh: '咖啡还在冲煮头下面——冲洗前先把它端到出品板。',
  },
  'flush-spent-attached': {
    en: 'The used puck is still locked in. Remove the portafilter and knock it out first.',
    zh: '用过的粉饼还扣在机器上。先取下手柄，把粉饼敲掉。',
  },
  'flush-done': { en: 'Group head rinsed.', zh: '冲煮头已冲洗。' },
  'knock-fresh-grounds': {
    en: 'Those are fresh, unbrewed grounds — knocking them out would waste them. Brew first.',
    zh: '那是还没萃取的新鲜咖啡粉——敲掉就浪费了。先萃取。',
  },
  'knock-nothing': { en: 'The basket is already empty.', zh: '粉碗已经是空的了。' },
  'knock-ok': { en: 'Puck knocked out.', zh: '粉饼已敲掉。' },
  hint: { en: 'Hint: {title} — {instruction}', zh: '提示：{title}——{instruction}' },
  'guidance-changed': { en: 'Guidance: {tier}', zh: '引导模式：{tier}' },
  paused: { en: 'Paused.', zh: '已暂停。' },
  resumed: { en: 'Resumed.', zh: '已继续。' },
  reset: { en: 'Fresh start — everything is back in place.', zh: '重新开始——所有东西都已归位。' },
};

export const GUIDANCE_LABEL: Record<'guided' | 'assisted' | 'independent', LocalizedText> = {
  guided: { en: 'Guided', zh: '引导' },
  assisted: { en: 'Assisted', zh: '辅助' },
  independent: { en: 'Independent', zh: '独立' },
};

export const STOP_FEEDBACK = {
  'on-target': {
    en: '{g} g — right around the {target} g target (ratio 1:{ratio}).',
    zh: '{g} 克——就在 {target} 克目标附近（粉液比 1:{ratio}）。',
  },
  under: {
    en: '{g} g — {err} g short of {target} g (ratio 1:{ratio}), a shorter, more concentrated ratio. Next time, wait a little longer.',
    zh: '{g} 克——比 {target} 克少 {err} 克（粉液比 1:{ratio}），比例更短、更浓缩。下次再多等一会儿。',
  },
  over: {
    en: '{g} g — {err} g past {target} g (ratio 1:{ratio}), a longer, more diluted ratio. Next time, stop a moment sooner — remember the last drips.',
    zh: '{g} 克——比 {target} 克多 {err} 克（粉液比 1:{ratio}），比例更长、更稀。下次早一点停——别忘了最后还会滴几滴。',
  },
} as const satisfies Record<string, LocalizedText>;

/** What the simulation trains vs. what still needs real hands-on practice (summary honesty). */
export const PRACTICED = {
  locate: { en: 'Finding each tool at an espresso station', zh: '在意式咖啡工作台上找到每样工具' },
  order: { en: 'The order of a basic espresso workflow, from dosing to cleanup', zh: '基础意式流程的顺序：从取粉到清洁' },
  placement: {
    en: 'Lining up the portafilter and cup in space (simulated snap zones)',
    zh: '在空间中对准手柄和杯子（模拟的吸附区域）',
  },
  placementPanel: {
    en: 'Workflow order via the action list (spatial placement was not practised this time)',
    zh: '通过操作列表练习了流程顺序（本次没有练习空间摆放）',
  },
  timing: { en: 'Watching a scale and stopping near a target yield', zh: '看着秤，在目标液重附近停止' },
} as const satisfies Record<string, LocalizedText>;

export const NOT_TRAINED: readonly LocalizedText[] = [
  {
    en: 'Grip force and tamping pressure — there is no real touch or force feedback here.',
    zh: '握力和压粉力度——这里没有真实的触感或力度反馈。',
  },
  {
    en: 'Grind size and dialing in on your own grinder and beans.',
    zh: '研磨度调整，以及用你自己的磨豆机和豆子调参。',
  },
  {
    en: 'Real taste: the extraction here is an illustrative model, not a flavour prediction.',
    zh: '真实味道：这里的萃取是示意模型，不能预测风味。',
  },
  {
    en: "Your machine's real heat, steam and handling — follow its manual and be careful with hot water.",
    zh: '你机器的真实温度、蒸汽和操作手感——请遵循说明书，小心热水。',
  },
];

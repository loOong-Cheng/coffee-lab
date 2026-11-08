import type { Confidence, LocalizedText } from '../../domain/contracts';
import type { EventKind, PlaceKind } from './model';

type LT = LocalizedText;

export const PLACE_KIND_TEXT: Record<PlaceKind, { one: LT; many: LT; blurb: LT }> = {
  origin: {
    one: { zh: '起源地', en: 'Origin' },
    many: { zh: '起源地', en: 'Origins' },
    blurb: { zh: '咖啡最早被发现、饮用和贸易的地方。', en: 'Where coffee was first found, drunk and traded.' },
  },
  producer: {
    one: { zh: '产区', en: 'Producing region' },
    many: { zh: '产区', en: 'Producing regions' },
    blurb: { zh: '种植咖啡的地方，包括它们的历史。', en: 'Where coffee is grown — and how it got there.' },
  },
  'drink-culture': {
    one: { zh: '饮用文化', en: 'Drink culture' },
    many: { zh: '饮用文化', en: 'Drink cultures' },
    blurb: { zh: '人们独特的喝咖啡方式与仪式。', en: 'Distinctive ways people drink coffee, and the rituals around it.' },
  },
  coffeehouse: {
    one: { zh: '咖啡馆', en: 'Coffeehouse' },
    many: { zh: '咖啡馆历史', en: 'Coffeehouses' },
    blurb: { zh: '咖啡馆成为社交、商业和思想中心的城市。', en: 'Cities where coffeehouses became hubs of talk, trade and ideas.' },
  },
};

export const EVENT_KIND_TEXT: Record<EventKind, { one: LT; many: LT }> = {
  legend: { one: { zh: '传说', en: 'Legend' }, many: { zh: '传说', en: 'Legends' } },
  history: { one: { zh: '历史', en: 'History' }, many: { zh: '历史', en: 'History' } },
  innovation: { one: { zh: '发明与革新', en: 'Innovation' }, many: { zh: '发明与革新', en: 'Innovations' } },
  culture: { one: { zh: '文化', en: 'Culture' }, many: { zh: '文化', en: 'Culture' } },
};

/** Confidence wording for history/culture claims. Maps 1:1 to the contract — never upgraded. */
export const CONFIDENCE_TEXT: Record<Confidence, { label: LT; detail: LT }> = {
  verified: {
    label: { zh: '有可靠记载', en: 'Well documented' },
    detail: { zh: '有可靠的历史资料支持。', en: 'Supported by reliable historical sources.' },
  },
  'rule-of-thumb': {
    label: { zh: '普遍说法', en: 'Commonly told' },
    detail: { zh: '流传很广，但细节各说不一或难以证实。', en: 'Widely repeated; details vary or are hard to verify.' },
  },
  'illustrative-model': {
    label: { zh: '简化示意', en: 'Simplified' },
    detail: { zh: '为了讲清楚而做了简化。', en: 'Simplified to make the idea clear.' },
  },
};

export const S = {
  title: { zh: '咖啡文化探索', en: 'Coffee Culture Explorer' },
  lead: {
    zh: '漫游咖啡的地理与历史：它从哪里来、在哪里生长、世界各地的人怎样喝它。传说会标明是传说，有争议的年代会说清楚。',
    en: 'Wander coffee’s geography and history: where it came from, where it grows, and how people around the world drink it. Legends are labelled as legends, and disputed dates say so.',
  },
  eyebrow: { zh: '选修 · 咖啡文化', en: 'Optional · Coffee culture' },
  jumpTimeline: { zh: '跳到时间线', en: 'Jump to the timeline' },
  deeperH: { zh: '继续深入：文化课程与饮品图鉴', en: 'Go deeper: culture lessons and the Drink Atlas' },
  atlasLink: { zh: '饮品图鉴', en: 'Drink Atlas' },
  // map section
  mapH: { zh: '世界地图', en: 'World map' },
  viewLabel: { zh: '显示方式', en: 'Show as' },
  viewMap: { zh: '地图', en: 'Map' },
  viewList: { zh: '列表', en: 'List' },
  kindsLegend: { zh: '显示哪些地点', en: 'Show places' },
  mapLabel: { zh: '咖啡文化世界地图', en: 'World map of coffee places' },
  mapHint: {
    zh: '选择一个标记查看详情。用 + / − 缩放，用方向按钮移动地图。更喜欢列表？切换到“列表”。',
    en: 'Pick a marker to see its story. Zoom with + / − and move with the arrow buttons. Prefer a list? Switch to List.',
  },
  mapKeys: { zh: '键盘：焦点在地图控件上时，按 + / − 缩放，方向键移动。', en: 'Keyboard: on the map controls, + / − zooms and arrow keys pan.' },
  controls: { zh: '地图控件', en: 'Map controls' },
  inView: (n: number, m: number): LT => ({ zh: `当前视野内 ${n} / ${m} 个地点`, en: `${n} of ${m} places in view` }),
  noneInView: { zh: '这片区域没有地点。缩小或重置地图。', en: 'No places in this area. Zoom out or reset the map.' },
  zoomIn: { zh: '放大', en: 'Zoom in' },
  zoomOut: { zh: '缩小', en: 'Zoom out' },
  panW: { zh: '向西移动', en: 'Move west' },
  panE: { zh: '向东移动', en: 'Move east' },
  panN: { zh: '向北移动', en: 'Move north' },
  panS: { zh: '向南移动', en: 'Move south' },
  reset: { zh: '重置地图', en: 'Reset map' },
  zoomStatus: (z: number): LT => ({ zh: `缩放 ${z}×`, en: `Zoom ${z}×` }),
  cluster: (n: number, names: string): LT => ({ zh: `${n} 个地点：${names}。放大查看`, en: `${n} places: ${names}. Zoom in` }),
  beltName: { zh: '咖啡带', en: 'Coffee belt' },
  beltNote: {
    zh: '大致在南北回归线之间。咖啡种植在这一带气候和海拔合适的地方，并非整条带都种。',
    en: 'Roughly between the Tropics of Cancer and Capricorn. Coffee grows where climate and altitude suit it within this band — not everywhere in it.',
  },
  mapArtNote: { zh: '示意地图：简化的海岸线，不画国界。', en: 'Stylized map: simplified coastlines, no borders.' },
  showing: (n: number, m: number): LT => ({ zh: `显示 ${n} / ${m} 个地点`, en: `Showing ${n} of ${m} places` }),
  noPlaces: { zh: '没有符合条件的地点', en: 'No places match' },
  showAllKinds: { zh: '显示全部类型', en: 'Show all kinds' },
  noData: { zh: '文化地图暂时没有内容', en: 'The culture map has no content yet' },
  noDataBody: { zh: '先看看饮品图鉴里各地的咖啡吧。', en: 'Meanwhile, explore the world’s coffees in the Drink Atlas.' },
  // detail
  pickH: { zh: '选一个地方', en: 'Pick a place' },
  pickBody: {
    zh: '在地图或列表里选一个地点，看看它在咖啡故事里的位置、相关饮品和课程。',
    en: 'Choose a place on the map or in the list to see its part in coffee’s story, plus related drinks and lessons.',
  },
  startWith: (name: string): LT => ({ zh: `从这里开始：${name}`, en: `Start with ${name}` }),
  chooserH: { zh: '这里有几个地点', en: 'Several places here' },
  chooserBody: { zh: '它们挨得太近，选一个：', en: 'They sit very close together — pick one:' },
  unknownPlace: { zh: '地图上没有这个地点。链接可能有误。', en: 'That place isn’t on the map — the link may be wrong.' },
  clear: { zh: '关闭详情', en: 'Close details' },
  backToMap: { zh: '回到地图', en: 'Back to the map' },
  backToList: { zh: '回到列表', en: 'Back to the list' },
  grows: { zh: '这里种植咖啡', en: 'Coffee is grown here' },
  onTimeline: { zh: '时间线上的这里', en: 'On the timeline' },
  drinksH: { zh: '相关饮品', en: 'Related drinks' },
  lessonsH: { zh: '相关课程', en: 'Related lessons' },
  sourcesH: (n: number): LT => ({ zh: `资料来源（${n}）`, en: `Sources (${n})` }),
  noSources: { zh: '还没有列出资料来源。', en: 'No sources listed yet.' },
  confidence: { zh: '可信度', en: 'Confidence' },
  // music
  listenH: { zh: '边听边逛', en: 'Listen while you explore' },
  listen: { zh: '播放这段音乐', en: 'Play this music' },
  stop: { zh: '停止音乐', en: 'Stop the music' },
  playing: { zh: '正在播放', en: 'Now playing' },
  noMood: {
    zh: '这个地区还没有专门的音乐风格，会播放通用的咖啡馆爵士。',
    en: 'No mood is tied to this region yet — this plays our general café jazz.',
  },
  original: { zh: '实时生成的原创音乐，不是当地的录音。', en: 'Original music generated live — not a recording from this place.' },
  // timeline
  tlH: { zh: '咖啡时间线', en: 'Coffee timeline' },
  tlLead: {
    zh: '按时间顺序排列。传说用虚线框标出；资料对年代有分歧时，会标“年代有争议”并给出范围。',
    en: 'In time order. Legends get a dashed frame; where sources disagree on a date, it says “Dates disputed” and gives the range.',
  },
  tlKinds: { zh: '显示哪些事件', en: 'Show events' },
  tlShowing: (n: number, m: number): LT => ({ zh: `显示 ${n} / ${m} 个事件`, en: `Showing ${n} of ${m} events` }),
  tlNone: { zh: '没有符合条件的事件', en: 'No events match' },
  tlAll: { zh: '显示全部事件', en: 'Show all events' },
  tlJump: { zh: '跳到年代', en: 'Jump to' },
  legendBadge: { zh: '传说', en: 'Legend' },
  legendNote: { zh: '这是流传的故事，不是有据可查的史实。', en: 'A story people tell — not documented history.' },
  disputed: { zh: '年代有争议', en: 'Dates disputed' },
  disputedNote: { zh: '资料对年代或细节说法不一。', en: 'Sources disagree on the date or details.' },
  showOnMap: (name: string): LT => ({ zh: `在地图上查看：${name}`, en: `Show on map: ${name}` }),
  noPlace: { zh: '没有固定地点', en: 'No single place' },
  more: { zh: '延伸', en: 'Explore more' },
} as const;

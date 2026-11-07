import type { DeviceKind, EquipmentCategory, Experience, Goal, LocalizedText, Mode } from '../../domain/contracts';

export const S = {
  title: { zh: '欢迎来到咖啡实验室', en: 'Welcome to Coffee Lab' },
  editTitle: { zh: '更新你的设置', en: 'Update your setup' },
  lead: {
    zh: '回答几个小问题（约 1 分钟），我们会推荐合适的起点。之后随时可以修改。',
    en: 'A few quick questions (about a minute) so we can suggest a good starting point. You can change everything later.',
  },
  editLead: { zh: '修改后，你的学习进度会保留。', en: 'Your learning progress is kept when you change these.' },
  defaults: { zh: '使用默认设置开始', en: 'Start with defaults' },
  defaultsNote: { zh: '默认：目标意式浓缩、新手、引导模式。', en: 'Defaults: espresso goal, beginner, guided support.' },
  cancel: { zh: '取消，返回首页', en: 'Cancel and go home' },
  back: { zh: '上一步', en: 'Back' },
  next: { zh: '下一步', en: 'Next' },
  finish: { zh: '开始学习', en: 'Start learning' },
  save: { zh: '保存修改', en: 'Save changes' },
  stepsLabel: { zh: '设置步骤', en: 'Setup steps' },
  // goal
  goalQ: { zh: '你最想学什么？', en: 'What would you like to learn first?' },
  goal: {
    espresso: { zh: '意式浓缩', en: 'Espresso' },
    pourover: { zh: '手冲咖啡', en: 'Pour-over' },
    explore: { zh: '随便逛逛', en: 'Explore coffee' },
  } satisfies Record<Goal, LocalizedText>,
  goalDesc: {
    espresso: { zh: '认识咖啡机、流程、比例和排查，最终做出第一杯。', en: 'Machine, workflow, ratio and diagnosis — then your first real shot.' },
    pourover: { zh: '滤杯、闷蒸、注水和品尝迭代。', en: 'Dripper, bloom, pouring and tasting to improve.' },
    explore: { zh: '风味、产地、烘焙、水和咖啡文化。', en: 'Flavour, origins, roasting, water and coffee culture.' },
  } satisfies Record<Goal, LocalizedText>,
  // experience
  expQ: { zh: '你对咖啡有多熟悉？', en: 'How familiar are you with coffee making?' },
  exp: {
    new: { zh: '完全新手', en: 'Brand new' },
    some: { zh: '做过几次', en: 'Made a few cups' },
    experienced: { zh: '有经验', en: 'Fairly experienced' },
  } satisfies Record<Experience, LocalizedText>,
  expDesc: {
    new: { zh: '从“咖啡是什么”开始，不需要任何术语。', en: 'Start from “what is coffee” — no jargon needed.' },
    some: { zh: '基础课可以快速过一遍。', en: 'You can move quickly through the basics.' },
    experienced: { zh: '直接挑你感兴趣的课；基础课随时可复习。', en: 'Jump to what interests you; basics are there to review.' },
  } satisfies Record<Experience, LocalizedText>,
  // devices
  devQ: { zh: '你会用哪些设备学习？', en: 'Which devices will you learn with?' },
  devHelp: { zh: '可多选。不同设备会有不同的体验。', en: 'Pick any. Each device gets a different experience.' },
  dev: {
    pc: { zh: '电脑', en: 'Computer' },
    phone: { zh: '手机', en: 'Phone' },
    headset: { zh: 'VR 头显', en: 'VR headset' },
  } satisfies Record<DeviceKind, LocalizedText>,
  devDesc: {
    pc: { zh: '概念、图解和练习', en: 'Concepts, diagrams and exercises' },
    phone: { zh: '短课 + 厨房里的分步指导', en: 'Short lessons + step-by-step kitchen guide' },
    headset: { zh: '虚拟吧台上的空间练习', en: 'Spatial practice at a virtual bar' },
  } satisfies Record<DeviceKind, LocalizedText>,
  devNeedOne: { zh: '至少选一个设备。', en: 'Pick at least one device.' },
  // equipment
  eqQ: { zh: '你有哪些器具？', en: 'What equipment do you have?' },
  eqHelp: {
    zh: '只是为了推荐合适的练习——没有器具也完全可以学。这是你自己提供的信息。',
    en: 'Only used to suggest fitting practice — you can learn with no gear at all. This is what you tell us (self-reported).',
  },
  quickPicks: { zh: '快速选择', en: 'Quick picks' },
  quickEspresso: { zh: '意式咖啡机 + 磨豆机', en: 'Espresso machine + grinder' },
  quickPour: { zh: '手冲套装', en: 'Pour-over kit' },
  quickNone: { zh: '还没有器具', en: 'Nothing yet' },
  owned: { zh: '我有', en: 'I own' },
  wishlist: { zh: '想要了解 / 打算购买（可选）', en: 'Interested in getting (optional)' },
  wishHelp: { zh: '我们会在图鉴里标出来。', en: 'We’ll mark these in the Drink Atlas.' },
  selectedCount: (n: number): LocalizedText => ({ zh: `已选 ${n} 件`, en: `${n} selected` }),
  cat: {
    espresso: { zh: '意式', en: 'Espresso' },
    brewer: { zh: '冲煮器具', en: 'Brewers' },
    grinding: { zh: '研磨', en: 'Grinding' },
    measuring: { zh: '称量与计时', en: 'Measuring' },
    water: { zh: '水与烧水', en: 'Water & kettles' },
    milk: { zh: '牛奶', en: 'Milk' },
    serving: { zh: '杯具', en: 'Serving' },
    cleaning: { zh: '清洁', en: 'Cleaning' },
  } satisfies Record<EquipmentCategory, LocalizedText>,
  // mode
  modeQ: { zh: '你更喜欢怎样学？', en: 'How do you prefer to learn?' },
  mode: {
    desktop: { zh: '电脑上学习', en: 'On a computer' },
    mobile: { zh: '手机上学习', en: 'On my phone' },
    'real-world-guide': { zh: '手机放厨房，边做边学', en: 'Phone in the kitchen, learn by doing' },
    xr: { zh: 'VR / 3D 练习', en: 'VR / 3D practice' },
  } satisfies Record<Mode, LocalizedText>,
  modeDesc: {
    desktop: { zh: '图解、拖动比例、排查情景。', en: 'Diagrams, ratio sliders, diagnosis scenarios.' },
    mobile: { zh: '短小的课程和大按钮。', en: 'Short lessons and big buttons.' },
    'real-world-guide': { zh: '大按钮分步指导，由你确认每一步。', en: 'Big-button steps you confirm yourself.' },
    xr: { zh: '空间练习；没有头显也能用鼠标玩 3D 版。', en: 'Spatial practice; without a headset, play in 3D with a mouse.' },
  } satisfies Record<Mode, LocalizedText>,
  suggested: { zh: '推荐给这台设备', en: 'Suggested for this device' },
  xrNotDetected: { zh: '（这台设备未检测到 VR）', en: '(no VR detected on this device)' },
  guidanceQ: { zh: '默认提示程度', en: 'Default support level' },
  guidanceHelp: { zh: '每节课里都可以随时调整。', en: 'You can change it inside every lesson.' },
  stepNames: [
    { zh: '目标', en: 'Goal' },
    { zh: '经验', en: 'Experience' },
    { zh: '设备', en: 'Devices' },
    { zh: '器具', en: 'Equipment' },
    { zh: '学习方式', en: 'Learning style' },
  ] as LocalizedText[],
} as const;

import type { Goal, LocalizedText } from '../../domain/contracts';

export const S = {
  title: { zh: '你的咖啡课程', en: 'Your coffee course' },
  subtitle: {
    espresso: { zh: '目标：做出你的第一杯意式浓缩。从基础开始，一步一步来。', en: 'Goal: pull your first espresso. Start with the basics, one step at a time.' },
    pourover: { zh: '目标：冲出一杯好喝的手冲。从基础开始，一步一步来。', en: 'Goal: brew a lovely pour-over. Start with the basics, one step at a time.' },
    explore: { zh: '目标：探索咖啡的世界。核心课程打底，选修随心。', en: 'Goal: explore the world of coffee. Core lessons first, electives whenever you like.' },
  } satisfies Record<Goal, LocalizedText>,
  editSetup: { zh: '修改设置', en: 'Edit setup' },
  recommended: { zh: '推荐下一课', en: 'Recommended next' },
  continueLesson: { zh: '继续这节课', en: 'Continue this lesson' },
  startLesson: { zh: '开始这节课', en: 'Start this lesson' },
  allDone: {
    zh: '所有课程都完成了！试试用“独立”模式重做来真正掌握，去做一杯真的咖啡，或者复习喜欢的课。',
    en: 'Every lesson is completed! Redo them at the Independent tier to master them, go make a real cup, or revisit a favourite.',
  },
  allMastered: {
    zh: '所有课程都已独立掌握！去做一杯真的咖啡，或者复习喜欢的课。',
    en: 'Every lesson mastered independently! Go make a real cup, or revisit a favourite lesson.',
  },
  minutes: (n: number): LocalizedText => ({ zh: `约 ${n} 分钟`, en: `~${n} min` }),
  // summary
  progress: { zh: '你的进度', en: 'Your progress' },
  completed: { zh: '核心课程已完成', en: 'Core lessons completed' },
  independentCount: (n: number): LocalizedText => ({
    zh: `其中 ${n} 节已独立掌握`,
    en: `${n} mastered independently`,
  }),
  completedNote: {
    zh: '“完成” = 本课的理解检查全部答对（答题评估，可以有提示）。“独立掌握” = 在“独立”模式下、没有提示也完成了。',
    en: '“Completed” = all of the lesson’s checks answered (assessed, hints allowed). “Mastered independently” = done at the Independent tier, without hints.',
  },
  optionalCompleted: (n: number): LocalizedText => ({ zh: `另有 ${n} 节选修课已完成`, en: `plus ${n} optional lesson${n === 1 ? '' : 's'}` }),
  activities: { zh: '完成的练习', en: 'Activities done' },
  cups: { zh: '记录的真实咖啡', en: 'Real cups logged' },
  cupsNote: { zh: '来自你的冲煮日志——由你自己记录。', en: 'From your brew journal — recorded by you.' },
  sims: { zh: '模拟任务', en: 'Simulated missions' },
  noProgress: { zh: '还没有记录。完成第一节课后这里会更新。', en: 'Nothing recorded yet. This updates after your first lesson.' },
  // map
  courseMap: { zh: '课程地图', en: 'Course map' },
  core: { zh: '核心', en: 'Core' },
  optional: { zh: '选修', en: 'Optional' },
  optionalNote: { zh: '选修路线不会阻挡核心课程，什么时候学都可以。', en: 'Optional tracks never block the core path — dip in any time.' },
  lessonsDone: (d: number, n: number): LocalizedText => ({ zh: `已完成 ${d}/${n} 节`, en: `${d} of ${n} completed` }),
  status: {
    'not-started': { zh: '未开始', en: 'Not started' },
    'in-progress': { zh: '进行中', en: 'In progress' },
    completed: { zh: '已完成', en: 'Completed' },
  },
  /** Completed lessons, by the least-supported tier every check was done at (QA-08). */
  autonomy: {
    guided: { zh: '在引导下完成', en: 'Completed with guidance' },
    assisted: { zh: '在少量提示下完成', en: 'Completed with light support' },
    independent: { zh: '已独立掌握', en: 'Mastered independently' },
    untiered: { zh: '已完成', en: 'Completed' },
  },
  activityCount: (d: number, n: number): LocalizedText => ({ zh: `${d}/${n} 个练习`, en: `${d}/${n} activities` }),
  nextBadge: { zh: '下一步', en: 'Next up' },
  lessonN: (n: number): LocalizedText => ({ zh: `第 ${n} 课`, en: `Lesson ${n}` }),
  // beyond the screen
  beyond: { zh: '离开屏幕去练习', en: 'Beyond the screen' },
  realCup: { zh: '做一杯真的咖啡', en: 'Make a real cup' },
  realCupBody: {
    zh: '把手机放在咖啡机旁，用大按钮一步步跟着做。每一步由你自己确认（自我报告），做完可以记到日志里。',
    en: 'Prop your phone by the machine and follow big, hands-friendly steps. You confirm each step yourself (self-reported), then log the cup.',
  },
  openGuide: { zh: '打开厨房模式', en: 'Open kitchen mode' },
  resumeGuide: { zh: '继续未完成的真实操作', en: 'Resume your real-world session' },
  journal: { zh: '冲煮日志', en: 'Brew journal' },
  xrTitle: { zh: 'XR 实验室', en: 'XR Lab' },
  xrBody: {
    zh: '在虚拟吧台上按顺序完成做意式的动作。练的是步骤和空间位置，不是真实手感或味道。',
    en: 'Practise the espresso routine at a virtual bar. It trains order and positioning — not real touch or taste.',
  },
  xrChecking: { zh: '正在检测 XR 支持…', en: 'Checking for XR support…' },
  xrReady: { zh: '这台设备支持沉浸式 VR。', en: 'This device supports immersive VR.' },
  xrFallback: { zh: '未检测到 VR 头显——可以用鼠标或触屏玩 3D 版本。', en: 'No VR headset detected — play the 3D version with mouse or touch.' },
  xrInsecure: { zh: 'VR 需要 HTTPS 或 localhost 才能启用；3D 版本仍可使用。', en: 'VR needs HTTPS or localhost; the 3D version still works.' },
  openXr: { zh: '打开 XR 实验室', en: 'Open the XR Lab' },
  // mobile today
  today: { zh: '今天学点什么', en: 'Today’s focus' },
  tracks: { zh: '全部路线', en: 'All tracks' },
  atlas: { zh: '饮品图鉴', en: 'Drink atlas' },
} as const;

import type { LocalizedText } from '../domain/contracts';

/** Shell UI strings (colocated, CONTRACTS §4). */
export const S = {
  brand: { zh: '咖啡实验室', en: 'Coffee Lab' },
  brandShort: { zh: '咖啡实验室', en: 'Coffee Lab' },
  skip: { zh: '跳到主要内容', en: 'Skip to main content' },
  primaryNav: { zh: '主导航', en: 'Primary' },
  navLearn: { zh: '学习', en: 'Learn' },
  navPractice: { zh: '练习', en: 'Practice' },
  navAtlas: { zh: '图鉴', en: 'Atlas' },
  navXr: { zh: 'XR 实验室', en: 'XR Lab' },
  navSettings: { zh: '设置', en: 'Settings' },
  switchLang: { zh: '切换到英文', en: 'Switch to Chinese' },
  sfx: { zh: '音效', en: 'Sound effects' },
  loading: { zh: '加载中…', en: 'Loading…' },
  storageUnavailable: {
    zh: '此浏览器无法保存进度（可能是隐私模式）。本次学习仍可进行，但关闭页面后进度会丢失。',
    en: "This browser can't save progress (private mode?). You can keep learning, but progress is lost when you close the page.",
  },
  storageRecovered: {
    zh: '之前保存的数据有损坏，已尽量恢复并备份原始数据。',
    en: 'Some saved data was damaged. We recovered what we could and kept a backup of the original.',
  },
  dismiss: { zh: '知道了', en: 'Dismiss' },
  errorTitle: { zh: '出了点问题', en: 'Something went wrong' },
  errorBody: {
    zh: '这一页遇到了错误。你的学习进度保存在本设备上，不会因此丢失。',
    en: 'This page hit an error. Your learning progress is stored on this device and is not lost.',
  },
  errorDownload: {
    zh: '这一页没能下载下来（网络不稳定，或者应用刚更新过）。你的学习进度保存在本设备上，不会丢失。检查网络后点“重试”。',
    en: 'This screen couldn’t be downloaded (a shaky connection, or the app was just updated). Your progress is stored on this device and is not lost. Check your connection, then press Try again.',
  },
  errorOffline: {
    zh: '你现在好像处于离线状态，这一页还没有保存到本设备。你的学习进度不会丢失。恢复网络后点“重试”。',
    en: 'You seem to be offline, and this screen isn’t saved on this device yet. Your progress is not lost. Reconnect, then press Try again.',
  },
  errorReloadHint: {
    zh: '重试了几次还是不行。网络恢复后，请重新加载整个页面。',
    en: 'Still not loading after a few tries. Once you’re back online, reload the whole page.',
  },
  errorRetry: { zh: '重试', en: 'Try again' },
  errorHome: { zh: '回到首页', en: 'Go to home' },
  errorReload: { zh: '重新加载', en: 'Reload page' },
  errorDetails: { zh: '技术细节', en: 'Technical details' },
  notFoundTitle: { zh: '找不到这个页面', en: "We couldn't find that page" },
  notFoundBody: { zh: '链接可能已过期或输入有误。', en: 'The link may be outdated or mistyped.' },
  notFoundHome: { zh: '返回课程地图', en: 'Back to the course map' },
  footer: {
    zh: '进度只保存在这台设备上。真实操作由你自己确认（自我报告）；模拟和萃取模型只是示意。',
    en: 'Progress is saved on this device only. Real-world steps are self-reported; simulations and extraction models are illustrative.',
  },
  editSetup: { zh: '修改学习设置', en: 'Edit learning setup' },
} satisfies Record<string, LocalizedText>;

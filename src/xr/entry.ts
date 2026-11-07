/**
 * Pure mapping from detected capabilities → what the XR route offers.
 * Detection itself lives in src/platform (detectXrSupport, never throws).
 * "supported" only means the browser says so — this project has NOT been
 * verified on a real headset (no hardware available; see docs/DECISIONS.md).
 */
import type { LocalizedText } from '../domain/contracts';
import type { XrSupport, XrSupportReason } from '../platform';

export interface XrEntryState {
  checking: boolean;
  reason: XrSupportReason | 'checking';
  /** Show the "Enter VR" button. */
  canEnterVR: boolean;
  /** Show "Play in 3D here" (mouse/touch on the same scene). */
  canPlay3D: boolean;
  /** The action list alone can always complete the mission. */
  canPlayActionList: true;
  message: LocalizedText;
}

export const ENTRY_MESSAGES: Record<XrSupportReason | 'checking' | 'no-webgl', LocalizedText> = {
  checking: { en: 'Checking whether this browser can run VR…', zh: '正在检测此浏览器能否运行 VR……' },
  supported: {
    en: 'This browser reports VR support. Put on your headset, start the scene, then press “Enter VR”. (Hardware-unverified: Coffee Lab has not yet been tested on a real headset.)',
    zh: '此浏览器报告支持 VR。戴上头显，启动场景后点「进入 VR」。（未经硬件验证：咖啡实验室尚未在真实头显上测试。）',
  },
  'no-webxr-api': {
    en: 'This browser has no WebXR, so immersive VR is not available here. You can play the same mission in 3D with mouse or touch, or with the step-by-step action list.',
    zh: '此浏览器不支持 WebXR，无法进入沉浸式 VR。你可以用鼠标或触屏在 3D 场景里完成同样的任务，或使用分步操作列表。',
  },
  'insecure-context': {
    en: 'WebXR only works on secure pages (https:// or localhost). Open Coffee Lab over HTTPS on your headset to try VR — meanwhile, play in 3D here.',
    zh: 'WebXR 只能在安全页面（https:// 或 localhost）中使用。请在头显上通过 HTTPS 打开咖啡实验室来体验 VR——现在可以先在这里玩 3D 版本。',
  },
  'not-supported': {
    en: 'No VR headset or runtime was found (immersive-vr is not supported). Play in 3D here instead.',
    zh: '没有检测到 VR 头显或运行环境（不支持 immersive-vr）。请在这里玩 3D 版本。',
  },
  error: {
    en: 'The browser blocked or failed the VR check. Play in 3D here instead.',
    zh: '浏览器阻止了 VR 检测或检测失败。请在这里玩 3D 版本。',
  },
  timeout: {
    en: 'The VR check did not answer in time. Play in 3D here instead.',
    zh: 'VR 检测超时未响应。请在这里玩 3D 版本。',
  },
  'no-webgl': {
    en: '3D graphics (WebGL) are not available on this device, so the 3D scene cannot run. You can still complete the whole mission with the step-by-step action list.',
    zh: '此设备无法使用 3D 图形（WebGL），3D 场景无法运行。你仍可用分步操作列表完成整个任务。',
  },
};

export function xrEntryState(support: XrSupport | null, webgl: boolean): XrEntryState {
  if (!support) {
    return {
      checking: true,
      reason: 'checking',
      canEnterVR: false,
      canPlay3D: webgl,
      canPlayActionList: true,
      message: ENTRY_MESSAGES.checking,
    };
  }
  const canEnterVR = support.immersiveVR && webgl;
  return {
    checking: false,
    reason: support.reason,
    canEnterVR,
    canPlay3D: webgl,
    canPlayActionList: true,
    message: !webgl ? ENTRY_MESSAGES['no-webgl'] : ENTRY_MESSAGES[support.reason] ?? ENTRY_MESSAGES.error,
  };
}

/** WebGL probe (WebGL 2 preferred). Never throws. */
export function detectWebGL(doc: Pick<Document, 'createElement'> | undefined = globalThis.document): boolean {
  try {
    if (!doc) return false;
    const canvas = doc.createElement('canvas') as HTMLCanvasElement;
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    const ok = !!gl;
    (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

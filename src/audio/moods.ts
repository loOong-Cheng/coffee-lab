/**
 * Music moods: three core moods (the persisted contract `Preferences.musicMood`)
 * plus three culture-inspired moods. Descriptions say what inspired each mood and
 * what it is NOT (no imitation of specific songs, no caricature instruments).
 */
import type { LocalizedText } from '../domain/contracts';

export type CoreMusicMood = 'cafe' | 'focus' | 'lab';
export type CultureMusicMood = 'bossa' | 'kissa' | 'bar';
/** Every mood the engine can play. Superset of the persisted `MusicMood`. */
export type MusicMoodId = CoreMusicMood | CultureMusicMood;

export const CORE_MUSIC_MOODS: readonly CoreMusicMood[] = ['cafe', 'focus', 'lab'];
export const CULTURE_MUSIC_MOODS: readonly CultureMusicMood[] = ['bossa', 'kissa', 'bar'];
export const MUSIC_MOOD_IDS: readonly MusicMoodId[] = [...CORE_MUSIC_MOODS, ...CULTURE_MUSIC_MOODS];

export interface MoodInfo {
  id: MusicMoodId;
  label: LocalizedText;
  /** One line: what it sounds like and when it suits. */
  description: LocalizedText;
  /** Culture moods: the real tradition that inspired it (respectful, factual). */
  inspiration?: LocalizedText;
  culture: boolean;
}

export const MUSIC_MOODS: Record<MusicMoodId, MoodInfo> = {
  cafe: {
    id: 'cafe',
    culture: false,
    label: { zh: '咖啡馆爵士', en: 'Café jazz' },
    description: {
      zh: '轻柔摇摆的电钢琴三重奏，适合浏览和随意翻看。',
      en: 'Soft swinging electric-piano trio for browsing and wandering.',
    },
  },
  focus: {
    id: 'focus',
    culture: false,
    label: { zh: '专注', en: 'Focus' },
    description: {
      zh: '缓慢、空灵的和声铺底，没有鼓点，阅读和答题时不打扰。',
      en: 'Slow, spacious chords with no drums — stays out of the way while you read and answer.',
    },
  },
  lab: {
    id: 'lab',
    culture: false,
    label: { zh: '实验台', en: 'Lab' },
    description: {
      zh: '轻快俏皮的律动，适合调参数、做模拟。',
      en: 'A light, playful groove for parameter labs and simulations.',
    },
  },
  bossa: {
    id: 'bossa',
    culture: true,
    label: { zh: '巴西 · 波萨', en: 'Brazil · Bossa' },
    description: {
      zh: '尼龙弦吉他式的切分扫弦、轻柔的边击与沙锤，带一点波萨诺瓦的色彩。',
      en: 'Nylon-guitar-style syncopated comping, soft cross-stick and shaker, with a bossa nova tinge.',
    },
    inspiration: {
      zh: '致敬巴西——世界最大的咖啡生产国，以及 1950 年代末诞生于里约热内卢的波萨诺瓦。旋律与和声均为原创。',
      en: "A nod to Brazil — the world's largest coffee producer — and the bossa nova born in Rio de Janeiro in the late 1950s. Original melodies and chords.",
    },
  },
  kissa: {
    id: 'kissa',
    culture: true,
    label: { zh: '日本 · 爵士喫茶', en: 'Japan · Jazz kissa' },
    description: {
      zh: '缓慢的钢琴三重奏抒情曲，鼓刷轻扫，带一点黑胶唱片的底噪。',
      en: 'Slow piano-trio ballads with brushed drums and a hint of vinyl surface noise.',
    },
    inspiration: {
      zh: '灵感来自日本的“爵士喫茶”：专门用好音响认真播放爵士唱片、让客人安静聆听的咖啡馆传统。',
      en: "Inspired by Japan's jazz kissa — cafés devoted to playing jazz records on fine sound systems for people who come to listen quietly.",
    },
  },
  bar: {
    id: 'bar',
    culture: true,
    label: { zh: '意大利 · 吧台早晨', en: 'Italy · Bar morning' },
    description: {
      zh: '明亮从容的早晨律动，远处偶尔传来杯碟的轻响。',
      en: 'A bright, unhurried morning groove, with the occasional distant clink of cups.',
    },
    inspiration: {
      zh: '灵感来自意大利街角的咖啡吧：很多人早上站在吧台前喝一杯意式浓缩再去上班。',
      en: 'Inspired by the neighbourhood bar in Italy, where many people drink a quick espresso standing at the counter on the way to work.',
    },
  },
};

export function isMusicMood(x: unknown): x is MusicMoodId {
  return typeof x === 'string' && (MUSIC_MOOD_IDS as readonly string[]).includes(x);
}

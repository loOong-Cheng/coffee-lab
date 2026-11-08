/**
 * Browser side of the audio QA (dev only, never shipped in the app bundle):
 * renders every mood and every SFX with OfflineAudioContext through the real mixing graph,
 * measures them, and hands numbers (+ optional small WAV previews) back to the Node runner.
 */
import { analyze, bandShares, encodeWavMono } from '../analysis';
import type { AudioStats } from '../analysis';
import { SFX_NAMES } from '../index';
import type { SfxName } from '../index';
import { MUSIC_MOOD_IDS } from '../moods';
import type { MusicMoodId } from '../moods';
import { renderMusic, renderSfx } from '../offline';
import { varietyReport } from '../variety';
import type { VarietyReport } from '../variety';

export interface QAOptions {
  musicSeconds: number;
  wav: boolean;
  wavSeconds: number;
}

export interface QAResult {
  sampleRate: number;
  userAgent: string;
  music: Array<{
    mood: MusicMoodId;
    full: AudioStats;
    /** Excluding the first 6 s (fade-in/intro). */
    body: AudioStats;
    bands: { low: number; mid: number; high: number };
    bars: number;
    sections: string[];
    wav?: string;
  }>;
  variety: VarietyReport[];
  sfx: Array<{ name: SfxName; stats: AudioStats; tailSec: number; wav?: string }>;
}

declare global {
  interface Window {
    __runAudioQA?: (o: QAOptions) => Promise<QAResult>;
  }
}

function base64(u8: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) s += String.fromCharCode(...u8.subarray(i, i + chunk));
  return btoa(s);
}

function channels(b: AudioBuffer): Float32Array[] {
  return Array.from({ length: b.numberOfChannels }, (_, i) => b.getChannelData(i));
}

/** Seconds until the signal finally drops below −60 dBFS. */
function tailSeconds(ch: Float32Array[], sr: number): number {
  const thr = 0.001;
  for (let i = ch[0]!.length - 1; i >= 0; i--) {
    if (ch.some((c) => Math.abs(c[i]!) > thr)) return i / sr;
  }
  return 0;
}

window.__runAudioQA = async (o: QAOptions): Promise<QAResult> => {
  const sr = 44100;
  const music: QAResult['music'] = [];
  for (const mood of MUSIC_MOOD_IDS) {
    const { buffer, bars } = await renderMusic(mood, o.musicSeconds, { seed: 7, sampleRate: sr });
    const ch = channels(buffer);
    const end = Math.floor(o.musicSeconds * sr);
    music.push({
      mood,
      full: analyze(
        ch.map((c) => c.subarray(0, end)),
        sr,
      ),
      body: analyze(
        ch.map((c) => c.subarray(6 * sr, end)),
        sr,
      ),
      bands: bandShares(
        ch.map((c) => c.subarray(6 * sr, end)),
        sr,
      ),
      bars: bars.length,
      sections: [...new Set(bars.map((b) => b.section))],
      wav: o.wav ? base64(encodeWavMono(ch, sr, 2, o.wavSeconds)) : undefined,
    });
  }
  const variety = MUSIC_MOOD_IDS.map((m) => varietyReport(m, 11, 10));
  const sfx: QAResult['sfx'] = [];
  for (const name of SFX_NAMES) {
    const buffer = await renderSfx(name, { seed: 3, sampleRate: sr });
    const ch = channels(buffer);
    const tailSec = tailSeconds(ch, sr);
    sfx.push({
      name,
      stats: analyze(ch, sr),
      tailSec,
      wav: o.wav ? base64(encodeWavMono(ch, sr, 2, tailSec + 0.25)) : undefined,
    });
  }
  return { sampleRate: sr, userAgent: navigator.userAgent, music, variety, sfx };
};

document.body.setAttribute('data-ready', 'true');

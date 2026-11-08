/**
 * Objective audio measurements for QA (pure functions, no Web Audio needed).
 * Loudness follows ITU-R BS.1770 / EBU R128 closely: K-weighting (high-shelf + high-pass,
 * coefficients computed for any sample rate), 400 ms gated blocks for integrated loudness,
 * 3 s short-term windows for loudness range (LRA, 10th–95th percentile).
 */

export interface AudioStats {
  durationSec: number;
  /** Sample peak in dBFS (0 = full scale). */
  peakDbfs: number;
  /** Unweighted RMS over the whole signal, dBFS. */
  rmsDbfs: number;
  /** Gated integrated loudness, LUFS (−Infinity if silent). */
  integratedLufs: number;
  /** Loudness range (LU) from 3 s short-term values. */
  loudnessRangeLu: number;
  /** Maximum momentary (400 ms) loudness, LUFS. */
  maxMomentaryLufs: number;
  /** Maximum 100 ms K-weighted loudness, LUFS — better for very short SFX (clicks, taps). */
  maxImpulseLufs: number;
  /** Share of 400 ms blocks quieter than −60 dBFS RMS. */
  silentShare: number;
  clippedSamples: number;
  nanSamples: number;
  dcOffset: number;
}

interface Biquad {
  b0: number;
  b1: number;
  b2: number;
  a1: number;
  a2: number;
}

function kWeighting(fs: number): [Biquad, Biquad] {
  // Stage 1: high shelf (+4 dB @ ~1.5 kHz).
  const G = 4.0;
  const Q = 1 / Math.SQRT2;
  const fc = 1500;
  const A = Math.pow(10, G / 40);
  let w0 = (2 * Math.PI * fc) / fs;
  let alpha = Math.sin(w0) / (2 * Q);
  let cos = Math.cos(w0);
  const sq = 2 * Math.sqrt(A) * alpha;
  let a0 = A + 1 - (A - 1) * cos + sq;
  const shelf: Biquad = {
    b0: (A * (A + 1 + (A - 1) * cos + sq)) / a0,
    b1: (-2 * A * (A - 1 + (A + 1) * cos)) / a0,
    b2: (A * (A + 1 + (A - 1) * cos - sq)) / a0,
    a1: (2 * (A - 1 - (A + 1) * cos)) / a0,
    a2: (A + 1 - (A - 1) * cos - sq) / a0,
  };
  // Stage 2: high pass (~38 Hz, Q 0.5).
  w0 = (2 * Math.PI * 38) / fs;
  alpha = Math.sin(w0) / (2 * 0.5);
  cos = Math.cos(w0);
  a0 = 1 + alpha;
  const hp: Biquad = {
    b0: (1 + cos) / 2 / a0,
    b1: -(1 + cos) / a0,
    b2: (1 + cos) / 2 / a0,
    a1: (-2 * cos) / a0,
    a2: (1 - alpha) / a0,
  };
  return [shelf, hp];
}

function filter(x: Float32Array, f: Biquad): Float32Array {
  const y = new Float32Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const xi = x[i]!;
    const yi = f.b0 * xi + f.b1 * x1 + f.b2 * x2 - f.a1 * y1 - f.a2 * y2;
    y[i] = yi;
    x2 = x1;
    x1 = xi;
    y2 = y1;
    y1 = yi;
  }
  return y;
}

const toLufs = (meanSquare: number) => (meanSquare > 0 ? -0.691 + 10 * Math.log10(meanSquare) : -Infinity);
const toDb = (amp: number) => (amp > 0 ? 20 * Math.log10(amp) : -Infinity);

/** Mean-square (summed over channels) for windows of `win` samples every `hop` samples. */
function blockPowers(weighted: Float32Array[], win: number, hop: number): number[] {
  const n = weighted[0]?.length ?? 0;
  const out: number[] = [];
  if (n < win) {
    let s = 0;
    for (const ch of weighted) for (let i = 0; i < n; i++) s += ch[i]! * ch[i]!;
    return n > 0 ? [s / n] : [];
  }
  // Prefix sums of squares per channel for O(n) windows.
  const prefix = weighted.map((ch) => {
    const p = new Float64Array(n + 1);
    for (let i = 0; i < n; i++) p[i + 1] = p[i]! + ch[i]! * ch[i]!;
    return p;
  });
  for (let start = 0; start + win <= n; start += hop) {
    let s = 0;
    for (const p of prefix) s += p[start + win]! - p[start]!;
    out.push(s / win);
  }
  return out;
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (pos - lo);
}

export function analyze(channels: Float32Array[], sampleRate: number): AudioStats {
  const n = channels[0]?.length ?? 0;
  let peak = 0;
  let sumSq = 0;
  let sum = 0;
  let clipped = 0;
  let nan = 0;
  for (const ch of channels) {
    for (let i = 0; i < n; i++) {
      const v = ch[i]!;
      if (!Number.isFinite(v)) {
        nan++;
        continue;
      }
      const a = Math.abs(v);
      if (a > peak) peak = a;
      if (a >= 0.999) clipped++;
      sumSq += v * v;
      sum += v;
    }
  }
  const total = Math.max(1, n * channels.length);

  const [shelf, hp] = kWeighting(sampleRate);
  const weighted = channels.map((ch) => filter(filter(ch, shelf), hp));

  // Integrated: 400 ms blocks, 75 % overlap, absolute (−70) then relative (−10 LU) gate.
  const blocks = blockPowers(weighted, Math.round(0.4 * sampleRate), Math.round(0.1 * sampleRate));
  const absGated = blocks.filter((z) => toLufs(z) > -70);
  let integrated = -Infinity;
  if (absGated.length) {
    const rel = toLufs(absGated.reduce((a, b) => a + b, 0) / absGated.length) - 10;
    const relGated = absGated.filter((z) => toLufs(z) > rel);
    if (relGated.length) integrated = toLufs(relGated.reduce((a, b) => a + b, 0) / relGated.length);
  }
  const maxMomentary = blocks.length ? Math.max(...blocks.map(toLufs)) : -Infinity;
  const impulse = blockPowers(weighted, Math.round(0.1 * sampleRate), Math.round(0.025 * sampleRate));
  const maxImpulse = impulse.length ? Math.max(...impulse.map(toLufs)) : -Infinity;

  // LRA: 3 s short-term windows, abs gate −70, relative gate −20 LU.
  const st = blockPowers(weighted, Math.round(3 * sampleRate), Math.round(0.5 * sampleRate));
  const stAbs = st.filter((z) => toLufs(z) > -70);
  let lra = 0;
  if (stAbs.length > 1) {
    const rel = toLufs(stAbs.reduce((a, b) => a + b, 0) / stAbs.length) - 20;
    const vals = stAbs
      .filter((z) => toLufs(z) > rel)
      .map(toLufs)
      .sort((a, b) => a - b);
    if (vals.length > 1) lra = percentile(vals, 0.95) - percentile(vals, 0.1);
  }

  // Silence share on unweighted 400 ms RMS.
  const raw = blockPowers(channels, Math.round(0.4 * sampleRate), Math.round(0.4 * sampleRate));
  const silent = raw.filter((z) => toDb(Math.sqrt(z / channels.length)) < -60).length;

  return {
    durationSec: n / sampleRate,
    peakDbfs: toDb(peak),
    rmsDbfs: toDb(Math.sqrt(sumSq / total)),
    integratedLufs: integrated,
    loudnessRangeLu: lra,
    maxMomentaryLufs: maxMomentary,
    maxImpulseLufs: maxImpulse,
    silentShare: raw.length ? silent / raw.length : 1,
    clippedSamples: clipped,
    nanSamples: nan,
    dcOffset: sum / total,
  };
}

/** 16-bit PCM mono WAV (downmixed, optionally decimated by an integer factor with averaging). */
export function encodeWavMono(channels: Float32Array[], sampleRate: number, decimate = 1, maxSeconds = Infinity): Uint8Array {
  const n = Math.min(channels[0]?.length ?? 0, Math.floor(maxSeconds * sampleRate));
  const outLen = Math.floor(n / decimate);
  const sr = Math.round(sampleRate / decimate);
  const buf = new ArrayBuffer(44 + outLen * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  v.setUint32(4, 36 + outLen * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, outLen * 2, true);
  for (let i = 0; i < outLen; i++) {
    let s = 0;
    for (let d = 0; d < decimate; d++) for (const ch of channels) s += ch[i * decimate + d] ?? 0;
    s /= decimate * channels.length;
    const c = Math.max(-1, Math.min(1, s));
    v.setInt16(44 + i * 2, c < 0 ? c * 0x8000 : c * 0x7fff, true);
  }
  return new Uint8Array(buf);
}

/**
 * Spectral balance: share of energy below 150 Hz (boom), 150 Hz–4 kHz (body) and above 4 kHz (hiss/sizzle).
 * A high "high" share over long listening is the usual cause of fatigue.
 */
export function bandShares(channels: Float32Array[], sampleRate: number): { low: number; mid: number; high: number } {
  const lp = (fc: number): Biquad => {
    const w0 = (2 * Math.PI * fc) / sampleRate;
    const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
    const cos = Math.cos(w0);
    const a0 = 1 + alpha;
    return { b0: (1 - cos) / 2 / a0, b1: (1 - cos) / a0, b2: (1 - cos) / 2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
  };
  const hp = (fc: number): Biquad => {
    const w0 = (2 * Math.PI * fc) / sampleRate;
    const alpha = Math.sin(w0) / (2 * Math.SQRT1_2);
    const cos = Math.cos(w0);
    const a0 = 1 + alpha;
    return { b0: (1 + cos) / 2 / a0, b1: -(1 + cos) / a0, b2: (1 + cos) / 2 / a0, a1: (-2 * cos) / a0, a2: (1 - alpha) / a0 };
  };
  const energy = (xs: Float32Array[]) => xs.reduce((s, x) => s + x.reduce((a, v) => a + v * v, 0), 0);
  const total = energy(channels) || 1;
  const low = energy(channels.map((c) => filter(filter(c, lp(150)), lp(150)))) / total;
  const high = energy(channels.map((c) => filter(filter(c, hp(4000)), hp(4000)))) / total;
  return { low, high, mid: Math.max(0, 1 - low - high) };
}

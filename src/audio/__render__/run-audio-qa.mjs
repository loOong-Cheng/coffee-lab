#!/usr/bin/env node
/**
 * Objective audio QA for Coffee Lab (nobody on the team can listen during development).
 *
 *   node src/audio/__render__/run-audio-qa.mjs            # report + small WAV previews
 *   node src/audio/__render__/run-audio-qa.mjs --no-wav   # report only
 *   node src/audio/__render__/run-audio-qa.mjs --seconds=60
 *
 * Starts a throw-away Vite dev server, opens the harness page in headless Chromium (Playwright),
 * renders every music mood and every SFX with OfflineAudioContext through the REAL mixing graph
 * at master volume 1 (worst case), measures peak / loudness / LRA / silence / NaN, checks the
 * generative score's variety over 10 minutes, then writes reports/AUDIO_QA.md and reports/audio/*.wav.
 * Exit code 1 if any check fails.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const args = process.argv.slice(2);
const wav = !args.includes('--no-wav');
const secondsArg = args.find((a) => a.startsWith('--seconds='));
const musicSeconds = secondsArg ? Number(secondsArg.split('=')[1]) : 45;

// ── pass/fail thresholds (documented in the report) ──
const T = {
  peakMax: -1.0, // dBFS, everything
  musicLufs: [-30, -18], // integrated, body of each mood
  musicLraMax: 12, // LU
  musicLraMin: 0.5, // LU — some breathing dynamics
  musicSilentMax: 0.1, // share of 400 ms blocks below −60 dBFS (body)
  musicHighMax: 0.08, // energy share above 4 kHz (hiss/sizzle → listening fatigue)
  musicLowMax: 0.6, // energy share below 150 Hz (boom)
  sfxLoudness: [-27, -15], // LUFS, max 100 ms K-weighted loudness
  sfxSpreadMax: 8, // LU between loudest and quietest SFX
  sfxOverMusicMin: 4, // LU: median SFX peak loudness above the loudest music mood
  varietyDistinctMin: 6, // distinct section progressions in 10 min
  varietyRepeatsMax: 0, // exact repeats of a whole section
  eventsPerBarMax: 140, // CPU sanity
};

const fmt = (x, d = 1) => (Number.isFinite(x) ? x.toFixed(d) : String(x));

async function main() {
  const server = await createServer({
    root,
    configFile: path.join(root, 'vite.config.ts'),
    logLevel: 'error',
    server: { port: 5199, strictPort: false, open: false },
  });
  await server.listen();
  const base = server.resolvedUrls?.local?.[0] ?? 'http://localhost:5199/';
  const browser = await chromium.launch();
  let result;
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.error('[page error]', e.message));
    await page.goto(new URL('src/audio/__render__/audio-qa.html', base).href);
    await page.waitForFunction(() => typeof window.__runAudioQA === 'function', null, { timeout: 60000 });
    result = await page.evaluate((o) => window.__runAudioQA(o), { musicSeconds, wav, wavSeconds: 12 });
  } finally {
    await browser.close();
    await server.close();
  }

  const fails = [];
  const check = (ok, msg) => {
    if (!ok) fails.push(msg);
    return ok ? 'PASS' : '**FAIL**';
  };

  const lines = [];
  lines.push('# Audio QA report (objective, offline renders)');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString()} by \`node src/audio/__render__/run-audio-qa.mjs\` in headless ${result.userAgent.match(/(HeadlessChrome|Chrome)\/[\d.]+/)?.[0] ?? 'Chromium'}.`);
  lines.push('');
  lines.push('No one on the build team can listen, so these numbers are the evidence: each mood and each SFX is rendered with `OfflineAudioContext` through the **same mixing graph as the app** (buses → master → glue compressor → −3 dBFS limiter) at **master volume 1** (the worst case for clipping; the app defaults to 0.7 ≈ −6 dB). Loudness is K-weighted, BS.1770-style (400 ms gated blocks, 3 s short-term for LRA). These checks prove the audio is clean, balanced and varied. They cannot prove it *sounds nice*: that still needs a human ear. WAV previews are in `reports/audio/`.');
  lines.push('');
  lines.push('## Music moods');
  lines.push('');
  lines.push(`Render: ${musicSeconds} s per mood, seed 7. “Body” excludes the first 6 s (fade-in/intro).`);
  lines.push('');
  lines.push('| Mood | Peak dBFS | Integrated LUFS (body) | LRA LU (body) | Silent share (body) | Energy <150 Hz / mid / >4 kHz | NaN | Sections heard | Result |');
  lines.push('|---|---|---|---|---|---|---|---|---|');
  let loudestMusic = -Infinity;
  for (const m of result.music) {
    const b = m.body;
    loudestMusic = Math.max(loudestMusic, b.integratedLufs);
    const ok =
      m.full.peakDbfs <= T.peakMax &&
      b.integratedLufs >= T.musicLufs[0] &&
      b.integratedLufs <= T.musicLufs[1] &&
      b.loudnessRangeLu <= T.musicLraMax &&
      b.loudnessRangeLu >= T.musicLraMin &&
      b.silentShare <= T.musicSilentMax &&
      m.bands.high <= T.musicHighMax &&
      m.bands.low <= T.musicLowMax &&
      m.full.nanSamples === 0;
    lines.push(
      `| ${m.mood} | ${fmt(m.full.peakDbfs)} | ${fmt(b.integratedLufs)} | ${fmt(b.loudnessRangeLu)} | ${fmt(b.silentShare * 100, 0)}% | ${fmt(m.bands.low * 100, 0)}% / ${fmt(m.bands.mid * 100, 0)}% / ${fmt(m.bands.high * 100, 1)}% | ${m.full.nanSamples} | ${m.sections.join(', ')} | ${check(ok, `music ${m.mood}`)} |`,
    );
  }
  lines.push('');
  lines.push(`Thresholds: peak ≤ ${T.peakMax} dBFS; integrated ${T.musicLufs[0]}…${T.musicLufs[1]} LUFS (background level); LRA ${T.musicLraMin}…${T.musicLraMax} LU; silent share ≤ ${T.musicSilentMax * 100}%; energy above 4 kHz ≤ ${T.musicHighMax * 100}% and below 150 Hz ≤ ${T.musicLowMax * 100}% (fatigue/boom); no NaN.`);
  lines.push('');
  lines.push('## Variety over 10 minutes (generative score, seed 11)');
  lines.push('');
  lines.push('| Mood | Bars | Cycles | Sections (count) | Distinct progressions | Exact section repeats | Distinct chords | Keys used | Tempo range | Melody notes/min | Events/bar (mean / max) | Energy range | Result |');
  lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  const pcs = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  for (const v of result.variety) {
    const ok =
      v.distinctProgressions >= T.varietyDistinctMin &&
      v.exactSectionRepeats <= T.varietyRepeatsMax &&
      v.maxEventsPerBar <= T.eventsPerBarMax;
    lines.push(
      `| ${v.mood} | ${v.bars} | ${v.cycles} | ${Object.entries(v.sections)
        .map(([k, n]) => `${k}×${n}`)
        .join(' ')} | ${v.distinctProgressions} | ${v.exactSectionRepeats}/${v.sectionInstances} | ${v.distinctChords} | ${v.keys
        .map((k) => pcs[k])
        .join(' ')} | ${fmt(v.tempoRange[0], 0)}–${fmt(v.tempoRange[1], 0)} | ${fmt(v.melodyNotesPerMinute, 0)} | ${fmt(v.meanEventsPerBar, 0)} / ${v.maxEventsPerBar} | ${fmt(v.energyRange[0], 2)}–${fmt(v.energyRange[1], 2)} | ${check(ok, `variety ${v.mood}`)} |`,
    );
  }
  lines.push('');
  lines.push(`Thresholds: ≥ ${T.varietyDistinctMin} distinct section progressions in 10 min; ${T.varietyRepeatsMax} exact whole-section repeats; ≤ ${T.eventsPerBarMax} note events per bar (CPU).`);
  lines.push('');
  lines.push('## Sound effects');
  lines.push('');
  lines.push('| SFX | Peak dBFS | Loudness LUFS (max 100 ms) | Max momentary LUFS (400 ms) | Audible length s | NaN | Result |');
  lines.push('|---|---|---|---|---|---|---|');
  const mom = [];
  for (const s of result.sfx) {
    const st = s.stats;
    mom.push(st.maxImpulseLufs);
    const ok =
      st.peakDbfs <= T.peakMax &&
      st.maxImpulseLufs >= T.sfxLoudness[0] &&
      st.maxImpulseLufs <= T.sfxLoudness[1] &&
      st.nanSamples === 0;
    lines.push(
      `| ${s.name} | ${fmt(st.peakDbfs)} | ${fmt(st.maxImpulseLufs)} | ${fmt(st.maxMomentaryLufs)} | ${fmt(s.tailSec, 2)} | ${st.nanSamples} | ${check(ok, `sfx ${s.name}`)} |`,
    );
  }
  const spread = Math.max(...mom) - Math.min(...mom);
  const sorted = [...mom].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  lines.push('');
  lines.push(`- Loudness spread across all SFX: **${fmt(spread)} LU** (max ${T.sfxSpreadMax}) → ${check(spread <= T.sfxSpreadMax, 'sfx spread')}`);
  lines.push(`- Median SFX loudness ${fmt(median)} LUFS vs loudest music mood ${fmt(loudestMusic)} LUFS: **${fmt(median - loudestMusic)} LU** headroom (min ${T.sfxOverMusicMin}) → ${check(median - loudestMusic >= T.sfxOverMusicMin, 'sfx over music')}`);
  lines.push(`- Thresholds: peak ≤ ${T.peakMax} dBFS; loudness (max 100 ms, K-weighted) ${T.sfxLoudness[0]}…${T.sfxLoudness[1]} LUFS; no NaN.`);
  lines.push('');
  lines.push('## Verdict');
  lines.push('');
  lines.push(fails.length ? `**${fails.length} check(s) failed:** ${fails.join('; ')}` : '**All objective checks pass.** Subjective listening is still pending (no human has heard these renders yet).');
  lines.push('');

  mkdirSync(path.join(root, 'reports'), { recursive: true });
  writeFileSync(path.join(root, 'reports', 'AUDIO_QA.md'), lines.join('\n'));
  if (wav) {
    const dir = path.join(root, 'reports', 'audio');
    mkdirSync(dir, { recursive: true });
    for (const m of result.music) if (m.wav) writeFileSync(path.join(dir, `music-${m.mood}.wav`), Buffer.from(m.wav, 'base64'));
    for (const s of result.sfx) if (s.wav) writeFileSync(path.join(dir, `sfx-${s.name}.wav`), Buffer.from(s.wav, 'base64'));
  }
  // Machine-readable numbers for follow-up tooling.
  const slim = { ...result, music: result.music.map(({ wav: _w, ...m }) => m), sfx: result.sfx.map(({ wav: _w, ...s }) => s) };
  writeFileSync(path.join(root, 'reports', 'audio-qa.json'), JSON.stringify(slim, null, 2));
  console.log(lines.join('\n'));
  if (fails.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { describe, expect, it } from 'vitest';
import { suggestNextChange, type AdviceInput } from './advice';

const esp = (x: Partial<AdviceInput>): AdviceInput => ({ kind: 'espresso', ...x });
const brew = (x: Partial<AdviceInput>): AdviceInput => ({ kind: 'brew', ...x });

describe('suggestNextChange — honesty guarantees', () => {
  it('returns null for non-brew practices (e.g. milk steaming)', () => {
    expect(suggestNextChange({ kind: 'none', tasteTags: ['sour'] })).toBeNull();
  });

  it('asks for more data instead of guessing when nothing was logged', () => {
    const a = suggestNextChange(esp({}))!;
    expect(a.change).toBe('log-more');
    expect(a.target).toBeUndefined();
  });

  it('always carries an uncertainty caveat in both languages and suggests exactly one change', () => {
    const inputs: AdviceInput[] = [
      esp({ doseG: 18, outG: 36, timeSec: 19, tasteTags: ['sour'] }),
      esp({ doseG: 18, outG: 36, timeSec: 45, tasteTags: ['bitter'] }),
      brew({ doseG: 15, outG: 250, tasteTags: ['watery'] }),
      brew({ tasteTags: ['balanced'], rating: 5 }),
    ];
    for (const i of inputs) {
      const a = suggestNextChange(i)!;
      expect(a.caveat.en).toMatch(/rule of thumb/i);
      expect(a.caveat.en).toMatch(/one thing/i);
      expect(a.caveat.zh.length).toBeGreaterThan(5);
      expect(typeof a.change).toBe('string');
      expect(a.headline.en).not.toMatch(/\band\b.*\band\b/); // one headline, not a list of changes
    }
  });

  it('never claims what the next cup WILL taste like', () => {
    const a = suggestNextChange(esp({ doseG: 18, outG: 36, timeSec: 19, tasteTags: ['sour'] }))!;
    expect(`${a.headline.en} ${a.reason.en}`).not.toMatch(/will taste|guarantee|perfect/i);
    expect(a.reason.en).toMatch(/usually/);
  });
});

describe('suggestNextChange — espresso rules of thumb', () => {
  it('sour + fast → grind finer, citing the reported time', () => {
    const a = suggestNextChange(esp({ doseG: 18, outG: 36, timeSec: 19, tasteTags: ['sour'], targetTimeSec: [25, 35] }))!;
    expect(a.change).toBe('grind-finer');
    expect(a.basis).toEqual(['taste:under', 'time:fast']);
    expect(a.reason.en).toContain('19 s');
    expect(a.reason.en).toContain('25–35 s');
  });

  it('sour with a normal time → a little more yield, computed from the learner’s own numbers', () => {
    const a = suggestNextChange(esp({ doseG: 18, outG: 36, timeSec: 30, tasteTags: ['sour'] }))!;
    expect(a.change).toBe('longer-ratio');
    expect(a.target?.en).toContain('40 g out from the same 18 g');
  });

  it('bitter + slow → grind coarser', () => {
    expect(suggestNextChange(esp({ doseG: 18, outG: 36, timeSec: 45, tasteTags: ['bitter'] }))!.change).toBe('grind-coarser');
  });

  it('bitter with a normal time → slightly shorter yield', () => {
    const a = suggestNextChange(esp({ doseG: 18, outG: 40, timeSec: 30, tasteTags: ['harsh'] }))!;
    expect(a.change).toBe('shorter-ratio');
    expect(a.target?.en).toContain('36 g out');
  });

  it('sour AND bitter → technique (even extraction), recipe unchanged', () => {
    expect(suggestNextChange(esp({ doseG: 18, outG: 36, timeSec: 28, tasteTags: ['sour', 'bitter'] }))!.change).toBe('even-extraction');
  });

  it('only a time outside the reference → time-based nudge; inside → ask for a taste word', () => {
    expect(suggestNextChange(esp({ timeSec: 15 }))!.change).toBe('grind-finer');
    expect(suggestNextChange(esp({ timeSec: 50 }))!.change).toBe('grind-coarser');
    const a = suggestNextChange(esp({ timeSec: 30 }))!;
    expect(a.change).toBe('log-more');
    expect(a.reason.en).toMatch(/common beginner reference/);
  });

  it('good taste or a high rating → keep the recipe and repeat it', () => {
    expect(suggestNextChange(esp({ doseG: 18, outG: 36, tasteTags: ['sweet', 'balanced'] }))!.change).toBe('keep');
    expect(suggestNextChange(esp({ rating: 5 }))!.change).toBe('keep');
    expect(suggestNextChange(esp({ tasteTags: ['heavy'], rating: 4 }))!.change).toBe('keep');
  });

  it('flags implausible numbers (likely typos) before suggesting anything', () => {
    const a = suggestNextChange(esp({ doseG: 18, outG: 250, tasteTags: ['sour'] }))!; // pour-over numbers typed into an espresso log
    expect(a.change).toBe('check-numbers');
    expect(suggestNextChange(esp({ doseG: 36, outG: 18 }))!.change).toBe('check-numbers');
  });
});

describe('suggestNextChange — pour-over / immersion', () => {
  it('watery → a little more coffee for the same water', () => {
    const a = suggestNextChange(brew({ doseG: 15, outG: 255, tasteTags: ['watery'] }))!;
    expect(a.change).toBe('more-coffee');
    expect(a.target?.en).toMatch(/about 16 g coffee for the same 255 g water/);
  });

  it('heavy and not enjoyed → a little more water for the same coffee', () => {
    const a = suggestNextChange(brew({ doseG: 15, outG: 225, tasteTags: ['heavy'], rating: 2 }))!;
    expect(a.change).toBe('more-water');
    expect(a.target?.en).toContain('240 g water');
  });

  it('sour → finer, bitter → coarser; brew time alone is not used without an authored window', () => {
    expect(suggestNextChange(brew({ tasteTags: ['sour'] }))!.change).toBe('grind-finer');
    expect(suggestNextChange(brew({ tasteTags: ['bitter'] }))!.change).toBe('grind-coarser');
    expect(suggestNextChange(brew({ timeSec: 90 }))!.change).toBe('log-more');
    expect(suggestNextChange(brew({ timeSec: 90, targetTimeSec: [150, 210] }))!.change).toBe('grind-finer');
  });

  it('accepts unusual but real brew ratios (cold brew concentrate) and flags absurd ones', () => {
    expect(suggestNextChange(brew({ doseG: 100, outG: 500, tasteTags: ['balanced'] }))!.change).toBe('keep');
    expect(suggestNextChange(brew({ doseG: 15, outG: 30 }))!.change).toBe('check-numbers');
  });
});

import { describe, expect, it } from 'vitest';
import { BRAND_DISCLAIMER as rawDisclaimer, brands as rawBrands, type BrandKind } from './brands';
import { sources as brandSources } from './sources.brands';
import { BRAND_DISCLAIMER, brands, drinks, equipment, getBrand, lessons, sources } from './index';

const drinkIds = new Set(drinks.map((d) => d.id));
const equipmentIds = new Set(equipment.map((e) => e.id));
const lessonIds = new Set(lessons.map((l) => l.id));
const sourceIds = new Set(sources.map((s) => s.id));
const KINDS: BrandKind[] = ['cafe-chain', 'roaster', 'equipment'];
const CONFIDENCE = new Set(['verified', 'rule-of-thumb', 'illustrative-model']);
const THIS_YEAR = new Date().getFullYear();

/** Recursively collect every {zh, en} object. */
function collectLocalized(node: unknown, path: string, out: Array<{ path: string; zh: unknown; en: unknown }>): void {
  if (Array.isArray(node)) {
    node.forEach((n, i) => collectLocalized(n, `${path}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if ('zh' in o || 'en' in o) out.push({ path, zh: o.zh, en: o.en });
    for (const [k, v] of Object.entries(o)) collectLocalized(v, `${path}.${k}`, out);
  }
}

describe('brands: catalog shape', () => {
  it('is exported from the content index unchanged', () => {
    expect(brands).toEqual(rawBrands);
    expect(BRAND_DISCLAIMER).toBe(rawDisclaimer);
    expect(brands.length).toBeGreaterThanOrEqual(30);
    expect(brands.length).toBeLessThanOrEqual(36);
  });

  it('has unique, kebab-case ids and getBrand resolves each', () => {
    const ids = brands.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of brands) {
      expect(b.id, b.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(getBrand(b.id)).toBe(b);
    }
    expect(getBrand('no-such-brand')).toBeUndefined();
  });

  it('has at least 8 brands of each kind', () => {
    for (const k of KINDS) {
      expect(brands.filter((b) => b.kind === k).length, k).toBeGreaterThanOrEqual(8);
    }
    for (const b of brands) expect(KINDS, b.id).toContain(b.kind);
  });

  it('includes major Chinese brands alongside global ones', () => {
    for (const id of ['luckin', 'cotti', 'manner', 'saturnbird', 'timemore']) expect(getBrand(id), id).toBeDefined();
    const chinese = brands.filter((b) => b.country.en === 'China' || b.country.en.endsWith(', China'));
    expect(chinese.length).toBeGreaterThanOrEqual(6);
  });

  it('keeps list fields within their stated sizes', () => {
    for (const b of brands) {
      expect(b.signature.length, `${b.id} signature`).toBeGreaterThanOrEqual(1);
      expect(b.signature.length, `${b.id} signature`).toBeLessThanOrEqual(3);
      if (b.menuDecoder) expect(b.menuDecoder.length, `${b.id} menuDecoder`).toBeGreaterThan(0);
    }
  });
});

describe('brands: bilingual text', () => {
  it('every LocalizedText is non-empty in both languages (incl. disclaimer)', () => {
    const all: Array<{ path: string; zh: unknown; en: unknown }> = [];
    collectLocalized(brands, 'brands', all);
    collectLocalized(BRAND_DISCLAIMER, 'BRAND_DISCLAIMER', all);
    expect(all.length).toBeGreaterThan(brands.length * 5);
    const bad = all.filter(
      (t) => typeof t.zh !== 'string' || typeof t.en !== 'string' || !t.zh.trim() || !t.en.trim(),
    );
    expect(bad.map((t) => t.path)).toEqual([]);
  });

  it('zh text actually contains Chinese and en text is not a copy of zh', () => {
    const all: Array<{ path: string; zh: unknown; en: unknown }> = [];
    collectLocalized(brands, 'brands', all);
    for (const b of brands) {
      // Each brand's prose fields must contain CJK characters in zh.
      for (const [field, t] of [['knownFor', b.knownFor], ['learnFromIt', b.learnFromIt], ['country', b.country]] as const) {
        expect(t.zh, `${b.id}.${field}`).toMatch(/[一-鿿]/);
      }
    }
    // Brand names may legitimately be identical in both languages; prose may not.
    expect(all.filter((t) => !t.path.endsWith('.name') && t.zh === t.en).map((t) => t.path)).toEqual([]);
  });

  it('names use one language at a time: en has no CJK; zh is CJK-only or Latin-only', () => {
    const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
    const LATIN_WORD = /[A-Za-zÀ-ɏ]{2,}/;
    for (const b of brands) {
      expect(b.name.en, `${b.id}.name.en`).not.toMatch(CJK);
      const mixed = CJK.test(b.name.zh) && LATIN_WORD.test(b.name.zh);
      expect(mixed, `${b.id}.name.zh mixes scripts: ${b.name.zh}`).toBe(false);
    }
  });

  it('no en text contains CJK, and zh never glosses a term with its English twin in parentheses', () => {
    const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
    // e.g. “焦糖玛奇朵（Caramel Macchiato）”; lists like “（Primo / Medio / Massimo）” are taught terms and allowed.
    const GLOSS = /[\p{Script=Han}]（[A-Za-zÀ-ɏ][A-Za-zÀ-ɏ\s’'.-]*）/u;
    const all: Array<{ path: string; zh: unknown; en: unknown }> = [];
    collectLocalized(brands, 'brands', all);
    collectLocalized(BRAND_DISCLAIMER, 'BRAND_DISCLAIMER', all);
    expect(all.filter((t) => CJK.test(String(t.en))).map((t) => t.path)).toEqual([]);
    expect(all.filter((t) => GLOSS.test(String(t.zh))).map((t) => t.path)).toEqual([]);
    // Japanese kana never appears in zh either (Chinese text only).
    expect(all.filter((t) => /[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(String(t.zh))).map((t) => t.path)).toEqual([]);
  });

  it('avoids ranking and advertising language', () => {
    // “best-known” describes recognition, not rank, so it is allowed.
    const banned = /\bbest\b(?![- ]known)|\b(No\.\s?1|number one|world'?s leading|must-buy|must-have)\b|最好|第一名|最佳|必买/i;
    const all: Array<{ path: string; zh: unknown; en: unknown }> = [];
    collectLocalized(brands, 'brands', all);
    const hits = all.filter((t) => banned.test(String(t.en)) || banned.test(String(t.zh))).map((t) => t.path);
    expect(hits).toEqual([]);
  });
});

describe('brands: cross-references and provenance', () => {
  it('every related drink, equipment and lesson id exists', () => {
    const bad: string[] = [];
    for (const b of brands) {
      for (const d of b.relatedDrinkIds) if (!drinkIds.has(d)) bad.push(`${b.id} drink:${d}`);
      for (const e of b.relatedEquipmentIds) if (!equipmentIds.has(e)) bad.push(`${b.id} equipment:${e}`);
      for (const l of b.relatedLessonIds) if (!lessonIds.has(l)) bad.push(`${b.id} lesson:${l}`);
    }
    expect(bad).toEqual([]);
  });

  it('every brand has at least one source, and all source ids resolve', () => {
    const bad: string[] = [];
    for (const b of brands) {
      if (b.sources.length < 1) bad.push(`${b.id}: no sources`);
      for (const s of b.sources) if (!sourceIds.has(s)) bad.push(`${b.id}: ${s}`);
    }
    expect(bad).toEqual([]);
  });

  it('brand sources are prefixed, unique, merged into the aggregate and all used', () => {
    const ids = brandSources.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of brandSources) {
      expect(s.id).toMatch(/^brand-/);
      expect(s.title.trim().length, s.id).toBeGreaterThan(0);
      expect(sourceIds.has(s.id), s.id).toBe(true);
    }
    const used = new Set(brands.flatMap((b) => b.sources));
    expect(ids.filter((id) => !used.has(id))).toEqual([]);
  });

  it('asOf and founded years are sane; confidence is a known level', () => {
    for (const b of brands) {
      expect(Number.isInteger(b.asOf), b.id).toBe(true);
      expect(b.asOf, b.id).toBeGreaterThanOrEqual(2024);
      expect(b.asOf, b.id).toBeLessThanOrEqual(Math.max(THIS_YEAR, 2026));
      if (b.founded !== undefined) {
        expect(b.founded, b.id).toBeGreaterThanOrEqual(1800);
        expect(b.founded, b.id).toBeLessThanOrEqual(b.asOf);
      }
      expect(CONFIDENCE.has(b.confidence), b.id).toBe(true);
      expect(b.confidence, `${b.id}: brand facts are never a model`).not.toBe('illustrative-model');
    }
  });
});

describe('brands: safety and honesty', () => {
  it('heat, pressure and grinder equipment brands carry a safety note', () => {
    for (const id of ['la-marzocco', 'breville', 'delonghi', 'bialetti', 'baratza', 'fellow']) {
      expect(getBrand(id)?.safetyNote, id).toBeDefined();
    }
  });

  it('safety notes never give repair instructions; machine care defers to the manual', () => {
    for (const b of brands) {
      if (!b.safetyNote) continue;
      expect(b.safetyNote.en, b.id).not.toMatch(/\b(disassemble|open the (case|housing)|bypass|remove the valve)\b/i);
    }
    for (const id of ['la-marzocco', 'breville', 'delonghi']) {
      expect(getBrand(id)?.safetyNote?.en, id).toMatch(/manual/i);
    }
  });

  it('the disclaimer states no affiliation and that facts change', () => {
    expect(BRAND_DISCLAIMER.en).toMatch(/not affiliated/i);
    expect(BRAND_DISCLAIMER.en).toMatch(/change/i);
    expect(BRAND_DISCLAIMER.zh).toMatch(/没有任何关联/);
  });

  it('chain menu decoders give approximate volumes, never exact guarantees', () => {
    const sb = getBrand('starbucks');
    expect(sb?.menuDecoder?.length).toBeGreaterThanOrEqual(4);
    for (const line of sb?.menuDecoder ?? []) {
      if (/ml/.test(line.en)) expect(line.en, line.en).toMatch(/about|≈/);
    }
  });
});

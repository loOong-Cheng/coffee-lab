/**
 * Source references for the breadth layer (equipment catalog, Drink Atlas,
 * explore + culture tracks). Owner: coffee-curriculum (atlas).
 *
 * All ids are prefixed `atlas-` so they never collide with core `sources.ts`.
 * Provenance notes, confidence and flagged legends live in
 * docs/CONTENT_SOURCES_ATLAS.md. Nothing here is copied text; we paraphrase
 * short facts and link out. Accessed date = review date for this pass.
 */
import type { SourceRef } from '../domain/contracts';

const ACCESSED = '2026-11-07';

export const sources: SourceRef[] = [
  // ── Professional / standards bodies ──
  {
    id: 'atlas-sca-csp',
    title: 'Specialty Coffee Association — Coffee Skills Program (topic coverage: brewing, barista skills, sensory, green coffee, roasting)',
    url: 'https://education.sca.coffee/coffee-skills-program',
    accessed: ACCESSED,
    note: 'Used for curriculum scope (which topics belong together), not for specific numbers.',
  },
  {
    id: 'atlas-sca-flavor-wheel',
    title: "SCA & World Coffee Research — Coffee Taster's Flavor Wheel (2016 revision, based on the WCR Sensory Lexicon)",
    url: 'https://sca.coffee/research/coffee-tasters-flavor-wheel',
    accessed: ACCESSED,
    note: 'Referenced by name only. The wheel graphic is CC BY-NC-ND and is NOT reproduced or translated in the app.',
  },
  {
    id: 'atlas-sca-water',
    title: 'SCA (formerly SCAA) water standard for brewing specialty coffee, as summarized in the SCA Water Quality Handbook',
    accessed: ACCESSED,
    note: 'Target values (e.g. TDS ~150 mg/L, acceptable ~75–250 mg/L; pH ~7; no chlorine) cross-checked against several secondary summaries; original handbook not retrieved directly.',
  },
  {
    id: 'atlas-sca-golden-cup',
    title: 'SCA Golden Cup brewing guideline (≈55 g coffee per litre of water; 92–96 °C water) — manufacturer summary',
    url: 'https://support.moccamaster.com/hc/en-us/articles/1500009409121-What-is-the-Golden-Cup-standard',
    accessed: ACCESSED,
    note: 'A batch-brew guideline. Used only as one reference point, never as "the correct" recipe.',
  },
  {
    id: 'atlas-batali-2020',
    title: 'Batali, Ristenpart & Guinard (2020), "Brew temperature, at fixed brew strength and extraction, has little impact on the sensory profile of drip brew coffee", Scientific Reports — SCA news summary',
    url: 'https://sca.coffee/sca-news/read/just-published-brewing-temperature-and-the-sensory-profile-of-brewed-coffee',
    accessed: ACCESSED,
    note: 'Supports the teaching point that temperature mostly changes extraction speed; study covered only 87–93 °C drip brew.',
  },
  {
    id: 'atlas-nca-history',
    title: 'National Coffee Association USA — History of Coffee',
    url: 'https://www.aboutcoffee.org/origins/history-of-coffee/',
    accessed: ACCESSED,
    note: 'Explicitly labels the goat-herder (Kaldi) story a legend. Other anecdotes there (papal approval, bouquet) treated as colourful/uncertain.',
  },
  {
    id: 'atlas-nca-lifecycle',
    title: 'National Coffee Association USA — Lifecycle of coffee (seed to cup; natural, washed and honey processing)',
    url: 'https://www.aboutcoffee.org/origins/lifecycle-of-coffee/',
    accessed: ACCESSED,
  },
  {
    id: 'atlas-wcr-varieties',
    title: 'World Coffee Research — Arabica Coffee Varieties catalog',
    url: 'https://varieties.worldcoffeeresearch.org/',
    accessed: ACCESSED,
    note: 'Background for species/variety vocabulary (arabica vs canephora/robusta).',
  },
  {
    id: 'atlas-ico',
    title: 'International Coffee Organization — coffee market and producing-country data',
    url: 'https://www.ico.org/',
    accessed: ACCESSED,
    note: 'General reference for producer-country context; no specific statistic is quoted in the app.',
  },
  // ── Encyclopedic / historical (secondary; cross-checked) ──
  {
    id: 'atlas-wiki-history',
    title: 'Wikipedia — History of coffee (secondary; used for dates cross-checked with NCA)',
    url: 'https://en.wikipedia.org/wiki/History_of_coffee',
    accessed: ACCESSED,
    note: 'Kaldi story first written down 1671 (Nairon); Sufi use in Yemen by the 15th century; Mecca ban 1511; de Clieu ~1720s; Palheta ~1727.',
  },
  {
    id: 'atlas-wiki-coffeehouse',
    title: 'Wikipedia — Coffeehouse (secondary; early coffeehouse dates)',
    url: 'https://en.wikipedia.org/wiki/Coffeehouse',
    accessed: ACCESSED,
    note: 'Istanbul c. 1554–55 (Peçevi chronicle); Oxford 1650/51; London 1652; Vienna: Kolschitzky legend vs Diodato 1685; Café Procope dates differ (1686/1689).',
  },
  {
    id: 'atlas-wiki-espresso-machine',
    title: 'Wikipedia — Espresso machine (secondary; Moriondo 1884, Bezzera/Pavoni, Gaggia, Faema E61)',
    url: 'https://en.wikipedia.org/wiki/Espresso_machine',
    accessed: ACCESSED,
    note: 'Some dates (Bezzera patent 1901 vs 1902; Gaggia lever 1938 vs 1947/48) differ across sources — content uses ranges.',
  },
  {
    id: 'atlas-wiki-cappuccino',
    title: 'Wikipedia / Wiktionary — Cappuccino (name from Capuchin friars via Viennese "Kapuziner")',
    url: 'https://en.wikipedia.org/wiki/Cappuccino',
    accessed: ACCESSED,
    note: 'Marco d’Aviano naming story is folklore and flagged as such.',
  },
  {
    id: 'atlas-wiki-flat-white',
    title: 'Wikipedia — Flat white (disputed Australia / New Zealand origin)',
    url: 'https://en.wikipedia.org/wiki/Flat_white',
    accessed: ACCESSED,
  },
  {
    id: 'atlas-wiki-frappe',
    title: 'Wikipedia — Frappé coffee (Thessaloniki 1957 story; competing accounts)',
    url: 'https://en.wikipedia.org/wiki/Frapp%C3%A9_coffee',
    accessed: ACCESSED,
  },
  {
    id: 'atlas-wiki-vietnam-coffee',
    title: 'Wikipedia — Vietnamese iced coffee (phin, condensed milk, French colonial introduction)',
    url: 'https://en.wikipedia.org/wiki/Vietnamese_iced_coffee',
    accessed: ACCESSED,
    note: '1857 introduction date and the "fresh milk was scarce" explanation are widely repeated but not verified against primary sources.',
  },
  {
    id: 'atlas-wiki-third-wave',
    title: 'Wikipedia — Third-wave coffee (term popularized by Trish Rothgeb, early 2000s)',
    url: 'https://en.wikipedia.org/wiki/Third-wave_coffee',
    accessed: ACCESSED,
    note: 'Article year cited as 2002 or 2003 depending on source; content says "early 2000s".',
  },
  // ── Intangible cultural heritage / institutions ──
  {
    id: 'atlas-unesco-turkish',
    title: 'UNESCO Intangible Cultural Heritage — Turkish coffee culture and tradition (inscribed 2013)',
    url: 'https://ich.unesco.org/en/RL/turkish-coffee-culture-and-tradition-00645',
    accessed: ACCESSED,
  },
  {
    id: 'atlas-unesco-arabic',
    title: 'UNESCO Intangible Cultural Heritage — Arabic coffee, a symbol of generosity (2015; extended 2024)',
    url: 'https://ich.unesco.org/en/RL/arabic-coffee-a-symbol-of-generosity-02111',
    accessed: ACCESSED,
    note: 'First inscribed 2015 (UAE, Saudi Arabia, Oman, Qatar); 2024 extension added Jordan. Elders/guests served first, right hand, shaking the cup signals "enough".',
  },
  {
    id: 'atlas-hk-milk-tea',
    title: 'Hong Kong Memory — Representative List of the Intangible Cultural Heritage of Hong Kong (Hong Kong-style milk tea making technique)',
    url: 'https://www.hkmemory.hk/en/collections-ichhk_ii-about.html',
    accessed: ACCESSED,
    note: 'Milk-tea technique listed in Hong Kong ICH inventory (2017). Yuenyeung itself: origin story uncertain.',
  },
  {
    id: 'atlas-moma-chemex',
    title: 'MoMA collection — Peter Schlumbohm, Chemex Coffee Maker (1941)',
    url: 'https://www.moma.org/collection/works/1847',
    accessed: ACCESSED,
  },
  // ── Manufacturers (device history / usage) ──
  {
    id: 'atlas-aeropress',
    title: 'AeroPress — About (Alan Adler; debuted November 2005)',
    url: 'https://aeropress.com/pages/about',
    accessed: ACCESSED,
  },
  {
    id: 'atlas-melitta',
    title: 'Melitta Group — company history: 1908 paper coffee filter (Melitta Bentz, Dresden)',
    url: 'https://www.melitta-group.com/en/unternehmen/unsere-geschichte/1908',
    accessed: ACCESSED,
  },
  {
    id: 'atlas-hario-v60',
    title: 'HARIO — The origin of the V60 (cone dripper with spiral ribs, 60° angle)',
    url: 'https://global.hario.com/sp_v60series.html',
    accessed: ACCESSED,
    note: 'Launch year given as 2004 (some sources 2005); content says "mid-2000s".',
  },
  {
    id: 'atlas-bialetti',
    title: 'Bialetti / Moka Express history (Alfonso Bialetti, 1933) — encyclopedic summary',
    url: 'https://en.wikipedia.org/wiki/Bialetti',
    accessed: ACCESSED,
    note: 'The "laundry boiler inspiration" story is repeated widely without primary documentation — flagged as a story.',
  },
  {
    id: 'atlas-manufacturer-manuals',
    title: "Your own device's manufacturer manual (espresso machine, grinder, kettle, moka pot, siphon)",
    note: 'Authoritative for descaling, backflushing, gaskets, valves, burner use and any disassembly. The app never gives machine-specific maintenance procedures.',
  },
  // ── Culture / regional (journalism & case studies) ──
  {
    id: 'atlas-barista-mag-olla',
    title: 'Barista Magazine — Coffee drinks from around the world: Café de olla',
    url: 'https://baristamagazine.com/cafe-de-olla',
    accessed: ACCESSED,
    note: 'Mexican Revolution / soldadera origin is a popular story without academic documentation — flagged as legend.',
  },
  {
    id: 'atlas-barista-mag-jebena',
    title: 'Barista Magazine — The theology of three rounds: a morning with the jebena in an Ethiopian coffee ceremony',
    url: 'https://www.baristamagazine.com/the-theology-of-three-rounds-a-morning-with-the-jebena-in-an-ethiopian-coffee-ceremony/',
    accessed: ACCESSED,
    note: 'Three rounds: abol, tona, baraka (Amharic names). Practices vary by region and family.',
  },
  {
    id: 'atlas-yunnan-case',
    title: 'UBC Open Case Studies — History and development of coffee plantations in Yunnan Province, China',
    url: 'https://wiki.ubc.ca/Documentation:Open_Case_Studies/FRST522/2022/History_and_development_of_coffee_plantations_in_Yunnan_Province,_China:_an_assessment',
    accessed: ACCESSED,
    note: 'Missionary introduction near Zhukula (Binchuan) — dates cited range 1892–1904; content gives "around 1900".',
  },
  {
    id: 'atlas-japan-kissaten',
    title: 'Japan House Los Angeles — For the love of coffee (Kahiichakan, Tokyo, 1888; kissaten culture)',
    url: 'https://japanhousela.com/articles/for-the-love-of-coffee',
    accessed: ACCESSED,
  },
  {
    id: 'atlas-fda-lead-pottery',
    title: 'U.S. FDA — Questions and answers on lead-glazed traditional pottery',
    url: 'https://www.fda.gov/food/environmental-contaminants-food/questions-and-answers-lead-glazed-traditional-pottery',
    accessed: ACCESSED,
    note: 'Basis for the safety note on traditional glazed clay pots (café de olla).',
  },
  {
    id: 'atlas-practice-consensus',
    title: 'Common café practice (rule of thumb) — drink sizes and ratios vary by café, region and era',
    note: 'Used for illustrative starting recipes. Not a standard: names like "macchiato" or "flat white" mean different drinks in different places.',
  },
];

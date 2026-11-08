# Content sources — Atlas layer (equipment, Drink Atlas, explore + culture tracks)

Owner: coffee-curriculum (atlas). Accessed / reviewed: **2026-11-07**. Source ids live in `src/content/sources.atlas.ts` (all prefixed `atlas-`).

**Review status:** written by an AI curriculum agent, cross-checked against the web sources below during a bounded (~20 min) research pass. **Not reviewed by a human coffee professional or historian.** Treat as a careful first draft.

## Principles applied

- Every recipe number is an **illustrative starting point** (stated in-text); drink names mean different things in different cafés and regions.
- No taste predictions: drinks carry a "character" tagline only; lessons repeatedly state that taste is the learner's own and that the app does not score taste.
- **Legends are labelled** (`myth` callouts / "story says" / "disputed") and dated facts with conflicting sources are given as ranges.
- Safety: concise warnings for steam, boiling water, pressurised moka pot / siphon, glass, grinder burrs, electricity, lead-glazed pottery, home roasting smoke. **No machine-specific maintenance procedures**: descaling, backflushing, gaskets, valves, disassembly → "follow your manufacturer's instructions" (`atlas-manufacturer-manuals`).
- No copied text or images. The SCA/WCR Flavor Wheel is CC BY-NC-ND and is **referenced by name only, not reproduced or translated**. All `illustration` keys are meant for original UI drawings.
- Completion of guided practice is always self-reported.

## Confidence by item

| Item | Main sources | Confidence | Flagged / uncertain |
|---|---|---|---|
| Equipment catalog (39 items) | atlas-manufacturer-manuals, practice consensus, atlas-moma-chemex, atlas-aeropress | rule-of-thumb (descriptions); dates verified | Moka/siphon safety kept generic; device specifics defer to manuals |
| Espresso, ristretto, lungo, americano, long black, affogato | atlas-sca-csp, atlas-wiki-espresso-machine, atlas-practice-consensus | rule-of-thumb | Americano "WWII GIs" origin = **story**; "espresso" etymology varies |
| Macchiato, cortado, cappuccino, flat white, latte, mocha, iced latte | atlas-practice-consensus, atlas-wiki-cappuccino, atlas-wiki-flat-white, atlas-nca-history | rule-of-thumb | Cappuccino: Capuchin/“Kapuziner” etymology widely accepted; Marco d’Aviano story = **folklore**. Flat white AU vs NZ origin = **disputed**. Mocha→chocolate link = **uncertain**. Milk 55–65 °C = rule of thumb |
| Cone pour-over, Chemex, Japanese iced pour-over | atlas-melitta (1908), atlas-hario-v60 (mid-2000s; 2004 vs 2005), atlas-moma-chemex (1941), atlas-sca-golden-cup | rule-of-thumb | V60 launch year given as "mid-2000s" |
| French press, AeroPress, siphon | atlas-aeropress (Adler, Nov 2005), practice consensus | rule-of-thumb | French press inventor/patent history **disputed** (stated as such); siphon "first half of 19th c. Europe" not checked against a primary source |
| Cold brew, Greek frappé | atlas-wiki-frappe, practice consensus | rule-of-thumb | Kyoto/"Dutch traders" link = **lacks evidence** (stated). Frappé 1957 Thessaloniki story: inventor name varies and earlier ads exist → stated as **popular story**. Cold-brew "few days in fridge" = food-safety rule of thumb |
| Moka pot | atlas-bialetti, atlas-manufacturer-manuals | rule-of-thumb | 1933 Alfonso Bialetti well attested; "laundry boiler inspiration" = **story**. Moka pressure "small fraction of ~9 bar" = rule of thumb |
| Turkish coffee | atlas-unesco-turkish (2013) | verified (culture) / rule-of-thumb (recipe) | Proverb "one cup, forty years" is a well-known Turkish saying (not from a fetched source) |
| Arabic coffee (gahwa) | atlas-unesco-arabic (2015; 2024 extension adding Jordan) | verified (etiquette) / rule-of-thumb (recipe) | Spice amounts illustrative; practices vary by country/family |
| Ethiopian jebena buna | atlas-barista-mag-jebena, atlas-nca-history | rule-of-thumb | Three rounds abol/tona/baraka (Amharic) confirmed by several secondary sources; **simplified home version explicitly "not the ceremony itself"**. No UNESCO claim made |
| Vietnamese phin / cà phê sữa đá | atlas-wiki-vietnam-coffee, atlas-ico | rule-of-thumb | **1857** introduction date and "fresh milk was scarce" explanation are widely repeated but **unverified** — stated as such in drink + lesson + quiz |
| Yuenyeung | atlas-hk-milk-tea | rule-of-thumb | HK milk-tea technique on HK ICH inventory **2017** (secondary confirmation); yuenyeung's inventor/origin **uncertain**; 7:3 ratio = "often described", varies |
| Café de olla | atlas-barista-mag-olla, atlas-fda-lead-pottery | rule-of-thumb | Mexican Revolution / soldadera origin = **legend** (stated). Lead-glaze safety note grounded in FDA guidance |
| Café cubano | atlas-practice-consensus | rule-of-thumb | No dated history claimed |
| exp-sensory-basics | atlas-sca-flavor-wheel, atlas-sca-csp | rule-of-thumb | Flavour-wheel graphic not reproduced (licence) |
| exp-dialing-in | atlas-sca-csp, practice consensus, manuals | rule-of-thumb | Sour/fast→finer, bitter/slow→coarser framed as rules of thumb, never guarantees |
| exp-origin-processing | atlas-nca-lifecycle, atlas-wcr-varieties, atlas-ico, atlas-yunnan-case | rule-of-thumb | Processing→flavour stated as **tendencies**; "robusta usually more caffeine" = widely accepted; Yunnan introduction dates **1892–1904** (range given) |
| exp-roast-levels | atlas-nca-lifecycle, atlas-sca-csp, practice consensus | rule-of-thumb | Caffeine "differs little by roast per gram" = commonly accepted; freezing advice framed as "some people…" |
| exp-water | atlas-sca-water, atlas-sca-golden-cup, atlas-batali-2020, manuals | rule-of-thumb | SCA water targets (TDS ~150 mg/L, 75–250) cross-checked via secondary summaries — original handbook not retrieved. "Coffee ≈98% water" = rule of thumb. Batali 2020 limits (87–93 °C, drip only) stated |
| exp-cleaning-care | atlas-manufacturer-manuals, atlas-sca-csp | rule-of-thumb | Only generic, safe daily steps; all periodic maintenance deferred to manuals; "some makers advise against vinegar" stated generally (no brand) |
| cul-origins-legends | atlas-nca-history, atlas-wiki-history, atlas-yunnan-case | verified (with flags) | Kaldi = **legend** (first written 1671, Nairon); papal "baptism" = **anecdote**; Palheta bouquet = **legend-like**; de Clieu "1720s" (sources say 1720 or 1723). Colonial/enslaved labour context included |
| cul-coffeehouses | atlas-wiki-coffeehouse, atlas-nca-history, atlas-japan-kissaten, atlas-hk-milk-tea | verified (with flags) | Istanbul c.1555 (Peçevi); Oxford **1650/1651**; London 1652; Vienna Kolschitzky = **legend** vs Diodato 1685; Procope **1686/1689**; Tokyo Kahiichakan 1888. Ray Oldenburg "third place" from general knowledge (not fetched) |
| cul-espresso-bar | atlas-wiki-espresso-machine, atlas-bialetti, atlas-wiki-cappuccino | verified (with ranges) | Bezzera patent 1901 vs 1902 → "early 1900s"; Gaggia lever 1938 vs 1947/48 → "late 1930s–1940s"; "standing is cheaper than sitting" = common Italian practice (rule of thumb) |
| cul-world-traditions | atlas-unesco-turkish, atlas-unesco-arabic, atlas-barista-mag-jebena, atlas-wiki-vietnam-coffee, atlas-hk-milk-tea, atlas-barista-mag-olla, atlas-fda-lead-pottery | verified (with flags) | Swedish fika from general knowledge (not fetched) |
| cul-waves-specialty | atlas-wiki-third-wave, atlas-sca-csp, atlas-ico, atlas-wcr-varieties | rule-of-thumb | Rothgeb article year 2002 vs 2003 → "early 2000s"; "80+ points = specialty" stated as *traditional* with note that SCA is developing broader assessment; farmer-price and climate statements kept general (no statistics) |

## Known gaps / next content work

- Human expert review (barista trainer + historian) of all `verified` culture claims and of regional recipes, ideally by people from those traditions.
- Primary-source checks: SCA Water Quality Handbook, Peçevi chronicle dating, Bezzera/Gaggia patents, HK ICH office inventory wording.
- Not yet covered: egg coffee (Hanoi), Irish/alcoholic coffees (deliberately skipped), Korean/Chinese café culture depth, decaf processing, home roasting (deliberately excluded for safety scope), latte art technique.

## Culture Explorer — map places + timeline (`src/content/culture-map.ts`)

Added 2026-11-08 (research accessed 2026-11-07/08). 34 places (origin 3, coffeehouse 8, drink-culture 12, producer 11) and 37 timeline events (3 `legend`, 14 `disputed`). Tests: `src/content/culture-map.test.ts`.

- **Coordinates** are approximate pins for a representative city/region (e.g. "Brazil" pinned in south Minas Gerais). Producer/origin pins all lie within ±30° latitude.
- **Legends** (`kind: 'legend'`, yearLabel starts "Legend"/"传说"): Kaldi goats (set c. 9th c., first written 1671), Baba Budan's seven seeds (17th c.), Kolschitzky's Vienna café (1683). Legend-like details inside history events are flagged in text (Palheta bouquet, de Clieu water ration, moka "laundry boiler", café de olla Revolution story).
- **Disputed** (range in yearLabel): Istanbul 1554/55, Venice 1640s–1683, Oxford 1650/51, Procope 1686/1689, Martinique 1720/1723, Saint-Domingue share (~half to 60%), Vietnam 1857 (unverified), Yunnan 1892–1904, instant coffee "first" (Kato 1901 / Washington c.1910 / earlier claims), Gaggia late 1930s–40s, frappé 1957, flat white 1980s AU vs NZ, third-wave article 2002/03.
- **Colonial & enslaved labour** stated briefly and factually: Java (Dutch plantations, later forced cultivation), Martinique/Caribbean, Saint-Domingue (enslaved labour; 1791 revolution → Haiti), Brazil (enslaved labour until abolition 1888).
- **New sources:** atlas-wiki-instant-coffee, atlas-unesco-colombia (2011), atlas-wiki-saint-domingue, atlas-wiki-brazil-coffee, atlas-wiki-vietnam-production, atlas-wiki-kenya-coffee (Bura 1893), atlas-wiki-wbc (2000, Robert Thoresen), atlas-history-starbucks (30 Mar 1971).
- **`atlas-general-reference` (not fetched — lower confidence, needs verification):** Caffè Florian 1720; Swedish fika and Nordic per-capita consumption; post-war Italian/Greek migration shaping Melbourne cafés; Cuban colada/espumita customs; Central American coffee becoming a major 19th-century export; Brazilian cafezinho; Harar "natural" coffees; Java forced-cultivation (19th c. Cultivation System) mentioned without a date; Kaffa↔"coffee" etymology described only as disputed.
- Ethiopia "one of Africa's largest producers" and Vietnam "second-largest producer" kept general (no statistics quoted).

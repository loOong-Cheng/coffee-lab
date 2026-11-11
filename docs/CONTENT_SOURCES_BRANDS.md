# Content sources — Coffee brands (`src/content/brands.ts`)

Owner: coffee-curriculum. Written and checked **2026-11-11** (`asOf: 2026` on every brand). Source ids live in `src/content/sources.brands.ts` (all prefixed `brand-`); some brands also cite shared `atlas-` ids from `src/content/sources.atlas.ts`.

**Review status:** written by an AI curriculum agent during a bounded, budgeted research pass (about 17 web searches). Founding years, countries and signature claims for Chinese, Japanese and newer brands were cross-checked in web search results. Long-established facts about large Western brands come from general knowledge with a Wikipedia pointer that was **not fetched** (sources carrying the `NOT_FETCHED` note); those brands are marked `rule-of-thumb`. **Not reviewed by a human coffee professional.**

## Principles applied

- **Identification only:** names are used only to identify brands; no logos, brand art or images. `BRAND_DISCLAIMER` (zh + en) says there is no affiliation or endorsement and that facts change.
- **No rankings, ad language, store counts, market share or sales figures.** Search results contained such numbers (Cotti, Luckin, Saturnbird, Yongpu, Baratza deal value); they were deliberately left out. A test bans ranking words such as "best", "No. 1", 最佳 and 第一名.
- **No health claims.** The one product with alcohol (Luckin × Moutai latte) is described only as "contains a little liquor".
- **Claims stay claims:** company "firsts" are attributed ("the company calls it…", "per the company"); places where reports conflict are stated as conflicts (Cotti headquarters).
- **Volumes are approximate** ("about", "≈") and markets differ; decoders explain words, not exact recipes.
- **Learning hooks link to existing content:** every `relatedDrinkIds`, `relatedEquipmentIds` and `relatedLessonIds` value resolves (tested).
- **Safety:** equipment brands with heat, pressure, glass or blades carry a concise optional `safetyNote`. All machine care and repair goes to "the manual / a qualified technician", and the notes contain no repair steps.

## Schema note (additive)

`Brand` adds one optional field beyond the brief: `safetyNote?: LocalizedText`. It is used by 10 equipment brands. The UI may ignore it, but it should show the note wherever an equipment brand's card is shown.

## Confidence by brand

`verified` = core dated facts cross-checked in at least one reasonable source during this pass. `rule-of-thumb` = widely known facts from general knowledge, pointer not fetched, or a mainly secondary source.

| Brand (id) | Kind | Main sources | Confidence | Flagged / uncertain |
|---|---|---|---|---|
| Starbucks (`starbucks`) | cafe-chain | atlas-history-starbucks, brand-verify-starbucks-sizes, brand-starbucks-menu | verified | Short 8 oz and iced Venti 24 oz come from secondary guides; ml values are rounded; the Caramel Macchiato description is from the official menu (not fetched) |
| Costa Coffee (`costa`) | cafe-chain | brand-wiki-costa | rule-of-thumb | Primo/Medio/Massimo given only as small/medium/large, with no volumes; "Mocha Italia" blend name not fetched |
| Tim Hortons (`tim-hortons`) | cafe-chain | brand-wiki-tim-hortons | rule-of-thumb | Not fetched; the facts are well known |
| Dunkin' (`dunkin`) | cafe-chain | brand-wiki-dunkin, brand-general-reference | rule-of-thumb | "Regular = cream and sugar" is a **regional habit** and is stated as such |
| Luckin Coffee (`luckin`) | cafe-chain | brand-wiki-luckin, brand-wcp-luckin-moutai, brand-xinhua-novel-coffee | rule-of-thumb | Moutai latte (Sep 2023) verified; founding 2017 and Xiamen headquarters not fetched; coconut latte launch date unknown, so none is given |
| Cotti Coffee (`cotti`) | cafe-chain | brand-wiki-cotti, brand-equalocean-cotti | verified | **Headquarters disputed** (Suzhou vs Tianjin), stated as "reports differ"; first store "reportedly" Fuzhou, Oct 2022 |
| Manner Coffee (`manner`) | cafe-chain | brand-chinadaily-manner, brand-chinaproject-manner | verified | Discount amount deliberately not stated (changes) |
| Seesaw Coffee (`seesaw`) | cafe-chain | brand-sca-china-market, brand-smartshanghai-seesaw, atlas-yunnan-case | verified | Founder names vary between sources and are not used; recent business difficulties are not mentioned |
| Pacific Coffee (`pacific-coffee`) | cafe-chain | brand-wiki-pacific-coffee, atlas-hk-milk-tea | verified | Ownership history is simplified to "China Resources a major shareholder since 2010" |
| Doutor Coffee (`doutor`) | cafe-chain | brand-wiki-doutor | verified | 1962 (founder's company) vs 1976 (infobox entity), so 1962 is used; "Milano sandwich" signature from general knowledge |
| Komeda's Coffee (`komeda`) | cafe-chain | brand-wiki-komeda, atlas-japan-kissaten | verified | **Morning-service details** (free toast) from general knowledge, stated as "usually… varies by store" |
| Segafredo Zanetti (`segafredo`) | cafe-chain | brand-wiki-mzb, atlas-wiki-espresso-machine | rule-of-thumb | 1973 = the group's own start date (when Zanetti bought the roastery); "first café Paris 1988" is the company's statement |
| illy (`illy`) | roaster | brand-wiki-illy | rule-of-thumb | Not fetched; "single blend" softened to "long known for", noting that it later added other roasts and single origins |
| Lavazza (`lavazza`) | roaster | brand-wiki-lavazza, atlas-wcr-varieties | rule-of-thumb | "Blending heritage" is presented as the company's own view; robusta "more caffeine, heavier" is a tendency |
| Nespresso (`nespresso`) | roaster | brand-wiki-nespresso | rule-of-thumb | 1986 launch and Vertuo spinning not fetched (well known) |
| Nescafé (`nescafe`) | roaster | brand-wiki-nescafe, atlas-wiki-instant-coffee, atlas-wiki-frappe | rule-of-thumb | Brazilian-surplus origin given as "the usual account" |
| UCC (`ucc`) | roaster | brand-wiki-ucc, brand-ucc-story | verified | **"World's first canned coffee" is the company's claim**; the text says that other earlier claims exist |
| Saturnbird 三顿半 (`saturnbird`) | roaster | brand-foodnavigator-saturnbird, brand-donews-saturnbird | verified | One database lists 2008 as an outlier, so 2015 is used; "dissolves in cold liquid" is the product's widely reported feature |
| Yongpu 永璞 (`yongpu`) | roaster | brand-thepaper-yongpu | verified | Sales rankings not used |
| Peet's Coffee (`peets`) | roaster | brand-wiki-peets | rule-of-thumb | Not fetched (well documented) |
| Blue Bottle Coffee (`blue-bottle`) | roaster | brand-wiki-blue-bottle | rule-of-thumb | Not fetched; years of the Japan and China openings are not stated |
| Tim Wendelboe (`tim-wendelboe`) | roaster | brand-wiki-tim-wendelboe, atlas-wiki-wbc | rule-of-thumb | 2004 WBC title and 2007 opening not fetched; "Nordic light roast" is a common label, not a formal category |
| La Marzocco (`la-marzocco`) | equipment | brand-wiki-la-marzocco, atlas-manufacturer-manuals | rule-of-thumb | The GS (1970) being an early dual boiler is attributed to the company |
| Breville / Sage (`breville`) | equipment | brand-wiki-breville, brand-dcn-baratza, atlas-manufacturer-manuals, atlas-practice-consensus | rule-of-thumb | Pressurised vs single-wall basket point is a rule of thumb with "check your manual" |
| De'Longhi (`delonghi`) | equipment | brand-wiki-delonghi, atlas-manufacturer-manuals | rule-of-thumb | Not fetched |
| Bialetti (`bialetti`) | equipment | atlas-bialetti, atlas-manufacturer-manuals | verified | 1919 workshop year from general knowledge (Moka Express 1933 verified in the atlas pass) |
| HARIO (`hario`) | equipment | atlas-hario-v60, brand-general-reference | verified | V60 launch kept as "mid-2000s" (2004 vs 2005); founding year 1921 not fetched |
| Kalita (`kalita`) | equipment | brand-homebarista-pourover, atlas-practice-consensus | verified | Wave launch year **unknown**, so none is given; "more forgiving" is stated as a rule of thumb |
| Melitta (`melitta`) | equipment | atlas-melitta | verified | — |
| Chemex (`chemex`) | equipment | atlas-moma-chemex | verified | "Especially clean cup" is stated as a common description |
| AeroPress (`aeropress`) | equipment | atlas-aeropress | verified | Recipe contests mentioned in general terms only (no event names or years) |
| Comandante (`comandante`) | equipment | brand-comandante-about, brand-ambiente-comandante | verified | 2012 = company founding (the Braune family roastery dates from 2005) |
| Baratza (`baratza`) | equipment | brand-dcn-baratza, atlas-practice-consensus | verified | Co-founder surname is **Kennedy** (some recollections say otherwise) |
| Fellow (`fellow`) | equipment | brand-builtin-fellow | verified | Stagg launch year varies (2014–2016), so it is not stated; Ode 2019 |
| Timemore 泰摩 (`timemore`) | equipment | brand-timemore-faq, brand-coffeegeek-timemore | verified | HQ "most sources place it in Shanghai" (outliers say Shenzhen or Singapore) |

**Counts:** 35 brands, made up of 12 café chains, 10 roasters/capsule/instant brands and 13 equipment makers. 8 brands are from China, including Hong Kong (Luckin, Cotti, Manner, Seesaw, Pacific Coffee, Saturnbird, Yongpu, Timemore). There are 5 Japanese and 6 Italian brands. Confidence: 20 `verified`, 15 `rule-of-thumb`.

## Known gaps / next content work

- Fetch the `NOT_FETCHED` Wikipedia and official history pages (Costa, Tim Hortons, Dunkin', Luckin, illy, Lavazza, Nespresso, Nescafé, Peet's, Blue Bottle, Tim Wendelboe, La Marzocco, Breville, De'Longhi) and upgrade their confidence where they confirm the text.
- Chain menu decoders for Chinese chains (Luckin and Cotti cup sizes, sugar-level options) were skipped because no well-sourced official size table was found in this pass.
- Possible additions: Korean chains (e.g. coffee-mix culture), Gaggia (covered historically in the atlas), Jura and other bean-to-cup makers, and Chinese home espresso brands.
- A human reviewer from China and Japan should check the zh brand names (e.g. 罗多伦咖啡, 客美多咖啡, 铂富, 比乐蒂, 奈斯派索, 悠诗诗). **One language at a time** (user rule, 2026-11-11): `name.zh` is the established Chinese name only, or the official Latin name when there is none (e.g. Manner Coffee, HARIO, Comandante); `name.en` never contains CJK. Tested in `brands.test.ts`.

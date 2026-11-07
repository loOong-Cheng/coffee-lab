# Coffee content sources and provenance

Use these references to ground beginner lessons; do not copy proprietary graphics or lengthy text. Agents must add content-specific citations and record confidence in curriculum data.

- Specialty Coffee Association Coffee Skills Program — https://education.sca.coffee/coffee-skills-program — official category/foundation program coverage.
- SCA Coffee Skills Program Course Catalog — https://education.sca.coffee/s/SCA-CSP-Course-Catalog.pdf — topics: workflow, espresso routine, cleaning, safety, brewing, sensory.
- Specific equipment manufacturer manuals — needed if instructional content models a particular brand/model or mechanical service procedure.

Content caution: dose/yield/time and taste relationships are context-dependent. Values are *illustrative*, not universal. Simulated flavor models are not empirical predictions. Real-world tasks involve hot water, grinders, steam and electricity. Content must avoid overclaiming personal proficiency or credentials.

## Core-track source register (`src/content/sources.ts`, accessed 2026-11-07)

| Source id | Reference | How it is used | Review status |
|---|---|---|---|
| `sca-csp` | SCA Coffee Skills Program overview — https://education.sca.coffee/coffee-skills-program | Topic scope for literacy / barista / brewing beginner content | Listed in brief; automated fetch failed (TLS) — **scope only, no numbers taken** |
| `sca-csp-catalog` | SCA CSP Course Catalog (PDF) — https://education.sca.coffee/s/SCA-CSP-Course-Catalog.pdf | Scope: workflow, espresso routine, milk, cleaning, health & safety | Same as above |
| `sca-dialing-in` | SCA News, "Coffee Decoded: The Science of Dialing-In" — https://sca.coffee/sca-news/coffee-decoded-14-dialling-in | Dialing in = methodical adjustment of dose/grind/extraction; flavor depends on strength **and** extraction (Lockhart 1957 chart, UC Davis revision) | Fetched & paraphrased |
| `ucdavis-ccc-2023` | Guinard, Frost & Ristenpart (2023), J. Food Sci., new Coffee Brewing Control Chart | "No single ideal": consumer preference clusters; sensory attributes vary with TDS & PE | Cited via SCA article; paper not read directly |
| `sca-brew-temp` | SCA News, "How Hot is Hot Enough?" — https://sca.coffee/sca-news/25/issue-15/... | ~93 °C commonly favoured; 87–93 °C study: temperature alone changed flavor little when TDS/PE matched | Fetched & paraphrased |
| `sca-immersion-strength` | SCA News, immersion equilibrium model article | Ratio mainly moves strength; strength vs extraction are separate axes | Search-result summary only |
| `sca-water-handbook` | SCA Water Quality Handbook (store listing) | Only the general claim "use clean, good-tasting, often filtered water"; no numeric water targets taught | Not read in full |
| `nca-what-is-coffee` | National Coffee Association, "What is Coffee?" — https://www.aboutcoffee.org/origins/what-is-coffee/ | Bean = seed of coffee cherry; most cherries hold two seeds (~5% peaberry); arabica vs robusta growing conditions; robusta has more caffeine | Fetched & paraphrased |
| `breville-steam-milk` | Breville (manufacturer) "How to steam milk" — https://breville.com/us/en/blog/coffee-and-espresso/how-to-steam-milk.html | Purge → tip just below surface → stretch ~5–10 s → whirlpool → stop ~140–145 °F → wipe & purge; wand is hot | Fetched; one brand's guidance, user's manual governs |
| `manufacturer-manual` | The learner's own machine/grinder manual | All machine-specific operation, steam modes, cleaning/descaling; any fault → manufacturer | Deliberate deferral (no repair content anywhere) |
| `coffee-lab-editorial` | Coffee Lab curriculum rules of thumb | Illustrative starting recipes (18→36 g, 15→250 g, bloom 2–3× dose 30–45 s, 25–35 s shot window, 2:30–4:00 pour-over) | Community consensus; labeled illustrative in-app |

## Reviewed lessons (core tracks)

Author: coffee-curriculum (core) subagent, 2026-11-07. Status: **authored + automated integrity tests pass; not yet reviewed by a human coffee professional.** Confidence is the lesson-level value in data; individual numbers are marked illustrative in-app.

| Lesson id | Sources | Confidence | Flagged / uncertain claims |
|---|---|---|---|
| `lit-what-is-coffee` | nca-what-is-coffee, sca-csp, sca-csp-catalog, coffee-lab-editorial | rule-of-thumb | Freshness window "a few days to a few weeks after roast" (rule of thumb; varies by roast/storage). "Roast changes caffeine only slightly by weight" (secondary sources agree; studies differ in direction). Arabica/robusta flavor generalisations ("often"). |
| `lit-tools-safety` | sca-csp-catalog, sca-water-handbook, manufacturer-manual, coffee-lab-editorial | rule-of-thumb | Burr vs blade evenness (well established, not source-fetched). No repair steps — leak/damage → stop, unplug, manufacturer. |
| `lit-brewing-concepts` | sca-dialing-in, ucdavis-ccc-2023, sca-immersion-strength, coffee-lab-editorial | rule-of-thumb | "Grounds retain ~2× their weight in water" (rough rule of thumb). Sour ≈ under / bitter ≈ over-extraction framed as tendency; SCA-reported research shows sweetness/bitterness depend on both TDS and PE. Extraction explorer is an **illustrative model** (math in domain code). |
| `esp-meet-the-machine` | sca-csp, sca-csp-catalog, manufacturer-manual, coffee-lab-editorial | verified (part identification) | "~9 bar" labeled illustrative. Basket capacities single ~7–10 g / double ~14–20 g (rule of thumb; check basket). Pressurised-basket behaviour described generically. |
| `esp-workflow` | sca-csp-catalog, manufacturer-manual, coffee-lab-editorial | rule-of-thumb | "Start soon after locking in" (common practice, modest effect). Tamp force matters less than evenness once compressed (common practice). XR mission `esp-workflow-xr` states limits: no haptics/grip/heat/taste. |
| `esp-ratio-lab` | sca-dialing-in, ucdavis-ccc-2023, coffee-lab-editorial | rule-of-thumb | Ristretto ~1:1–1:1.5 / normale ~1:2 / lungo ~1:2.5–1:3+ — names & numbers vary by café/country. 25–35 s window is a rule of thumb, not a standard (no SCA espresso standard exists; SCA funds research toward one). |
| `esp-diagnosis` | sca-dialing-in, ucdavis-ccc-2023, coffee-lab-editorial | rule-of-thumb | 7 hypothetical scenarios, each with a caveat. Channeling identification by sight/taste flagged as unreliable ("maybe"). Choked-shot caveat routes persistent no-flow to manufacturer, not disassembly. |
| `esp-first-real-shot` | manufacturer-manual, sca-csp-catalog, coffee-lab-editorial | rule-of-thumb | Recipe 18→36 g, 25–35 s labeled illustrative; heat-up "about a minute to half an hour" depends on machine. Completion self-reported. |
| `esp-milk-basics` | breville-steam-milk, manufacturer-manual, sca-csp-catalog, coffee-lab-editorial | rule-of-thumb | Target ~55–65 °C; cooked taste ~70 °C+ (manufacturer + industry consensus, sources vary 60–70 °C). "Hand-on-pitcher" heat cue is rough. Drink definitions vary by café/country. Steam/burn warnings on lesson, cards, sequence and every relevant guide step. |
| `po-meet-the-gear` | sca-csp, sca-csp-catalog, coffee-lab-editorial | verified (gear identification) | Cone vs flat-bottom behaviour generalised ("usually"). Grind "like table salt/coarse sand" is a rough comparison. |
| `po-ratio-bloom` | sca-brew-temp, sca-dialing-in, ucdavis-ccc-2023, coffee-lab-editorial | rule-of-thumb | "Some brewing references sit near 1:18 (~55 g/L)" — SCA Golden Cup figure confirmed only via secondary sources, not an SCA page. 90–96 °C range; bloom 2–3× dose, 30–45 s; 2:30–4:00 total are rules of thumb. |
| `po-first-real-cup` | sca-brew-temp, manufacturer-manual, coffee-lab-editorial | rule-of-thumb | Recipe 15 g/250 g, bloom 40 g, 150 g by ~1:15, 250 g by ~2:00 — one illustrative pulse schedule among many valid ones. "~30 s after boiling ≈ 90–96 °C" is approximate (kettle/room dependent). |
| `po-taste-iterate` | sca-dialing-in, ucdavis-ccc-2023, sca-brew-temp, coffee-lab-editorial | rule-of-thumb | 5 hypothetical scenarios with caveats. Taste-vs-temperature perception claim is general sensory knowledge (not source-fetched). Preference framed as personal (supported by consumer-cluster research). |

**Not claimed anywhere in core content:** real taste prediction, certified proficiency, sensing of physical actions, machine disassembly or repair steps, a universally correct recipe.

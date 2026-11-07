/**
 * Source references for the CORE tracks (literacy, espresso, pour-over).
 * Atlas/culture sources live in ./sources.atlas.ts (another owner).
 *
 * Rules: cite, never copy. Short paraphrases only. Every lesson lists the ids it
 * relies on; `docs/CONTENT_SOURCES.md` records review status and flagged claims.
 */
import type { SourceRef } from '../domain/contracts';

const ACCESSED = '2026-11-07';

export const sources: SourceRef[] = [
  {
    id: 'sca-csp',
    title: 'Specialty Coffee Association — Coffee Skills Program (overview)',
    url: 'https://education.sca.coffee/coffee-skills-program',
    accessed: ACCESSED,
    note: 'Scope reference for beginner topics (Introduction to Coffee, Barista Skills, Brewing, Sensory). Listed in the canonical brief; automated fetch failed (TLS) at review time, so used for topic scope only, not for numbers.',
  },
  {
    id: 'sca-csp-catalog',
    title: 'SCA Coffee Skills Program — Course Catalog (PDF)',
    url: 'https://education.sca.coffee/s/SCA-CSP-Course-Catalog.pdf',
    accessed: ACCESSED,
    note: 'Topic coverage: workflow, espresso routine, milk, cleaning, health & safety, brewing, sensory. Scope reference only.',
  },
  {
    id: 'sca-dialing-in',
    title: 'SCA News — "Coffee Decoded: The Science of Dialing-In"',
    url: 'https://sca.coffee/sca-news/coffee-decoded-14-dialling-in',
    accessed: ACCESSED,
    note: 'Dialing in = methodically adjusting dose, grind and extraction; Lockhart 1957 brewing control chart (strength/TDS vs extraction); UC Davis work showing flavor shifts with both strength and extraction.',
  },
  {
    id: 'ucdavis-ccc-2023',
    title:
      'Guinard, Frost & Ristenpart (2023) — "A new Coffee Brewing Control Chart relating sensory properties and consumer liking to brew strength, extraction yield, and brew ratio", Journal of Food Science',
    accessed: ACCESSED,
    note: 'Cited via SCA "Coffee Decoded". Supports: flavor depends on strength AND extraction together; consumer preference splits (no single ideal).',
  },
  {
    id: 'sca-brew-temp',
    title: 'SCA News — "How Hot is Hot Enough? Brew Temperature, Sensory Profile, and Consumer Acceptance of Brewed Coffee"',
    url: 'https://sca.coffee/sca-news/25/issue-15/how-hot-is-hot-enough-brew-temperature-sensory-profile-and-consumer-acceptance-of-brewed-coffee-5dj5b',
    accessed: ACCESSED,
    note: 'About 93 °C is commonly favoured; in a UC Davis study (87–93 °C) temperature alone changed flavor little when strength and extraction were matched; no one-size-fits-all target.',
  },
  {
    id: 'sca-immersion-strength',
    title: 'SCA News — "How Strong is the Coffee You\'re Cupping? New Model Captures the Equilibrium Extraction Nature of Full Immersion Brewing"',
    url: 'https://sca.coffee/sca-news/25/issue-17/how-strong-is-the-coffee-youre-cupping-new-model-captures-the-equilibrium-extraction-nature-of-full-immersion-brewing-992ht',
    accessed: ACCESSED,
    note: 'Brew ratio mainly moves strength; strength and extraction are distinct axes.',
  },
  {
    id: 'sca-water-handbook',
    title: 'SCA — The Water Quality Handbook (store listing)',
    url: 'https://store.sca.coffee/products/the-water-quality-handbook-print-version',
    accessed: ACCESSED,
    note: 'Water composition affects taste and equipment scale. Used only for the general claim "use clean, good-tasting (often filtered) water"; no numeric targets taught in core lessons.',
  },
  {
    id: 'nca-what-is-coffee',
    title: 'National Coffee Association USA — "What is Coffee?" (aboutcoffee.org)',
    url: 'https://www.aboutcoffee.org/origins/what-is-coffee/',
    accessed: ACCESSED,
    note: 'Beans are seeds of the coffee cherry; most cherries hold two seeds (~5% peaberry); arabica vs robusta growing conditions; robusta has more caffeine (cited there as 50–60% more).',
  },
  {
    id: 'breville-steam-milk',
    title: 'Breville (manufacturer) — "How to steam milk: a step-by-step guide"',
    url: 'https://breville.com/us/en/blog/coffee-and-espresso/how-to-steam-milk.html',
    accessed: ACCESSED,
    note: 'Manufacturer guidance: purge before/after, tip just below surface, stretch ~5–10 s then whirlpool, stop around 140–145 °F (~60–63 °C), wipe and purge, wand is hot. One brand\'s guidance — your own manual governs.',
  },
  {
    id: 'manufacturer-manual',
    title: "Your own machine's and grinder's manufacturer manual",
    note: 'Authoritative for model-specific operation, heat-up, steam controls, cleaning cycles, descaling and safety. Coffee Lab deliberately defers all machine-specific and any servicing steps to it.',
  },
  {
    id: 'coffee-lab-editorial',
    title: 'Coffee Lab curriculum team — rules of thumb and illustrative starting recipes',
    accessed: ACCESSED,
    note: 'Widely used community starting points (e.g. espresso ~1:2 in ~25–35 s; pour-over ~1:15–1:17; bloom ~2–3× dose for ~30–45 s). Cross-checked for plausibility against the sources above; labeled illustrative / rule-of-thumb in the UI, never as universal ideals.',
  },
];

/**
 * Source references for the coffee-brands knowledge layer (src/content/brands.ts).
 * Owner: coffee-curriculum. All ids are prefixed `brand-` so they never collide
 * with core or atlas ids. Brands also cite a few shared `atlas-` sources
 * (Bialetti, HARIO V60, Melitta, MoMA Chemex, AeroPress, Starbucks 1971 …).
 *
 * `accessed` = date the claim was cross-checked in a web search this pass.
 * Entries without `accessed` were NOT fetched: they point to the reference we
 * relied on from general knowledge, and the brand is marked lower confidence
 * in docs/CONTENT_SOURCES_BRANDS.md. Nothing here is copied text.
 */
import type { SourceRef } from '../domain/contracts';

const CHECKED = '2026-11-11';
const NOT_FETCHED = 'Not fetched in the 2026-11-11 pass; general reference for long-established facts. Needs verification.';

export const sources: SourceRef[] = [
  // ── café chains ──
  {
    id: 'brand-verify-starbucks-sizes',
    title: 'VERIFY (10TV) fact-check — Starbucks hot cup sizes (Tall 12 oz, Grande 16 oz, Venti 20 oz) quoting a Starbucks spokesperson',
    url: 'https://www.10tv.com/article/news/verify/food-verify/starbucks-coffee-hot-cup-sizes-liquid-volume-amount-facebook-tiktok-claim-fact-check/536-0903b036-e0c9-4cca-b660-22db2b113a90',
    accessed: CHECKED,
    note: 'Short 8 oz and iced Venti 24 oz from several secondary guides; Starbucks’ own size page not retrieved. ml values are rounded conversions.',
  },
  {
    id: 'brand-starbucks-menu',
    title: 'Starbucks — official menu (Caramel Macchiato: steamed milk with vanilla syrup, marked with espresso, caramel drizzle)',
    url: 'https://www.starbucks.com/menu',
    note: NOT_FETCHED,
  },
  { id: 'brand-wiki-costa', title: 'Wikipedia — Costa Coffee (London 1971, Sergio & Bruno Costa; Coca-Cola 2019)', url: 'https://en.wikipedia.org/wiki/Costa_Coffee', note: NOT_FETCHED },
  { id: 'brand-wiki-tim-hortons', title: 'Wikipedia — Tim Hortons (Hamilton, Ontario, 1964; Double-Double; Timbits)', url: 'https://en.wikipedia.org/wiki/Tim_Hortons', note: NOT_FETCHED },
  { id: 'brand-wiki-dunkin', title: 'Wikipedia — Dunkin’ (Quincy, Massachusetts, 1950; renamed Dunkin’ 2019)', url: 'https://en.wikipedia.org/wiki/Dunkin%27', note: NOT_FETCHED },
  { id: 'brand-wiki-luckin', title: 'Wikipedia — Luckin Coffee (founded 2017, Xiamen; app-based ordering)', url: 'https://en.wikipedia.org/wiki/Luckin_Coffee', note: NOT_FETCHED },
  {
    id: 'brand-wcp-luckin-moutai',
    title: 'World Coffee Portal — Luckin Coffee’s Moutai alcohol-infused latte (launched 4 Sep 2023)',
    url: 'https://www.worldcoffeeportal.com/news/luckin-coffees-moutai-alcohol-infused-latte-delivers-13-7m-in-first-day-sales/',
    accessed: CHECKED,
    note: 'Sales figures deliberately not used in the app.',
  },
  {
    id: 'brand-xinhua-novel-coffee',
    title: 'Xinhua via China Daily (Sep 2023) — Novel twists on tea, coffee (Luckin coconut-milk latte with Coconut Palm Group)',
    url: 'https://govt.chinadaily.com.cn/s/202309/21/WS653265a0498ed2d7b7e9e08f/novel-twists-on-tea-coffee-spur-chinas-catering-consumption.html',
    accessed: CHECKED,
    note: 'Launch date of the coconut latte not established; none is stated in the app.',
  },
  {
    id: 'brand-wiki-cotti',
    title: 'Wikipedia — Cotti Coffee (founded 2022 by Lu Zhengyao and Qian Zhiya)',
    url: 'https://en.wikipedia.org/wiki/Cotti_Coffee',
    accessed: CHECKED,
    note: 'Headquarters conflict: Wikipedia says Suzhou; a 2022 brand manual (Equalocean) says Tianjin. The app states that reports differ.',
  },
  {
    id: 'brand-equalocean-cotti',
    title: 'EqualOcean (2022) — Luckin Coffee’s ex-chairman Lu Zhengyao returns (Cotti Coffee)',
    url: 'https://equalocean.com/news/2022090118839-luckin-coffees-ex-chairman-lu-zhengyao-returns',
    accessed: CHECKED,
  },
  {
    id: 'brand-chinadaily-manner',
    title: 'China Daily (30 Oct 2020) — Brewing sustainability (Manner Coffee and bring-your-own-cup)',
    url: 'https://www.chinadaily.com.cn/a/202010/30/WS5f9b5999a31024ad0ba82038.html',
    accessed: CHECKED,
    note: 'Discount amount intentionally not quoted in the app; it changes.',
  },
  {
    id: 'brand-chinaproject-manner',
    title: 'The China Project (Nov 2021) — The rise of Manner Coffee (2015, ~2 m² store on Nanyang Road)',
    url: 'https://thechinaproject.com/2021/11/05/the-rise-of-manner-coffee/',
    accessed: CHECKED,
  },
  {
    id: 'brand-sca-china-market',
    title: 'SCA News 25/13 — An emerging market: the rise of China’s coffee drinking culture (Seesaw and Yunnan)',
    url: 'https://sca.coffee/sca-news/25/issue-13/an-emerging-market-the-rise-of-chinas-coffee-drinking-culture',
    accessed: CHECKED,
  },
  {
    id: 'brand-smartshanghai-seesaw',
    title: 'SmartShanghai — Made in China: Seesaw Coffee’s Tom Zong (Shanghai, 2012; Yunnan project)',
    url: 'https://www.smartshanghai.com/articles/business/made-in-china-seesaw-coffees-tom-zong',
    accessed: CHECKED,
    note: 'Founder names and store counts vary between sources; not used in the app.',
  },
  {
    id: 'brand-wiki-pacific-coffee',
    title: 'Wikipedia — Pacific Coffee (Thomas Neir, 1992; first outlet Central, 1993; China Resources 2010)',
    url: 'https://en.wikipedia.org/wiki/Pacific_Coffee',
    accessed: CHECKED,
  },
  {
    id: 'brand-wiki-doutor',
    title: 'Wikipedia — Doutor Coffee (Hiromichi Toriba, 1962; first shop Harajuku, 18 Apr 1980)',
    url: 'https://en.wikipedia.org/wiki/Doutor_Coffee',
    accessed: CHECKED,
    note: 'Infobox shows 1976 (a later corporate entity); 1962 per founder biographies.',
  },
  {
    id: 'brand-wiki-komeda',
    title: 'Wikipedia — Komeda Coffee (Taro Kato, Nagoya, January 1968)',
    url: 'https://en.wikipedia.org/wiki/Komeda_Coffee',
    accessed: CHECKED,
    note: 'Morning-service details (free toast) from general knowledge of Nagoya café culture; varies by store.',
  },
  {
    id: 'brand-wiki-mzb',
    title: 'Wikipedia — Massimo Zanetti Beverage Group (Segafredo Zanetti; Bologna roastery bought 1973)',
    url: 'https://en.wikipedia.org/wiki/Massimo_Zanetti_Beverage_Group',
    accessed: CHECKED,
    note: '“First café in Paris, 1988” is from a Segafredo regional brand site (company statement).',
  },

  // ── roasters / capsules / instant ──
  { id: 'brand-wiki-illy', title: 'Wikipedia — illycaffè (Trieste, 1933, Francesco Illy; pressurised packaging)', url: 'https://en.wikipedia.org/wiki/Illy', note: NOT_FETCHED },
  { id: 'brand-wiki-lavazza', title: 'Wikipedia — Lavazza (Turin, 1895, Luigi Lavazza)', url: 'https://en.wikipedia.org/wiki/Lavazza', note: NOT_FETCHED },
  { id: 'brand-wiki-nespresso', title: 'Wikipedia — Nespresso (Nestlé; capsule system 1986; Vertuo 2014)', url: 'https://en.wikipedia.org/wiki/Nespresso', note: NOT_FETCHED },
  { id: 'brand-wiki-nescafe', title: 'Wikipedia — Nescafé (launched 1938; Brazilian surplus origin story)', url: 'https://en.wikipedia.org/wiki/Nescaf%C3%A9', note: NOT_FETCHED },
  {
    id: 'brand-wiki-ucc',
    title: 'Wikipedia — UCC Ueshima Coffee Co. (Kobe, 1933; UCC Coffee with Milk can, April 1969)',
    url: 'https://en.wikipedia.org/wiki/UCC_Ueshima_Coffee_Co.',
    accessed: CHECKED,
    note: '“World’s first canned coffee” is the company’s claim; treated as such.',
  },
  { id: 'brand-ucc-story', title: 'UCC America — Our story (Kobe, 1933)', url: 'https://www.ucc-america.com/our-story', accessed: CHECKED },
  {
    id: 'brand-foodnavigator-saturnbird',
    title: 'FoodNavigator-Asia (Aug 2024) — Redefining instant coffee: Saturnbird (Changsha, 2015; freeze-dried mini cups 2018)',
    url: 'https://www.foodnavigator.com/Article/2024/08/01/china-s-saturnbird-aims-to-pull-young-consumers-with-convenient-price-friendly-coffee/',
    accessed: CHECKED,
  },
  {
    id: 'brand-donews-saturnbird',
    title: 'DoNews — 三顿半“返航计划”空罐回收（2019 年推出）',
    url: 'https://www.donews.com/news/detail/1/6261260.html',
    accessed: CHECKED,
    note: 'Collection totals not used in the app.',
  },
  {
    id: 'brand-thepaper-yongpu',
    title: '澎湃新闻 — 永璞咖啡品牌报道（2014 年上海成立；2018 年推出冷萃咖啡液）',
    url: 'https://m.thepaper.cn/baijiahao_16592013',
    accessed: CHECKED,
    note: 'Cross-checked with other Chinese business press in the same search; sales rankings not used.',
  },
  { id: 'brand-wiki-peets', title: 'Wikipedia — Peet’s Coffee (Berkeley, 1966, Alfred Peet; Starbucks founders’ early supplier)', url: 'https://en.wikipedia.org/wiki/Peet%27s_Coffee', note: NOT_FETCHED },
  { id: 'brand-wiki-blue-bottle', title: 'Wikipedia — Blue Bottle Coffee (Oakland, 2002, James Freeman; Nestlé majority 2017)', url: 'https://en.wikipedia.org/wiki/Blue_Bottle_Coffee', note: NOT_FETCHED },
  { id: 'brand-wiki-tim-wendelboe', title: 'Wikipedia — Tim Wendelboe (2004 World Barista Champion; Oslo roastery 2007)', url: 'https://en.wikipedia.org/wiki/Tim_Wendelboe', note: NOT_FETCHED },

  // ── equipment ──
  { id: 'brand-wiki-la-marzocco', title: 'Wikipedia — La Marzocco (Florence, 1927, Bambi brothers; GS 1970)', url: 'https://en.wikipedia.org/wiki/La_Marzocco', note: NOT_FETCHED },
  { id: 'brand-wiki-breville', title: 'Wikipedia — Breville (Sydney, 1932; Sage brand in UK/Europe)', url: 'https://en.wikipedia.org/wiki/Breville', note: NOT_FETCHED },
  { id: 'brand-wiki-delonghi', title: 'Wikipedia — De’Longhi (Treviso, 1902)', url: 'https://en.wikipedia.org/wiki/De%27Longhi', note: NOT_FETCHED },
  {
    id: 'brand-homebarista-pourover',
    title: 'Home-Barista forum — History of pour over (Kalita founded 1958; Wave release date unknown)',
    url: 'https://www.home-barista.com/brewing/history-pour-over-t70870.html',
    accessed: CHECKED,
    note: 'Community source; Nihonbashi 1958 also from brand-profile pages in the same search. Wave launch year deliberately not stated.',
  },
  {
    id: 'brand-comandante-about',
    title: 'Comandante — About (Braune family; Supremo roastery 2005)',
    url: 'https://comandantegrinder.com/pages/about',
    accessed: CHECKED,
  },
  {
    id: 'brand-ambiente-comandante',
    title: 'Messe Frankfurt Ambiente — Bestbrew GmbH (Comandante), Unterhaching near Munich, founded 2012',
    url: 'https://ambiente.messefrankfurt.com/frankfurt/en/exhibitor-search.detail.html/bestbrew-gmbh/mf_1_0015021669_4081445_10000001202501.html',
    accessed: CHECKED,
  },
  {
    id: 'brand-dcn-baratza',
    title: 'Daily Coffee News (2 Oct 2020) — Breville acquires US grinder maker Baratza',
    url: 'https://dailycoffeenews.com/2020/10/02/breville-acquires-us-grinder-maker-baratza-for-60-million',
    accessed: CHECKED,
    note: 'Founders Kyle Anderson and Kyra Kennedy, 1999. Deal value not used in the app.',
  },
  {
    id: 'brand-builtin-fellow',
    title: 'Built In SF — Fellow company profile (San Francisco, 2013, Jake Miller)',
    url: 'https://www.builtinsf.com/company/fellow-fellowproductscom',
    accessed: CHECKED,
    note: 'Product timeline (Duo → Stagg → Ode 2019) from several profiles; Stagg launch year varies (2014–2016) and is not stated.',
  },
  {
    id: 'brand-timemore-faq',
    title: 'TIMEMORE — FAQ / 12th-anniversary timeline (officially founded July 2012)',
    url: 'https://timemore.com/pages/faq',
    accessed: CHECKED,
  },
  {
    id: 'brand-coffeegeek-timemore',
    title: 'CoffeeGeek (2023) — Timemore grinders on the move (Chestnut G1 2017; C2 from 2018)',
    url: 'https://coffeegeek.com/blog/new-products/timemore-grinders-on-the-move-in-2023/',
    accessed: CHECKED,
  },
  {
    id: 'brand-general-reference',
    title: 'General reference knowledge — NOT fetched (flagged in docs/CONTENT_SOURCES_BRANDS.md)',
    note: 'Used only for low-risk context: HARIO founded 1921 in Tokyo; regional “regular coffee” usage in the US Northeast.',
  },
];

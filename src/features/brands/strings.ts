/** Colocated bilingual UI strings for the Coffee Brands pages (CONTRACTS.md §4). */
import type { BrandKind } from '../../content';
import type { LocalizedText } from '../../domain/contracts';
import type { IconName } from '../../ui';

export const KIND_TEXT: Record<BrandKind, { group: LocalizedText; one: LocalizedText; icon: IconName }> = {
  'cafe-chain': { group: { zh: '连锁咖啡店', en: 'Café chains' }, one: { zh: '连锁咖啡店', en: 'Café chain' }, icon: 'cup' },
  roaster: { group: { zh: '烘焙商', en: 'Roasters' }, one: { zh: '烘焙商', en: 'Roaster' }, icon: 'bean' },
  equipment: { group: { zh: '器具品牌', en: 'Equipment makers' }, one: { zh: '器具品牌', en: 'Equipment maker' }, icon: 'dripper' },
};

export const S = {
  title: { zh: '咖啡品牌', en: 'Coffee Brands' },
  entry: { zh: '咖啡品牌', en: 'Coffee brands' },
  lead: (n: number) => ({
    zh: `${n} 个你可能会遇到的咖啡品牌。把每个品牌当作入口，学一点真正的咖啡知识。`,
    en: `${n} coffee brands you are likely to meet. Use each one as a way in to learn something real about coffee.`,
  }),
  filters: { zh: '筛选品牌', en: 'Filter brands' },
  searchLabel: { zh: '按名称搜索品牌', en: 'Search brands by name' },
  search: { zh: '搜索中文或英文名称……', en: 'Search Chinese or English name…' },
  kind: { zh: '类型', en: 'Kind' },
  all: { zh: '全部', en: 'All' },
  reset: { zh: '清除筛选', en: 'Clear filters' },
  showing: (n: number, m: number) => ({ zh: `显示 ${n} / ${m} 个品牌`, en: `Showing ${n} of ${m} brands` }),
  none: { zh: '没有符合条件的品牌', en: 'No brands match' },
  noneBody: { zh: '换个关键词，或者清除筛选。', en: 'Try another name or clear the filters.' },
  founded: (y: number) => ({ zh: `创立于 ${y} 年`, en: `Founded ${y}` }),
  // detail
  back: { zh: '← 全部品牌', en: '← All brands' },
  notFound: { zh: '没有找到这个品牌', en: 'That brand isn’t here' },
  notFoundBody: { zh: '链接可能有误。看看完整的品牌列表吧。', en: 'The link may be wrong. Have a look at the full list.' },
  knownForH: { zh: '以什么出名', en: 'Known for' },
  signatureH: { zh: '代表产品', en: 'Signature items' },
  learnH: { zh: '新手能从中学到什么', en: 'What a beginner can learn' },
  menuH: { zh: '菜单解读', en: 'Menu decoder' },
  menuNote: { zh: '容量均为大约值，不同国家和门店可能不同。', en: 'Volumes are approximate and differ between countries and shops.' },
  safetyH: { zh: '安全提示', en: 'Safety' },
  drinksH: { zh: '相关饮品', en: 'Related drinks' },
  lessonsH: { zh: '相关课程', en: 'Related lessons' },
  gearH: { zh: '相关器具', en: 'Related equipment' },
  sourcesH: { zh: '资料来源', en: 'Sources' },
  checked: (y: number) => ({ zh: `信息核对于 ${y} 年`, en: `Checked in ${y}` }),
  aboutH: { zh: '关于品牌信息', en: 'About brand information' },
  // atlas section
  drinkBrandsH: { zh: '以这款饮品出名的品牌', en: 'Brands known for this' },
};

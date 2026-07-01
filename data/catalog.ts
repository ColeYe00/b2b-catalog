import type { CatalogCategory, CatalogProduct } from '~/types/catalog'

export const catalogCategories: CatalogCategory[] = [
  { slug: 'lv-women-bags', nameEn: 'Louis Vuitton', nameCn: '路易威登', count: 1177 },
  { slug: 'chanel-women-bags', nameEn: 'Chanel', nameCn: '香奈儿', count: 902 },
  { slug: 'dior-women-bags', nameEn: 'Dior', nameCn: '迪奥', count: 822 },
  { slug: 'hermes-women-bags', nameEn: 'Hermès', nameCn: '爱马仕', count: 368 },
  { slug: 'gucci-women-bags', nameEn: 'Gucci', nameCn: '古驰', count: 678 },
  { slug: 'balenciaga-women-bags', nameEn: 'Balenciaga', nameCn: '巴黎世家', count: 119 },
]

const images = [
  [
    'https://xcimg.szwego.com/img/8838bae5/20250302/i1740886643_9027_0.jpg',
    'https://xcimg.szwego.com/img/8838bae5/20250302/i1740886643_3262_4.jpg',
    'https://xcimg.szwego.com/img/8838bae5/20250302/i1740886643_1285_3.jpg',
    'https://xcimg.szwego.com/img/8838bae5/20250302/i1740886643_2691_6.jpg',
  ],
  ['https://xcimg.szwego.com/img/0ab6c1f9/20250413/i1744523187278_1673_0_0.jpg'],
  ['https://xcimg.szwego.com/20220929/i1664438617_5922_0.jpg'],
  ['https://xcimg.szwego.com/20220711/i1657553752_9054_0.jpg'],
  ['https://xcimg.szwego.com/20220929/i1664438500_5088_0.jpg'],
  ['https://xcimg.szwego.com/20220929/i1664438428_7063_0.jpg'],
  ['https://xcimg.szwego.com/20220929/i1664438236_9825_0.jpg'],
  ['https://xcimg.szwego.com/20220805/i1659684791_8654_0.jpg'],
]

const productSeeds = [
  ['Balenciaga Rodeo Nano Chain Bag', '巴黎世家 Rodeo Nano 链条包', 'balenciaga-women-bags', '819429黑金'],
  ['Balenciaga Le City Bag', '巴黎世家 Le City 手提包', 'balenciaga-women-bags', 'LE-CITY-25'],
  ['Chanel Classic Large Flap Bag', '香奈儿经典大号翻盖包', 'chanel-women-bags', 'CF-LARGE'],
  ['Dior Lambskin Top Handle Bag', '迪奥进口羊皮手提包', 'dior-women-bags', 'D-LAMB-26'],
  ['Louis Vuitton Structured Tote', '路易威登白色手提托特包', 'lv-women-bags', 'LV-TOTE-W'],
  ['Hermès Large Shoulder Bag', '爱马仕深灰色大号肩背包', 'hermes-women-bags', 'HM-GRAY-L'],
  ['Gucci Signature Top Handle', '古驰经典手提包', 'gucci-women-bags', 'GC-TOP-01'],
  ['Bottega Veneta Bucket Bag', '宝缇嘉复古银水桶包', 'bv-women-bags', 'BV-302317'],
] as const

export const demoProducts: CatalogProduct[] = productSeeds.map(
  ([nameEn, nameCn, category, modelNumber], index) => ({
    id: `demo-${index + 1}`,
    sku: index === 0
      ? '_diYvLgPP5gZbry3LHE-kZ_0CtXFtTkUE82NfNpg'
      : `DEMO-${String(index + 1).padStart(3, '0')}`,
    name_en: nameEn,
    name_cn: nameCn,
    specs: {
      source: 'wsxcme',
      modelNumber,
      ...(index === 0
        ? { dimensions: { lengthCm: 16, heightCm: 9.9, widthCm: 4.5 } }
        : {}),
      rawTitle: nameCn,
    },
    price: null,
    currency: 'CNY',
    moq: 1,
    category,
    status: 'active',
    alibaba_url: null,
    images: images[index] ?? [],
    created_at: new Date(2025, 3, 16 - index).toISOString(),
  }),
)

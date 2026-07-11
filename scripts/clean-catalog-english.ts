import { readFile, writeFile } from 'node:fs/promises'
import {
  LOCAL_CATEGORIES_FILE,
  LOCAL_PRODUCTS_FILE,
  type LocalCategoryRow,
  type LocalProductRow,
  categoriesWithProductCounts,
  hardDedupeProducts,
  writeStaticCatalog,
} from './static-catalog.ts'

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/[［\[]庆祝[］\]]/g, ''],
  [/巴黎世家/g, 'Balenciaga'],
  [/巴宝莉/g, 'Burberry'],
  [/香奈儿/g, 'Chanel'],
  [/赛琳/g, 'Celine'],
  [/葆蝶家/g, 'Bottega Veneta'],
  [/圣罗兰/g, 'Saint Laurent'],
  [/爱马仕/g, 'Hermes'],
  [/古驰/g, 'Gucci'],
  [/路易威登/g, 'Louis Vuitton'],
  [/普拉达/g, 'Prada'],
  [/迪奥/g, 'Dior'],
  [/尺寸/g, 'Size'],
  [/型号/g, 'Model'],
  [/款号/g, 'Style No.'],
  [/编号/g, 'Code'],
  [/颜色/g, 'Color'],
  [/宽/g, 'width'],
  [/高/g, 'height'],
  [/长/g, 'length'],
  [/深/g, 'depth'],
  [/厚/g, 'thickness'],
  [/重量/g, 'Weight'],
  [/厘米/g, 'cm'],
  [/千克/g, 'kg'],
  [/约/g, 'approx.'],
  [/小号/g, 'small'],
  [/中号/g, 'medium'],
  [/大号/g, 'large'],
  [/黑色/g, 'black'],
  [/棕色/g, 'brown'],
  [/白色/g, 'white'],
  [/女包/g, "women's bag"],
  [/手袋/g, 'handbag'],
  [/肩背/g, 'shoulder carry'],
  [/斜挎/g, 'crossbody'],
  [/手提/g, 'top handle'],
  [/牛皮/g, 'calfskin'],
  [/羊皮/g, 'lambskin'],
  [/小牛皮/g, 'calfskin'],
  [/帆布/g, 'canvas'],
  [/五金/g, 'hardware'],
  [/拉链/g, 'zipper'],
  [/新款/g, 'new style'],
  [/新品/g, 'new arrival'],
  [/全新/g, 'new'],
  [/包装/g, 'packaging'],
  [/现货/g, 'in stock'],
  [/系列/g, 'series'],
]

const CHINESE_PATTERN = /[\u3400-\u9fff]/
const CHINESE_RUN_PATTERN = /[\u3400-\u9fff]+/g

function cleanEnglish(value: string | null): string | null {
  if (value === null) {
    return null
  }

  let next = value

  for (const [pattern, replacement] of REPLACEMENTS) {
    next = next.replace(pattern, replacement)
  }

  return next
    .replace(CHINESE_RUN_PATTERN, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function cleanUnknown(value: unknown): unknown {
  if (typeof value === 'string') {
    return cleanEnglish(value)
  }

  if (Array.isArray(value)) {
    return value.map(cleanUnknown)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cleanUnknown(item)]),
    )
  }

  return value
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

async function main(): Promise<void> {
  const products = await readJson<LocalProductRow[]>(LOCAL_PRODUCTS_FILE)
  const categories = await readJson<LocalCategoryRow[]>(LOCAL_CATEGORIES_FILE)
  const cleaned = hardDedupeProducts(products.map(product => ({
    ...product,
    name_en: cleanEnglish(product.name_en) || cleanEnglish(product.name_cn) || 'Catalog item',
    name_cn: cleanEnglish(product.name_cn),
    specs: {
      ...cleanUnknown(product.specs) as Record<string, unknown>,
      rawTitle: cleanEnglish(String(product.specs.rawTitle ?? product.name_cn ?? product.name_en)),
    },
  })))
  const cleanCategories = categoriesWithProductCounts(categories.map(category => ({
    ...category,
    nameCn: category.nameEn,
  })), cleaned)
  const remaining = cleaned.filter(product => CHINESE_PATTERN.test([
    product.name_en,
    product.name_cn,
    product.specs.rawTitle,
  ].filter(Boolean).join('\n')))

  await writeJson(LOCAL_PRODUCTS_FILE, cleaned)
  await writeJson(LOCAL_CATEGORIES_FILE, cleanCategories)
  await writeStaticCatalog(cleaned, cleanCategories)

  console.log(`Cleaned ${cleaned.length} products; remaining Chinese rows: ${remaining.length}.`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

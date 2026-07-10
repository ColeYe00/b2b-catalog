import { mkdir, rm, writeFile } from 'node:fs/promises'

export interface LocalProductRow {
  id: string
  sku: string
  name_en: string
  name_cn: string | null
  specs: Record<string, unknown>
  price: number | null
  currency: string
  moq: number
  category: string
  status: string
  alibaba_url: string | null
  images: string[]
  created_at: string
}

export interface LocalCategoryRow {
  slug: string
  nameEn: string
  nameCn: string
  count: number
}

export const LOCAL_CATALOG_DIR = 'public/catalog'
export const LOCAL_PRODUCTS_FILE = `${LOCAL_CATALOG_DIR}/women-bags-products.json`
export const LOCAL_CATEGORIES_FILE = `${LOCAL_CATALOG_DIR}/women-bags-categories.json`

const STATIC_PAGE_SIZE = 24

function sortProducts(
  products: LocalProductRow[],
  sort: 'newest' | 'name',
): LocalProductRow[] {
  return [...products].sort((first, second) => {
    if (sort === 'name') {
      return first.name_en.localeCompare(second.name_en) || second.id.localeCompare(first.id)
    }

    return Date.parse(second.created_at) - Date.parse(first.created_at) || second.id.localeCompare(first.id)
  })
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value)}\n`, 'utf8')
}

async function writeProductPages(
  baseDir: string,
  products: LocalProductRow[],
  total: number,
): Promise<void> {
  for (const sort of ['newest', 'name'] as const) {
    const sorted = sortProducts(products, sort)
    const pageCount = Math.max(1, Math.ceil(sorted.length / STATIC_PAGE_SIZE))
    const sortDir = `${baseDir}/${sort}`

    await mkdir(sortDir, { recursive: true })

    for (let page = 1; page <= pageCount; page += 1) {
      await writeJson(`${sortDir}/page-${page}.json`, {
        items: sorted.slice((page - 1) * STATIC_PAGE_SIZE, page * STATIC_PAGE_SIZE),
        page,
        pageSize: STATIC_PAGE_SIZE,
        total,
        totalPages: pageCount,
      })
    }
  }
}

export async function writeStaticCatalog(
  products: LocalProductRow[],
  categories: LocalCategoryRow[],
): Promise<void> {
  await rm(`${LOCAL_CATALOG_DIR}/all`, { recursive: true, force: true, maxRetries: 3 })
  await rm(`${LOCAL_CATALOG_DIR}/by-category`, { recursive: true, force: true, maxRetries: 3 })
  await rm(`${LOCAL_CATALOG_DIR}/products`, { recursive: true, force: true, maxRetries: 3 })

  await mkdir(`${LOCAL_CATALOG_DIR}/products`, { recursive: true })
  await writeJson(`${LOCAL_CATALOG_DIR}/categories.json`, categories)
  await writeProductPages(`${LOCAL_CATALOG_DIR}/all`, products, products.length)

  for (const category of categories) {
    const categoryProducts = products.filter(product => product.category === category.slug)
    await writeProductPages(
      `${LOCAL_CATALOG_DIR}/by-category/${category.slug}`,
      categoryProducts,
      categoryProducts.length,
    )
  }

  for (const product of products) {
    await writeJson(`${LOCAL_CATALOG_DIR}/products/${product.id}.json`, product)
  }

  await writeJson(
    `${LOCAL_CATALOG_DIR}/search-index.json`,
    products.map(product => {
      const modelNumber = product.specs.modelNumber

      return {
        id: product.id,
        sku: product.sku,
        name_en: product.name_en,
        name_cn: product.name_cn,
        specs: typeof modelNumber === 'string' ? { modelNumber } : {},
        price: product.price,
        currency: product.currency,
        moq: product.moq,
        category: product.category,
        status: product.status,
        alibaba_url: product.alibaba_url,
        images: product.images.slice(0, 1),
        created_at: product.created_at,
      }
    }),
  )
}

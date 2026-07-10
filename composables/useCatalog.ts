import { catalogCategories, demoProducts } from '~/data/catalog'
import type { CatalogCategory, CatalogPage, CatalogProduct } from '~/types/catalog'

interface CatalogQuery {
  page?: number
  pageSize?: number
  category?: string
  q?: string
  sort?: 'newest' | 'name'
}

const STATIC_PAGE_SIZE = 24

const normalizePage = (value: number | undefined) =>
  Math.max(1, Number(value) || 1)

const pageFromItems = (
  items: CatalogProduct[],
  page: number,
  pageSize = STATIC_PAGE_SIZE,
): CatalogPage => ({
  items: items.slice((page - 1) * pageSize, page * pageSize),
  page,
  pageSize,
  total: items.length,
  totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
})

export const useCatalog = () => {
  const baseURL = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
  const catalogPath = (path: string) => `${baseURL}${path}`
  const products = useState<CatalogProduct[]>('catalog-products', () => demoProducts)
  const categories = useState<CatalogCategory[]>('catalog-categories', () => catalogCategories)
  const total = useState('catalog-total', () => 0)
  const totalPages = useState('catalog-total-pages', () => 1)
  const currentPage = useState('catalog-current-page', () => 1)
  const loading = useState('catalog-loading', () => false)
  const error = useState<string | null>('catalog-error', () => null)
  const isLive = useState('catalog-is-live', () => false)

  const loadCategories = async () => {
    try {
      categories.value = await $fetch<CatalogCategory[]>(catalogPath('/catalog/categories.json'))
    } catch {
      // Keep bundled categories if MySQL is unavailable.
    }
  }

  const loadProducts = async (query: CatalogQuery = {}) => {
    loading.value = true
    error.value = null
    try {
      const page = normalizePage(query.page)
      const sort = query.sort === 'name' ? 'name' : 'newest'
      const search = query.q?.trim().toLocaleLowerCase()
      let data: CatalogPage

      if (search) {
        const index = await $fetch<CatalogProduct[]>(catalogPath('/catalog/search-index.json'))
        const filtered = index.filter(product => {
          if (query.category && product.category !== query.category) return false

          return [
            product.sku,
            product.name_en,
            product.name_cn ?? '',
            product.specs.modelNumber ?? '',
            product.specs.rawTitle ?? '',
          ].some(value => value.toLocaleLowerCase().includes(search))
        })
        const sorted = filtered.sort((first, second) => sort === 'name'
          ? first.name_en.localeCompare(second.name_en)
          : Date.parse(second.created_at) - Date.parse(first.created_at))

        data = pageFromItems(sorted, page, query.pageSize ?? STATIC_PAGE_SIZE)
      } else {
        const basePath = query.category
          ? `/catalog/by-category/${encodeURIComponent(query.category)}`
          : '/catalog/all'
        data = await $fetch<CatalogPage>(catalogPath(`${basePath}/${sort}/page-${page}.json`))
      }

      products.value = data.items
      total.value = data.total
      totalPages.value = data.totalPages
      currentPage.value = data.page
      isLive.value = true
      return data
    } catch {
      error.value = '商品数据暂时无法加载，请稍后重试。'
      products.value = []
      total.value = 0
      totalPages.value = 1
      return null
    } finally {
      loading.value = false
    }
  }

  const loadProduct = async (id: string) =>
    await $fetch<CatalogProduct>(catalogPath(`/catalog/products/${encodeURIComponent(id)}.json`))

  return {
    products,
    categories,
    total,
    totalPages,
    currentPage,
    loading,
    error,
    isLive,
    loadCategories,
    loadProducts,
    loadProduct,
  }
}

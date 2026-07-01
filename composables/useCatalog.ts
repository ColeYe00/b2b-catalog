import { catalogCategories, demoProducts } from '~/data/catalog'
import type { CatalogCategory, CatalogProduct } from '~/types/catalog'

export const useCatalog = () => {
  const products = useState<CatalogProduct[]>('catalog-products', () => demoProducts)
  const categories = useState<CatalogCategory[]>('catalog-categories', () => catalogCategories)
  const isLive = useState('catalog-is-live', () => false)

  const loadProducts = async () => {
    if (!import.meta.client) return

    try {
      const [localProducts, localCategories] = await Promise.all([
        $fetch<CatalogProduct[]>('/catalog/women-bags-products.json'),
        $fetch<CatalogCategory[]>('/catalog/women-bags-categories.json'),
      ])

      if (localProducts.length) {
        products.value = localProducts
      }

      if (localCategories.length) {
        categories.value = localCategories
      }
    } catch {
      // Keep bundled demo data when local crawler output has not been generated yet.
    }

    try {
      const data = await $fetch<CatalogProduct[]>('/api/catalog')
      if (data.length) {
        products.value = data
        isLive.value = true
      }
    } catch {
      // Keep local crawler output when MySQL is unavailable.
    }
  }

  return {
    products,
    categories,
    isLive,
    loadProducts,
  }
}

export interface ProductSpecs {
  source?: string
  sourceId?: string
  sourceTagName?: string
  modelNumber?: string
  dimensions?: {
    lengthCm: number
    heightCm: number
    widthCm: number
  }
  rawTitle?: string
}

export interface CatalogProduct {
  id: string
  sku: string
  name_en: string
  name_cn: string | null
  specs: ProductSpecs
  price: number | null
  currency: string
  moq: number
  category: string
  status: string
  alibaba_url: string | null
  images: string[]
  created_at: string
}

export interface CatalogCategory {
  slug: string
  nameEn: string
  nameCn: string
  count: number
}

export interface CatalogPage {
  items: CatalogProduct[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

import type { RowDataPacket } from 'mysql2'
import type { CatalogProduct, ProductSpecs } from '~/types/catalog'

interface ProductDbRow extends RowDataPacket {
  id: number
  sku: string
  name_en: string
  name_cn: string | null
  specs: ProductSpecs | string | null
  price: string | number | null
  currency: string
  moq: number
  category: string
  status: string
  alibaba_url: string | null
  images: string[] | string | null
  created_at: Date | string
}

function parseJson<T>(value: T | string | null, fallback: T): T {
  if (value === null) return fallback
  if (typeof value !== 'string') return value

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export default defineEventHandler(async (): Promise<CatalogProduct[]> => {
  const [rows] = await useMysqlPool().query<ProductDbRow[]>(
    `SELECT id, sku, name_en, name_cn, specs, price, currency, moq,
            category, status, alibaba_url, images, created_at
       FROM products
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 200`,
  )

  return rows.map(row => ({
    id: String(row.id),
    sku: row.sku,
    name_en: row.name_en,
    name_cn: row.name_cn,
    specs: parseJson(row.specs, {}),
    price: row.price === null ? null : Number(row.price),
    currency: row.currency,
    moq: row.moq,
    category: row.category,
    status: row.status,
    alibaba_url: row.alibaba_url,
    images: parseJson(row.images, []),
    created_at: new Date(row.created_at).toISOString(),
  }))
})

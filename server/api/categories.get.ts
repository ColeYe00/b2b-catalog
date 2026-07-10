import type { RowDataPacket } from 'mysql2'
import type { CatalogCategory } from '~/types/catalog'

interface CategoryRow extends RowDataPacket {
  slug: string
  nameEn: string
  nameCn: string
  count: number
}

export default defineCachedEventHandler(async (event): Promise<CatalogCategory[]> => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  const [rows] = await queryMysql<CategoryRow[]>('categories.list', `
    SELECT c.slug, c.name_en AS nameEn, c.name_cn AS nameCn, COUNT(p.id) AS count
      FROM categories c
      LEFT JOIN products p ON p.category = c.slug AND p.status = 'active'
     GROUP BY c.id, c.slug, c.name_en, c.name_cn
     ORDER BY c.id ASC
  `)

  return rows.map(row => ({ ...row, count: Number(row.count) }))
}, {
  maxAge: 300,
  swr: true,
  name: 'catalog-categories',
})

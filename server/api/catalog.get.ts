import type { RowDataPacket } from 'mysql2'
import type { CatalogPage } from '~/types/catalog'
import { PRODUCT_COLUMNS, toCatalogProduct, type ProductDbRow } from '~/server/utils/catalog'

interface CountRow extends RowDataPacket {
  total: number
}

export default defineCachedEventHandler(async (event): Promise<CatalogPage> => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  const query = getQuery(event)
  const page = Math.max(1, Number.parseInt(String(query.page ?? '1'), 10) || 1)
  const pageSize = Math.min(60, Math.max(1, Number.parseInt(String(query.pageSize ?? '24'), 10) || 24))
  const category = typeof query.category === 'string' ? query.category.trim() : ''
  const search = typeof query.q === 'string' ? query.q.trim().slice(0, 100) : ''
  const sort = query.sort === 'name' ? 'name' : 'newest'
  const where = [`status = 'active'`]
  const params: Array<string | number> = []

  if (category) {
    where.push('category = ?')
    params.push(category)
  }

  if (search) {
    where.push('(name_en LIKE ? OR name_cn LIKE ? OR sku LIKE ?)')
    const pattern = `%${search}%`
    params.push(pattern, pattern, pattern)
  }

  const whereSql = where.join(' AND ')
  const [countRows] = await queryMysql<CountRow[]>(
    'catalog.count',
    `SELECT COUNT(*) AS total FROM products WHERE ${whereSql}`,
    params,
  )
  const total = Number(countRows[0]?.total ?? 0)
  const offset = (page - 1) * pageSize
  const orderSql = sort === 'name'
    ? 'name_en ASC, id DESC'
    : 'created_at DESC, id DESC'
  const [rows] = await queryMysql<ProductDbRow[]>(
    'catalog.list',
    `SELECT ${PRODUCT_COLUMNS}
       FROM products
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ? OFFSET ?`,
    [...params, pageSize, offset],
  )

  return {
    items: rows.map(toCatalogProduct),
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}, {
  maxAge: 60,
  swr: true,
  name: 'catalog-list',
})

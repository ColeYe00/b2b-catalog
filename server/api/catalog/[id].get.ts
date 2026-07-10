import { PRODUCT_COLUMNS, toCatalogProduct, type ProductDbRow } from '~/server/utils/catalog'

export default defineCachedEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=120, stale-while-revalidate=300')
  const id = getRouterParam(event, 'id')

  if (!id || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product id' })
  }

  const [rows] = await queryMysql<ProductDbRow[]>(
    'catalog.detail',
    `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ? AND status = 'active' LIMIT 1`,
    [id],
  )
  const row = rows[0]

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Product not found' })
  }

  return toCatalogProduct(row)
}, {
  maxAge: 300,
  swr: true,
  name: 'catalog-product',
})

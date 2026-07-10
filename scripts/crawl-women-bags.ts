import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { createPool, type Pool } from 'mysql2/promise'
import {
  LOCAL_CATALOG_DIR,
  LOCAL_CATEGORIES_FILE,
  LOCAL_PRODUCTS_FILE,
  type LocalCategoryRow,
  type LocalProductRow,
  writeStaticCatalog,
} from './static-catalog.ts'

const SOURCE_ENDPOINT =
  'https://www.wsxcme.com/album/personal/all?isFilter=true'

const WOMEN_BAG_CATEGORIES = [
  { tagId: 80697835, slug: 'balenciaga-women-bags', nameEn: 'Balenciaga Women Bags', nameCn: '巴黎世家/女包' },
  { tagId: 80411239, slug: 'burberry-women-bags', nameEn: 'Burberry Women Bags', nameCn: '巴宝莉/女包' },
  { tagId: 47002622, slug: 'lv-women-bags', nameEn: 'Louis Vuitton Women Bags', nameCn: 'LV/女包' },
  { tagId: 47002679, slug: 'gucci-women-bags', nameEn: 'Gucci Women Bags', nameCn: '古驰/女包' },
  { tagId: 47002745, slug: 'chanel-women-bags', nameEn: 'Chanel Women Bags', nameCn: '香奈儿/女包' },
  { tagId: 47002747, slug: 'dior-women-bags', nameEn: 'Dior Women Bags', nameCn: '迪奥/女包' },
  { tagId: 47002761, slug: 'ysl-women-bags', nameEn: 'Saint Laurent Women Bags', nameCn: '圣罗兰/女包' },
  { tagId: 68075769, slug: 'miu-miu-women-bags', nameEn: 'Miu Miu Women Bags', nameCn: 'Miu Miu /女包' },
  { tagId: 47002669, slug: 'prada-women-bags', nameEn: 'Prada Women Bags', nameCn: '普拉达/女包' },
  { tagId: 47002713, slug: 'loewe-women-bags', nameEn: 'Loewe Women Bags', nameCn: '罗意威/女包' },
  { tagId: 47003106, slug: 'celine-women-bags', nameEn: 'Celine Women Bags', nameCn: '塞琳/女包' },
  { tagId: 47002731, slug: 'fendi-women-bags', nameEn: 'Fendi Women Bags', nameCn: '芬迪/女包' },
  { tagId: 47003160, slug: 'goyard-women-bags', nameEn: 'Goyard Women Bags', nameCn: '戈雅/女包' },
  { tagId: 76963559, slug: 'hermes-women-bags', nameEn: 'Hermes Women Bags', nameCn: '爱马仕/女包' },
  { tagId: 77388356, slug: 'mcm-coach-women-bags', nameEn: 'MCM and Coach Women Bags', nameCn: 'MCM、寇驰/女包' },
  { tagId: 79154589, slug: 'bv-women-bags', nameEn: 'Bottega Veneta Women Bags', nameCn: 'BV/女包' },
  { tagId: 47002756, slug: 'bvlgari-women-bags', nameEn: 'Bvlgari Women Bags', nameCn: '宝格丽/女包' },
  { tagId: 47002663, slug: 'women-wallets', nameEn: 'Women Wallets', nameCn: '长短款钱包' },
  { tagId: 47002743, slug: 'women-backpacks', nameEn: 'Women Backpacks', nameCn: '女士双肩包' },
] as const

interface SourceTag {
  tagId: number
  tagName: string
}

interface SourceItem {
  goods_id: string
  title?: string
  imgsSrc?: string[]
  images?: string[]
  tags?: SourceTag[]
  status?: number
  update_time?: number
  time_stamp?: number
  time?: string
}

interface SourcePage {
  errcode?: number
  errmsg?: string
  result?: {
    items?: SourceItem[]
    pagination?: {
      pageTimestamp?: number
      isLoadMore?: boolean
    }
  }
}

interface Dimensions {
  lengthCm: number
  heightCm: number
  widthCm: number
}

interface ProductRow {
  sku: string
  name_en: string
  name_cn: string
  specs: Record<string, unknown>
  price: number | null
  currency: string
  moq: number
  category: string
  status: string
  alibaba_url: null
  images: string[]
  created_at: string
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`缺少环境变量 ${name}`)
  }

  return value
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name]
  const value = raw === undefined ? fallback : Number(raw)

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} 必须是非负数字`)
  }

  return value
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function publicId(value: string): string {
  return `item-${createHash('sha1').update(value).digest('hex').slice(0, 12)}`
}

function normalizeTitle(value: string | undefined): string {
  return (value ?? '').normalize('NFKC').trim()
}

function extractModelNumber(title: string): string | undefined {
  return title.match(/(?:款号|型号|货号)\s*[:：]?\s*([^\n，,。]+)/i)?.[1]?.trim()
}

function extractDimensions(title: string): Dimensions | undefined {
  const labeled = title.match(
    /长\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?\s*[x×*]\s*高\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)?\s*[x×*]\s*宽\s*(\d+(?:\.\d+)?)/i,
  )
  const plain = title.match(
    /尺寸\s*[:：]?\s*(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)\s*(?:cm|厘米)/i,
  )
  const match = labeled ?? plain

  if (!match?.[1] || !match[2] || !match[3]) {
    return undefined
  }

  return {
    lengthCm: Number(match[1]),
    heightCm: Number(match[2]),
    widthCm: Number(match[3]),
  }
}

function englishName(title: string, fallback: string): string {
  const firstLine = title
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean)

  if (firstLine && /[a-z]/i.test(firstLine)) {
    return firstLine.slice(0, 180)
  }

  return fallback
}

function createdAt(item: SourceItem): string {
  const timestamp = item.update_time ?? item.time_stamp

  if (timestamp && Number.isFinite(timestamp)) {
    return new Date(timestamp).toISOString()
  }

  return new Date().toISOString()
}

function toProductRow(
  item: SourceItem,
  category: (typeof WOMEN_BAG_CATEGORIES)[number],
): ProductRow {
  const title = normalizeTitle(item.title)
  const modelNumber = extractModelNumber(title)
  const dimensions = extractDimensions(title)

  return {
    sku: item.goods_id,
    name_en: englishName(title, category.nameEn),
    name_cn: title || category.nameCn,
    specs: {
      source: 'wsxcme',
      sourceId: item.goods_id,
      sourceTagId: category.tagId,
      sourceTagName: category.nameCn,
      ...(modelNumber ? { modelNumber } : {}),
      ...(dimensions ? { dimensions } : {}),
      rawTitle: title,
    },
    price: null,
    currency: 'CNY',
    moq: 1,
    category: category.slug,
    status: item.status === 0 ? 'active' : 'inactive',
    alibaba_url: null,
    images: [...new Set(item.imgsSrc ?? item.images ?? [])],
    created_at: createdAt(item),
  }
}

async function fetchPage(
  token: string,
  albumId: string,
  tagId: number,
  timestamp?: number,
): Promise<Required<SourcePage>['result']> {
  const body = new URLSearchParams({
    token,
    platform: 'android',
    platformType: 'android',
    minicodeBuckup: '1',
    version: '3472',
    client_type: 'miniapp',
    query_type: '',
    albumId,
    searchValue: '',
    searchImg: '',
    tagList: JSON.stringify([tagId]),
    tagGroupId: '',
    startDate: '',
    endDate: '',
    page: '',
    requestDataType: '',
  })

  if (timestamp !== undefined) {
    body.set('slipType', '1')
    body.set('timestamp', String(timestamp))
  }

  let lastError: unknown

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(SOURCE_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 WeChatMiniProgramCatalogSync/1.0',
        },
        body,
        signal: AbortSignal.timeout(30_000),
      })

      if (!response.ok) {
        throw new Error(`源接口返回 HTTP ${response.status}`)
      }

      const payload = (await response.json()) as SourcePage

      if (payload.errcode && payload.errcode !== 0) {
        throw new Error(payload.errmsg || `源接口错误码 ${payload.errcode}`)
      }

      if (!payload.result) {
        throw new Error('源接口响应中缺少 result')
      }

      return payload.result
    } catch (error) {
      lastError = error

      if (attempt < 3) {
        await sleep(attempt * 2_000)
      }
    }
  }

  throw lastError
}

function chunks<T>(items: T[], size: number): T[][] {
  const result: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size))
  }

  return result
}

function createMysqlPool(): Pool {
  return createPool({
    host: requiredEnv('MYSQL_HOST'),
    port: envNumber('MYSQL_PORT', 3306),
    database: requiredEnv('MYSQL_DATABASE'),
    user: requiredEnv('MYSQL_USER'),
    password: requiredEnv('MYSQL_PASSWORD'),
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4',
  })
}

async function upsertCategories(pool: Pool): Promise<void> {
  const placeholders = WOMEN_BAG_CATEGORIES.map(() => '(?, ?, ?)').join(', ')
  const values = WOMEN_BAG_CATEGORIES.flatMap(category => [
    category.slug,
    category.nameEn,
    category.nameCn,
  ])

  await pool.execute(
    `INSERT INTO categories (slug, name_en, name_cn)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       name_en = VALUES(name_en),
       name_cn = VALUES(name_cn)`,
    values,
  )
}

async function upsertProducts(pool: Pool, rows: ProductRow[]): Promise<void> {
  if (!rows.length) return

  const placeholders = rows.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')
  const values = rows.flatMap(row => [
    row.sku,
    row.name_en,
    row.name_cn,
    JSON.stringify(row.specs),
    row.price,
    row.currency,
    row.moq,
    row.category,
    row.status,
    row.alibaba_url,
    JSON.stringify(row.images),
  ])

  await pool.execute(
    `INSERT INTO products
       (sku, name_en, name_cn, specs, price, currency, moq, category, status, alibaba_url, images)
     VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE
       name_en = VALUES(name_en),
       name_cn = VALUES(name_cn),
       specs = VALUES(specs),
       price = VALUES(price),
       currency = VALUES(currency),
       moq = VALUES(moq),
       category = VALUES(category),
       status = VALUES(status),
       alibaba_url = VALUES(alibaba_url),
       images = VALUES(images)`,
    values,
  )
}

async function main(): Promise<void> {
  const token = requiredEnv('SOURCE_API_TOKEN')
  const albumId = requiredEnv('SOURCE_ALBUM_ID')
  const delayMs = envNumber('CRAWLER_DELAY_MS', 1_000)
  const batchSize = envNumber('CRAWLER_BATCH_SIZE', 100)
  const maxPages = envNumber('CRAWLER_MAX_PAGES', 0)
  const dryRun = process.env.CRAWLER_DRY_RUN === 'true'
  const mysql = dryRun ? null : createMysqlPool()

  if (batchSize < 1) {
    throw new Error('CRAWLER_BATCH_SIZE 必须大于 0')
  }

  if (mysql) {
    await mysql.query('SELECT 1')
    await upsertCategories(mysql)
  }

  let totalFetched = 0
  let totalSaved = 0
  const localProducts: LocalProductRow[] = []
  const localCategoryCounts = new Map<string, number>()

  for (const category of WOMEN_BAG_CATEGORIES) {
    let timestamp: number | undefined
    let page = 0
    const seenCursors = new Set<number>()
    const seenProducts = new Set<string>()

    console.log(`\n[${category.nameCn}] 开始采集`)

    while (true) {
      page += 1
      const result = await fetchPage(token, albumId, category.tagId, timestamp)
      const items = result.items ?? []
      const uniqueItems = items.filter(item => {
        if (!item.goods_id || seenProducts.has(item.goods_id)) {
          return false
        }

        seenProducts.add(item.goods_id)
        return true
      })
      const rows = uniqueItems.map(item => toProductRow(item, category))
      const localRows = rows.map(row => ({
        id: publicId(row.sku),
        ...row,
      }))

      totalFetched += items.length
      localProducts.push(...localRows)
      localCategoryCounts.set(
        category.slug,
        (localCategoryCounts.get(category.slug) ?? 0) + localRows.length,
      )

      if (mysql) {
        for (const batch of chunks(rows, batchSize)) {
          await upsertProducts(mysql, batch)
          totalSaved += batch.length
        }
      } else {
        totalSaved += rows.length
      }

      console.log(
        `[${category.nameCn}] 第 ${page} 页：获取 ${items.length}，新增 ${rows.length}`,
      )

      const pagination = result.pagination
      const nextTimestamp = pagination?.pageTimestamp

      if (
        !pagination?.isLoadMore ||
        items.length === 0 ||
        (maxPages > 0 && page >= maxPages)
      ) {
        break
      }

      if (
        nextTimestamp === undefined ||
        nextTimestamp === timestamp ||
        seenCursors.has(nextTimestamp)
      ) {
        throw new Error(`${category.nameCn} 分页游标未变化，已停止以避免死循环`)
      }

      seenCursors.add(nextTimestamp)
      timestamp = nextTimestamp
      await sleep(delayMs)
    }
  }

  const localCategories: LocalCategoryRow[] = WOMEN_BAG_CATEGORIES.map(category => ({
    slug: category.slug,
    nameEn: category.nameEn,
    nameCn: category.nameCn,
    count: localCategoryCounts.get(category.slug) ?? 0,
  }))

  await mkdir(LOCAL_CATALOG_DIR, { recursive: true })
  await writeFile(
    LOCAL_PRODUCTS_FILE,
    `${JSON.stringify(localProducts, null, 2)}\n`,
    'utf8',
  )
  await writeFile(
    LOCAL_CATEGORIES_FILE,
    `${JSON.stringify(localCategories, null, 2)}\n`,
    'utf8',
  )
  await writeStaticCatalog(localProducts, localCategories)

  console.log(`本地展示数据已保存：${LOCAL_PRODUCTS_FILE}`)
  console.log(`本地分类数据已保存：${LOCAL_CATEGORIES_FILE}`)
  console.log(`静态分页目录已保存：${LOCAL_CATALOG_DIR}/all 和 ${LOCAL_CATALOG_DIR}/by-category`)

  console.log(
    `\n完成：获取 ${totalFetched} 条，${dryRun ? '验证' : '写入'} ${totalSaved} 条。`,
  )

  await mysql?.end()
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

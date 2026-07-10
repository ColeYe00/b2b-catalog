import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import {
  LOCAL_CATEGORIES_FILE,
  LOCAL_PRODUCTS_FILE,
  type LocalCategoryRow,
  type LocalProductRow,
  writeStaticCatalog,
} from './static-catalog.ts'

interface TranslationCache {
  [hash: string]: string
}

interface TranslationRequest {
  id: string
  text: string
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const DEFAULT_BIGMODEL_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
const CACHE_FILE = '.cache/catalog-translations.json'
const CHINESE_PATTERN = /[\u3400-\u9fff]/

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`Missing environment variable ${name}`)
  }

  return value
}

function envNumber(name: string, fallback: number): number {
  const value = process.env[name] ? Number(process.env[name]) : fallback

  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer`)
  }

  return value
}

function hashText(value: string): string {
  return createHash('sha1').update(value).digest('hex')
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T
}

async function writeJson(path: string, value: unknown, pretty = true): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, pretty ? 2 : 0)}\n`, 'utf8')
}

async function readCache(): Promise<TranslationCache> {
  try {
    return await readJson<TranslationCache>(CACHE_FILE)
  } catch {
    return {}
  }
}

async function writeCache(cache: TranslationCache): Promise<void> {
  await mkdir('.cache', { recursive: true })
  await writeJson(CACHE_FILE, cache)
}

function extractJsonObject(value: string): Record<string, string> {
  const start = value.indexOf('{')
  const end = value.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Translation response did not contain a JSON object')
  }

  return JSON.parse(value.slice(start, end + 1)) as Record<string, string>
}

function cleanTranslation(value: string): string {
  return value
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function translateBatch(
  apiKey: string,
  baseUrl: string,
  model: string,
  maxTokens: number,
  requests: TranslationRequest[],
): Promise<Record<string, string>> {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'Translate Chinese luxury handbag catalog text into concise natural English.',
            'Preserve brand names, model numbers, colors, dimensions, emojis, and line breaks when useful.',
            'Do not add sales claims, prices, authenticity claims, or unavailable details.',
            'Return only a JSON object whose keys are the item ids and values are translated English text.',
            'Example JSON output: {"item-id":"English translation"}.',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify(Object.fromEntries(
            requests.map(item => [item.id, item.text]),
          )),
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`GLM translation failed: HTTP ${response.status} ${await response.text()}`)
  }

  const payload = (await response.json()) as ChatCompletionResponse
  const content = payload.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('GLM translation returned an empty response')
  }

  return extractJsonObject(content)
}

function productText(product: LocalProductRow): string {
  return String(product.specs.rawTitle ?? product.name_cn ?? product.name_en).trim()
}

function applyTranslation(product: LocalProductRow, translated: string): LocalProductRow {
  const text = cleanTranslation(translated)
  const firstLine = text.split(/\r?\n/).map(line => line.trim()).find(Boolean)

  return {
    ...product,
    name_en: firstLine || product.name_en,
    name_cn: text,
    specs: {
      ...product.specs,
      rawTitle: text,
    },
  }
}

async function main(): Promise<void> {
  const apiKey = requiredEnv('BIGMODEL_API_KEY')
  const baseUrl = process.env.BIGMODEL_BASE_URL?.trim() || DEFAULT_BIGMODEL_BASE_URL
  const model = process.env.BIGMODEL_MODEL?.trim() || 'glm-4.7-flash'
  const batchSize = envNumber('TRANSLATE_BATCH_SIZE', 20)
  const maxTokens = envNumber('TRANSLATE_MAX_TOKENS', 8192)
  const products = await readJson<LocalProductRow[]>(LOCAL_PRODUCTS_FILE)
  const categories = await readJson<LocalCategoryRow[]>(LOCAL_CATEGORIES_FILE)
  const cache = await readCache()
  let translatedCount = 0

  const pending = products
    .map(product => ({ product, text: productText(product) }))
    .filter(item => CHINESE_PATTERN.test(item.text) && !cache[hashText(item.text)])

  for (let index = 0; index < pending.length; index += batchSize) {
    const batch = pending.slice(index, index + batchSize)
    const requests = batch.map(({ text }) => ({
      id: hashText(text),
      text,
    }))
    const translations = await translateBatch(apiKey, baseUrl, model, maxTokens, requests)

    for (const request of requests) {
      const translated = translations[request.id]

      if (!translated) {
        throw new Error(`Missing translation for ${request.id}`)
      }

      cache[request.id] = cleanTranslation(translated)
      translatedCount += 1
    }

    await writeCache(cache)
    console.log(`Translated ${Math.min(index + batch.length, pending.length)} / ${pending.length}`)
  }

  const translatedProducts = products.map(product => {
    const text = productText(product)
    const translated = cache[hashText(text)]

    return translated ? applyTranslation(product, translated) : product
  })
  const englishCategories = categories.map(category => ({
    ...category,
    nameCn: category.nameEn,
  }))

  await writeJson(LOCAL_PRODUCTS_FILE, translatedProducts)
  await writeJson(LOCAL_CATEGORIES_FILE, englishCategories)
  await writeStaticCatalog(translatedProducts, englishCategories)

  console.log(`Done. Newly translated ${translatedCount}; catalog products: ${translatedProducts.length}.`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

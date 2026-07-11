import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import {
  LOCAL_CATEGORIES_FILE,
  LOCAL_PRODUCTS_FILE,
  categoriesWithProductCounts,
  hardDedupeProducts,
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
      content?: string | Array<{ text?: string }>
    }
  }>
}

interface ChatCompletionRequestBody {
  model: string
  temperature: number
  max_tokens: number
  thinking?: {
    type: string
  }
  response_format?: {
    type: 'json_object'
  }
  messages: Array<{
    role: 'system' | 'user'
    content: string
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

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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
  let depth = 0
  let inString = false
  let escaped = false

  if (start === -1) {
    throw new Error('Translation response did not contain a JSON object')
  }

  for (let index = start; index < value.length; index += 1) {
    const char = value[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === '\\') {
      escaped = inString
      continue
    }

    if (char === '"') {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1

      if (depth === 0) {
        const json = value.slice(start, index + 1)

        try {
          return JSON.parse(json) as Record<string, string>
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          throw new Error(`Translation response contained invalid JSON: ${message}. Response excerpt: ${json.slice(0, 1200)}`)
        }
      }
    }
  }

  throw new Error('Translation response contained incomplete JSON')
}

function cleanTranslation(value: string): string {
  return value
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function chatMessageContent(payload: ChatCompletionResponse): string {
  const content = payload.choices?.[0]?.message?.content

  if (typeof content === 'string') {
    return content
  }

  if (Array.isArray(content)) {
    return content.map(part => part.text ?? '').join('\n').trim()
  }

  return ''
}

async function translateBatch(
  apiKey: string,
  baseUrl: string,
  model: string,
  maxTokens: number,
  requests: TranslationRequest[],
): Promise<Record<string, string>> {
  const maxRetries = envNumber('TRANSLATE_MAX_RETRIES', 6)
  const retryDelayMs = envNumber('TRANSLATE_RETRY_DELAY_MS', 10_000)
  const body: ChatCompletionRequestBody = {
    model,
    temperature: 0,
    max_tokens: maxTokens,
    thinking: {
      type: process.env.TRANSLATE_THINKING?.trim() || 'disabled',
    },
    messages: [
      {
        role: 'system',
        content: [
          'Translate Chinese luxury handbag catalog text into concise natural English.',
          'Preserve brand names, model numbers, colors, dimensions, emojis, and line breaks when useful.',
          'Do not add sales claims, prices, authenticity claims, or unavailable details.',
          'Return only a valid JSON object whose keys are the item ids and values are translated English text.',
          'Do not wrap the JSON in Markdown fences.',
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
  }

  if (process.env.TRANSLATE_JSON_MODE !== 'false') {
    body.response_format = { type: 'json_object' }
  }

  let response: Response | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (
      response.ok ||
      (response.status !== 429 && response.status < 500) ||
      attempt === maxRetries
    ) {
      break
    }

    const delay = retryDelayMs * (attempt + 1)
    console.warn(`GLM rate/server limit HTTP ${response.status}; retrying in ${delay}ms.`)
    await sleep(delay)
  }

  if (!response) {
    throw new Error('GLM translation failed before receiving a response')
  }

  if (!response.ok) {
    throw new Error(`GLM translation failed: HTTP ${response.status} ${await response.text()}`)
  }

  const payload = (await response.json()) as ChatCompletionResponse
  const content = chatMessageContent(payload)

  if (!content) {
    throw new Error(`GLM translation returned an empty response: ${JSON.stringify(payload).slice(0, 1200)}`)
  }

  return extractJsonObject(content)
}

async function translateWithRetries(
  apiKey: string,
  baseUrl: string,
  model: string,
  maxTokens: number,
  requests: TranslationRequest[],
): Promise<Record<string, string>> {
  let translations: Record<string, string>

  try {
    translations = await translateBatch(apiKey, baseUrl, model, maxTokens, requests)
  } catch (error) {
    if (requests.length === 1) {
      throw error
    }

    console.warn(`Batch translation failed; retrying ${requests.length} items one by one.`)
    translations = {}

    for (const request of requests) {
      const retry = await translateBatch(apiKey, baseUrl, model, maxTokens, [request])
      const translated = retry[request.id]

      if (!translated) {
        throw new Error(`Missing translation for ${request.id} after single-item retry`)
      }

      translations[request.id] = translated
    }
  }

  const missing = requests.filter(request => !translations[request.id])

  for (const request of missing) {
    console.warn(`Missing translation for ${request.id}; retrying as a single item.`)
    const retry = await translateBatch(apiKey, baseUrl, model, maxTokens, [request])
    const translated = retry[request.id]

    if (!translated) {
      throw new Error(`Missing translation for ${request.id} after retry`)
    }

    translations[request.id] = translated
  }

  return translations
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
  const batchSize = envNumber('TRANSLATE_BATCH_SIZE', 5)
  const maxTokens = envNumber('TRANSLATE_MAX_TOKENS', 8192)
  const requestDelayMs = envNumber('TRANSLATE_REQUEST_DELAY_MS', 1_000)
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
    const translations = await translateWithRetries(apiKey, baseUrl, model, maxTokens, requests)

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

    if (requestDelayMs > 0) {
      await sleep(requestDelayMs)
    }
  }

  const translatedProducts = hardDedupeProducts(products.map(product => {
    const text = productText(product)
    const translated = cache[hashText(text)]

    return translated ? applyTranslation(product, translated) : product
  }))
  const englishCategories = categoriesWithProductCounts(categories.map(category => ({
    ...category,
    nameCn: category.nameEn,
  })), translatedProducts)

  await writeJson(LOCAL_PRODUCTS_FILE, translatedProducts)
  await writeJson(LOCAL_CATEGORIES_FILE, englishCategories)
  await writeStaticCatalog(translatedProducts, englishCategories)

  console.log(`Done. Newly translated ${translatedCount}; catalog products: ${translatedProducts.length}.`)
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})

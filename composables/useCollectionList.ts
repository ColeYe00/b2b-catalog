interface CollectionListItem {
  productId: string
  quantity: number
}

const STORAGE_KEY = 'atelier-gallery-collection-list'
const SAVED_AT_KEY = 'atelier-gallery-collection-list-saved-at'

const normalizeQuantity = (value: number) => {
  if (!Number.isFinite(value)) return 1
  return Math.min(999, Math.max(1, Math.round(value)))
}

export const useCollectionList = () => {
  const items = useState<CollectionListItem[]>('collection-list-items', () => [])
  const hydrated = useState('collection-list-hydrated', () => false)
  const savedAt = useState<string | null>('collection-list-saved-at', () => null)

  const persist = () => {
    if (!import.meta.client || !hydrated.value) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
  }

  const hydrate = () => {
    if (!import.meta.client || hydrated.value) return

    try {
      const storedItems = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CollectionListItem[]
      items.value = storedItems
        .filter(item => item.productId && Number.isFinite(item.quantity))
        .map(item => ({
          productId: item.productId,
          quantity: normalizeQuantity(item.quantity),
        }))
      savedAt.value = localStorage.getItem(SAVED_AT_KEY)
    } catch {
      items.value = []
      savedAt.value = null
    } finally {
      hydrated.value = true
    }
  }

  const addItem = (productId: string, quantity = 1) => {
    hydrate()
    const current = items.value.find(item => item.productId === productId)

    if (current) {
      current.quantity = normalizeQuantity(current.quantity + quantity)
    } else {
      items.value.push({
        productId,
        quantity: normalizeQuantity(quantity),
      })
    }

    persist()
  }

  const setQuantity = (productId: string, quantity: number) => {
    const current = items.value.find(item => item.productId === productId)
    if (!current) return

    current.quantity = normalizeQuantity(quantity)
    persist()
  }

  const removeItem = (productId: string) => {
    items.value = items.value.filter(item => item.productId !== productId)
    persist()
  }

  const clearItems = () => {
    items.value = []
    persist()
  }

  const submitList = () => {
    const value = new Date().toISOString()
    savedAt.value = value

    if (import.meta.client) {
      localStorage.setItem(SAVED_AT_KEY, value)
      persist()
    }
  }

  const getQuantity = (productId: string) =>
    items.value.find(item => item.productId === productId)?.quantity ?? 0

  const totalCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const uniqueCount = computed(() => items.value.length)

  return {
    items,
    savedAt,
    totalCount,
    uniqueCount,
    hydrate,
    addItem,
    setQuantity,
    removeItem,
    clearItems,
    submitList,
    getQuantity,
  }
}

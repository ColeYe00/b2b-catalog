<script setup lang="ts">
const { products, categories, loadCategories, loadProduct } = useCatalog()
const {
  items,
  savedAt,
  totalCount,
  hydrate,
  setQuantity,
  removeItem,
  clearItems,
  submitList,
} = useCollectionList()

const saved = ref(false)

const listItems = computed(() =>
  items.value
    .map(item => ({
      item,
      product: products.value.find(product => product.id === item.productId),
    }))
    .filter((entry): entry is {
      item: { productId: string, quantity: number }
      product: NonNullable<typeof entry.product>
    } => Boolean(entry.product)),
)

const categoryName = (slug: string) =>
  categories.value.find(category => category.slug === slug)?.nameEn ?? slug

const saveCollection = () => {
  submitList()
  saved.value = true
}

const formattedSavedAt = computed(() => {
  if (!savedAt.value) return ''

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(savedAt.value))
})

onMounted(async () => {
  hydrate()
  loadCategories()
  const loaded = await Promise.all(
    items.value.map(item => loadProduct(item.productId).catch(() => null)),
  )
  products.value = loaded.filter((product): product is NonNullable<typeof product> => Boolean(product))
})

useSeoMeta({
  title: 'Collection List — Atelier Gallery',
  description: 'Organize selected catalog items locally for display reference.',
})
</script>

<template>
  <div>
    <section class="border-b border-black/10 bg-[#e5e0d6]">
      <div class="page-shell py-14 sm:py-20">
        <p class="eyebrow">Local collection</p>
        <div class="mt-4 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <h1 class="text-5xl font-medium tracking-[-0.04em] sm:text-6xl">
              Collection List
            </h1>
            <p class="mt-5 max-w-2xl text-sm leading-7 text-stone-600">
              Organize viewed catalog items and reference quantities. This list is saved only in the current browser.
            </p>
          </div>
          <div class="rounded-full bg-white/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-600">
            {{ listItems.length }} items · {{ totalCount }} total
          </div>
        </div>
      </div>
    </section>

    <section class="page-shell py-12">
      <div v-if="listItems.length" class="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div class="space-y-4">
          <article
            v-for="{ item, product } in listItems"
            :key="product.id"
            class="grid gap-4 border border-black/10 bg-white p-4 sm:grid-cols-[120px_1fr] sm:p-5"
          >
            <NuxtLink :to="`/products/${encodeURIComponent(product.id)}`" class="aspect-[4/5] overflow-hidden bg-[#eeeae1]">
              <img
                v-if="product.images[0]"
                :src="product.images[0]"
                :alt="product.name_en"
                class="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                sizes="120px"
              >
            </NuxtLink>

            <div class="flex flex-col justify-between gap-5">
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-brass">
                  {{ categoryName(product.category) }}
                </p>
                <NuxtLink :to="`/products/${encodeURIComponent(product.id)}`" class="mt-2 block text-lg font-medium leading-snug hover:text-brass">
                  {{ product.name_en }}
                </NuxtLink>
                <p class="mt-2 line-clamp-2 text-xs leading-5 text-stone-500">
                  {{ product.name_cn }}
                </p>
              </div>

              <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center border border-black/15">
                  <button
                    type="button"
                    class="grid h-10 w-10 place-items-center text-lg hover:bg-stone-100"
                    aria-label="Decrease quantity"
                    @click="setQuantity(product.id, item.quantity - 1)"
                  >
                    −
                  </button>
                  <input
                    :value="item.quantity"
                    type="number"
                    min="1"
                    max="999"
                    class="h-10 w-16 border-x border-black/15 bg-transparent text-center text-sm outline-none"
                    aria-label="Quantity"
                    @input="setQuantity(product.id, Number(($event.target as HTMLInputElement).value))"
                  >
                  <button
                    type="button"
                    class="grid h-10 w-10 place-items-center text-lg hover:bg-stone-100"
                    aria-label="Increase quantity"
                    @click="setQuantity(product.id, item.quantity + 1)"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  class="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500 hover:text-ink"
                  @click="removeItem(product.id)"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        </div>

        <aside class="lg:sticky lg:top-28 lg:self-start">
          <div class="border border-black/10 bg-white p-6">
            <p class="eyebrow">List summary</p>
            <div class="mt-5 space-y-4 text-sm">
              <div class="flex justify-between">
                <span class="text-stone-500">Selected items</span>
                <strong>{{ listItems.length }}</strong>
              </div>
              <div class="flex justify-between">
                <span class="text-stone-500">Total quantity</span>
                <strong>{{ totalCount }}</strong>
              </div>
              <div v-if="formattedSavedAt" class="border-t border-black/10 pt-4 text-xs leading-5 text-stone-500">
                Last saved: {{ formattedSavedAt }}
              </div>
            </div>

            <button
              type="button"
              class="mt-6 flex w-full items-center justify-center gap-3 bg-ink px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-brass"
              @click="saveCollection"
            >
              Save Collection
              <AppIcon name="check" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="mt-3 w-full border border-black/15 px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-stone-100"
              @click="clearItems"
            >
              Clear List
            </button>

            <p class="mt-5 text-xs leading-6 text-stone-500">
              This list is only for organizing displayed catalog information and has no commercial function.
            </p>
            <p v-if="saved" class="mt-4 rounded-full bg-emerald-50 px-4 py-2 text-center text-xs font-medium text-emerald-700">
              Saved in this browser
            </p>
          </div>
        </aside>
      </div>

      <div v-else class="grid min-h-96 place-items-center border border-dashed border-black/20 bg-white text-center">
        <div class="px-6">
          <AppIcon name="bag" class="mx-auto h-10 w-10 text-brass" />
          <h2 class="mt-5 text-2xl font-medium">Your collection is empty</h2>
          <p class="mt-3 text-sm text-stone-500">Add catalog items here while browsing.</p>
          <NuxtLink to="/products" class="mt-7 inline-flex items-center gap-3 bg-ink px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-brass">
            Back to Catalog
            <AppIcon name="arrow" class="h-4 w-4" />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

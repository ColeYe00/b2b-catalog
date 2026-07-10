<script setup lang="ts">
const route = useRoute()
const { products, categories, loadCategories, loadProducts, loadProduct } = useCatalog()
const { addItem, getQuantity, hydrate: hydrateCollectionList } = useCollectionList()
const selectedImage = ref(0)
const addQuantity = ref(1)

const productId = computed(() => {
  const value = route.params.id
  const rawValue = Array.isArray(value) ? value[0] : value
  return decodeURIComponent(rawValue ?? '')
})
const product = ref<Awaited<ReturnType<typeof loadProduct>> | null>(null)
const category = computed(() =>
  categories.value.find(item => item.slug === product.value?.category),
)
const dimensions = computed(() => product.value?.specs.dimensions)
const imageCount = computed(() => product.value?.images.length ?? 0)
const hasMultipleImages = computed(() => imageCount.value > 1)
const quantityInList = computed(() =>
  product.value ? getQuantity(product.value.id) : 0,
)

const showPreviousImage = () => {
  if (!imageCount.value) return
  selectedImage.value = selectedImage.value === 0
    ? imageCount.value - 1
    : selectedImage.value - 1
}

const showNextImage = () => {
  if (!imageCount.value) return
  selectedImage.value = selectedImage.value === imageCount.value - 1
    ? 0
    : selectedImage.value + 1
}

const normalizeAddQuantity = (value: number | string) => {
  const digits = String(value).replace(/\D/g, '')
  const parsed = Number(digits || 1)

  return Math.min(999, Math.max(1, parsed))
}

const updateAddQuantity = (event: Event) => {
  const input = event.target as HTMLInputElement
  addQuantity.value = normalizeAddQuantity(input.value)
  input.value = String(addQuantity.value)
}

const decreaseAddQuantity = () => {
  addQuantity.value = normalizeAddQuantity(addQuantity.value - 1)
}

const increaseAddQuantity = () => {
  addQuantity.value = normalizeAddQuantity(addQuantity.value + 1)
}

const addToCollection = () => {
  if (!product.value) return
  addItem(product.value.id, normalizeAddQuantity(addQuantity.value))
}

onMounted(async () => {
  hydrateCollectionList()
  loadCategories()
  try {
    product.value = await loadProduct(productId.value)
    await loadProducts({ pageSize: 4, category: product.value.category })
  } catch {
    product.value = null
  }
})

useSeoMeta({
  title: () => product.value
    ? `${product.value.name_en} — Product Reference`
    : 'Product details',
  description: () => product.value?.name_cn ?? 'View product images and specification references.',
})
</script>

<template>
  <div v-if="product">
    <div class="page-shell flex items-center gap-2 py-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
      <NuxtLink to="/">Home</NuxtLink>
      <AppIcon name="chevron" class="h-3 w-3" />
      <NuxtLink to="/products">Catalog</NuxtLink>
      <AppIcon name="chevron" class="h-3 w-3" />
      <span class="truncate text-ink">{{ product.name_en }}</span>
    </div>

    <section class="page-shell grid gap-10 pb-20 lg:grid-cols-[1.12fr_0.88fr] lg:gap-16">
      <div>
        <div class="group relative aspect-[4/5] overflow-hidden bg-[#e7e3db]">
          <img
            v-if="product.images[selectedImage]"
            :src="product.images[selectedImage]"
            :alt="product.name_en"
            class="h-full w-full object-cover"
            decoding="async"
            fetchpriority="high"
            sizes="(min-width: 1024px) 58vw, 100vw"
          >
          <template v-if="hasMultipleImages">
            <button
              type="button"
              aria-label="Previous image"
              class="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/80 text-ink shadow-soft backdrop-blur transition hover:bg-ink hover:text-white sm:left-5"
              @click="showPreviousImage"
            >
              <AppIcon name="chevron" class="h-5 w-5 rotate-180" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              class="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-white/80 text-ink shadow-soft backdrop-blur transition hover:bg-ink hover:text-white sm:right-5"
              @click="showNextImage"
            >
              <AppIcon name="chevron" class="h-5 w-5" />
            </button>
            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink/70 px-3 py-1 text-[10px] font-semibold tracking-widest text-white backdrop-blur">
              {{ selectedImage + 1 }} / {{ imageCount }}
            </div>
          </template>
        </div>
        <div v-if="hasMultipleImages" class="mt-3 grid grid-cols-4 gap-3">
          <button
            v-for="(image, index) in product.images.slice(0, 4)"
            :key="image"
            class="aspect-square overflow-hidden border-2 bg-[#e7e3db]"
            :class="selectedImage === index ? 'border-ink' : 'border-transparent'"
            @click="selectedImage = index"
          >
            <img
              :src="image"
              :alt="`${product.name_en} view ${index + 1}`"
              class="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
              sizes="25vw"
            >
          </button>
        </div>
      </div>

      <div class="lg:sticky lg:top-32 lg:self-start">
        <p class="eyebrow">{{ category?.nameEn ?? product.category }}</p>
        <h1 class="mt-5 text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-5xl">
          {{ product.name_en }}
        </h1>
        <p class="mt-4 text-sm leading-6 text-stone-500">{{ product.name_cn }}</p>

        <div class="mt-8 border-y border-black/15 py-6">
          <div class="flex items-end justify-between gap-8">
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">Display status</p>
              <p class="mt-2 text-xl font-medium">Reference information</p>
            </div>
            <span class="rounded-full bg-stone-100 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-600">
              Display only
            </span>
          </div>
          <p class="mt-5 text-xs leading-6 text-stone-500">
            This page is used to display product images and visible reference
            information. It is intended only for catalog browsing.
          </p>
        </div>

        <div class="mt-7 grid grid-cols-[148px_1fr] gap-5">
          <div class="grid w-[148px] grid-cols-[44px_60px_44px] border border-black/15 bg-white">
            <button
              type="button"
              class="grid h-14 place-items-center border-r border-black/10 text-lg hover:bg-stone-100"
              aria-label="Decrease quantity"
              @click="decreaseAddQuantity"
            >
              -
            </button>
            <label class="sr-only" for="detail-add-quantity">Quantity</label>
            <input
              id="detail-add-quantity"
              :value="addQuantity"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="3"
              class="h-14 w-full min-w-0 bg-transparent px-0 text-center text-base font-medium tabular-nums outline-none"
              aria-label="Quantity to add"
              @input="updateAddQuantity"
            >
            <button
              type="button"
              class="grid h-14 place-items-center border-l border-black/10 text-lg hover:bg-stone-100"
              aria-label="Increase quantity"
              @click="increaseAddQuantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            class="flex h-14 items-center justify-center gap-4 border border-black/15 bg-white px-6 text-xs font-semibold uppercase tracking-[0.18em] hover:border-ink hover:bg-ink hover:text-white"
            @click="addToCollection"
          >
            Add to Collection
            <span v-if="quantityInList" class="rounded-full bg-brass px-2 py-0.5 text-[10px] text-white">
              {{ quantityInList }}
            </span>
          </button>
        </div>

        <div class="mt-10">
          <h2 class="text-xs font-semibold uppercase tracking-[0.18em]">Product details</h2>
          <dl class="mt-4 divide-y divide-black/10 border-t border-black/10 text-sm">
            <div class="flex justify-between gap-6 py-4">
              <dt class="text-stone-500">Category</dt>
              <dd class="text-right font-medium">{{ category?.nameEn ?? product.category }}</dd>
            </div>
            <div v-if="dimensions" class="flex justify-between gap-6 py-4">
              <dt class="text-stone-500">Dimensions</dt>
              <dd class="text-right font-medium">{{ dimensions.lengthCm }} × {{ dimensions.heightCm }} × {{ dimensions.widthCm }} cm</dd>
            </div>
          </dl>
        </div>

        <div class="mt-8 grid grid-cols-2 gap-3">
          <div class="border border-black/10 p-4">
            <AppIcon name="shield" class="h-5 w-5 text-brass" />
            <p class="mt-3 text-xs font-medium">Reference display</p>
          </div>
          <div class="border border-black/10 p-4">
            <AppIcon name="bag" class="h-5 w-5 text-brass" />
            <p class="mt-3 text-xs font-medium">Catalog archive</p>
          </div>
        </div>
      </div>
    </section>

    <section class="border-t border-black/10 bg-white py-20">
      <div class="page-shell">
        <div class="flex items-end justify-between">
          <div>
            <p class="eyebrow">You may also like</p>
            <h2 class="mt-3 text-3xl font-medium">More from the collection</h2>
          </div>
          <NuxtLink to="/products" class="text-xs font-semibold uppercase tracking-widest">View all</NuxtLink>
        </div>
        <div class="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          <ProductCard
            v-for="item in products.filter(item => item.id !== product?.id).slice(0, 4)"
            :key="item.id"
            :product="item"
          />
        </div>
      </div>
    </section>

    <CollectionFloatingButton />
  </div>

  <div v-else class="page-shell grid min-h-[60vh] place-items-center py-24 text-center">
    <div>
      <p class="eyebrow">Product unavailable</p>
      <h1 class="mt-4 text-4xl font-medium">We couldn’t find this item.</h1>
      <NuxtLink to="/products" class="mt-8 inline-flex items-center gap-3 bg-ink px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white">
        Return to catalog <AppIcon name="arrow" class="h-4 w-4" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const {
  products,
  categories,
  total,
  totalPages,
  currentPage,
  loading,
  error,
  loadCategories,
  loadProducts,
} = useCatalog()

const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
const selectedCategory = computed(() =>
  typeof route.query.category === 'string' ? route.query.category : '',
)
const sort = ref('newest')
const mobileFiltersOpen = ref(false)
const showBackToTop = ref(false)

const page = computed(() => Math.max(1, Number(route.query.page) || 1))

const setCategory = (category: string) => {
  router.push({
    query: {
      ...route.query,
      category: category || undefined,
      page: undefined,
    },
  })
  mobileFiltersOpen.value = false
}

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, value => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    router.replace({
      query: { ...route.query, q: value || undefined, page: undefined },
    })
  }, 300)
})

watch(sort, () => {
  router.replace({ query: { ...route.query, sort: sort.value, page: undefined } })
})

const reloadProducts = () =>
  loadProducts({
    page: page.value,
    pageSize: 24,
    category: selectedCategory.value,
    q: typeof route.query.q === 'string' ? route.query.q : '',
    sort: route.query.sort === 'name' ? 'name' : 'newest',
  })

watch(
  [selectedCategory, () => route.query.q, () => route.query.sort, page],
  reloadProducts,
  { immediate: true },
)

const setPage = (value: number) => {
  router.push({ query: { ...route.query, page: value > 1 ? value : undefined } })
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const updateBackToTop = () => {
  showBackToTop.value = window.scrollY > 480
}

onMounted(() => {
  loadCategories()
  updateBackToTop()
  window.addEventListener('scroll', updateBackToTop, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTop)
})

useSeoMeta({
  title: 'Luxury Women Bags Display Catalog',
  description: 'Browse an organized display catalog by brand and product reference.',
})
</script>

<template>
  <div>
    <section class="border-b border-black/10 bg-[#e5e0d6]">
      <div class="page-shell py-14 sm:py-20">
        <div class="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p class="eyebrow">Display collection</p>
            <h1 class="mt-4 text-5xl font-medium tracking-[-0.04em] sm:text-6xl">
              Women’s bags
            </h1>
            <p class="mt-5 max-w-xl text-sm leading-7 text-stone-600">
              A curated visual catalog organized by brand. Select a product to
              view reference images and visible specification details.
            </p>
          </div>
          <div class="flex items-center gap-3 text-xs text-stone-500">
            <AppIcon name="shield" class="h-5 w-5 text-brass" />
            Display catalog · Updated regularly
          </div>
        </div>
      </div>
    </section>

    <div class="page-shell py-10">
      <div class="flex items-center gap-3 border-b border-black/15 pb-6">
        <label class="relative flex-1">
          <AppIcon name="search" class="absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            v-model="search"
            type="search"
            placeholder="Search by product or model"
            class="w-full bg-transparent py-3 pl-8 pr-4 text-sm outline-none placeholder:text-stone-400"
          >
        </label>
        <button
          class="border border-black/20 px-4 py-3 text-xs font-semibold uppercase tracking-wider lg:hidden"
          @click="mobileFiltersOpen = !mobileFiltersOpen"
        >
          Filters
        </button>
        <select v-model="sort" class="hidden bg-transparent py-3 text-xs font-semibold uppercase tracking-wider outline-none sm:block">
          <option value="newest">Newest first</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <div class="grid gap-10 pt-8 lg:grid-cols-[220px_1fr]">
        <aside :class="[mobileFiltersOpen ? 'block' : 'hidden', 'lg:block']">
          <div class="sticky top-28">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold uppercase tracking-[0.18em]">Brands</p>
              <button v-if="selectedCategory" class="text-[10px] uppercase tracking-wider text-stone-500" @click="setCategory('')">
                Clear
              </button>
            </div>
            <div class="mt-5 space-y-1">
              <button
                class="flex w-full items-center justify-between border-b border-black/10 py-3 text-left text-sm"
                :class="!selectedCategory ? 'font-semibold text-brass' : 'text-stone-600 hover:text-ink'"
                @click="setCategory('')"
              >
                All brands
                <span class="text-[10px]">{{ total }}</span>
              </button>
              <button
                v-for="category in categories"
                :key="category.slug"
                class="flex w-full items-center justify-between border-b border-black/10 py-3 text-left text-sm"
                :class="selectedCategory === category.slug ? 'font-semibold text-brass' : 'text-stone-600 hover:text-ink'"
                @click="setCategory(category.slug)"
              >
                {{ category.nameEn }}
                <span class="text-[10px]">{{ category.count }}</span>
              </button>
            </div>
            <div class="mt-9 bg-white p-5">
              <AppIcon name="bag" class="h-6 w-6 text-brass" />
              <p class="mt-4 text-sm font-medium">Catalog note</p>
              <p class="mt-2 text-xs leading-5 text-stone-500">
                All entries are shown for information display and visual reference only.
              </p>
            </div>
          </div>
        </aside>

        <section>
          <div class="mb-6 flex items-center justify-between text-xs text-stone-500">
            <p><strong class="font-semibold text-ink">{{ total }}</strong> products</p>
            <p v-if="selectedCategory">Filtered collection</p>
          </div>
          <div v-if="loading" class="grid min-h-80 place-items-center text-sm text-stone-500">
            Loading products…
          </div>
          <div v-else-if="error" class="grid min-h-80 place-items-center border border-dashed border-red-200 bg-red-50/50 text-center">
            <div>
              <p class="font-medium text-red-800">{{ error }}</p>
              <button class="mt-4 border border-red-300 px-5 py-3 text-xs text-red-800" @click="reloadProducts">
                Retry
              </button>
            </div>
          </div>
          <div v-else-if="products.length" class="grid grid-cols-2 gap-x-4 gap-y-10 xl:grid-cols-3 xl:gap-x-6">
            <ProductCard v-for="product in products" :key="product.id" :product="product" />
          </div>
          <nav v-if="totalPages > 1" class="mt-12 flex items-center justify-center gap-4" aria-label="Catalog pagination">
            <button
              class="border border-black/15 px-5 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="currentPage <= 1"
              @click="setPage(currentPage - 1)"
            >
              Previous
            </button>
            <span class="text-xs text-stone-500">{{ currentPage }} / {{ totalPages }}</span>
            <button
              class="border border-black/15 px-5 py-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="currentPage >= totalPages"
              @click="setPage(currentPage + 1)"
            >
              Next
            </button>
          </nav>
          <div v-else class="grid min-h-80 place-items-center border border-dashed border-black/20 text-center">
            <div>
              <AppIcon name="search" class="mx-auto h-8 w-8 text-stone-400" />
              <p class="mt-4 font-medium">No matching products</p>
              <p class="mt-2 text-sm text-stone-500">Try another brand or search term.</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <button
      v-show="showBackToTop"
      type="button"
      aria-label="Back to top"
      class="fixed bottom-6 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-white/70 bg-ink text-white shadow-soft transition hover:bg-brass md:bottom-8 md:right-8"
      @click="scrollToTop"
    >
      <AppIcon name="chevron" class="h-5 w-5 -rotate-90" />
    </button>
    <CollectionFloatingButton />
  </div>
</template>

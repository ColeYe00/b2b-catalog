<script setup lang="ts">
const { products, categories, loadCategories, loadProducts } = useCatalog()
const featuredProducts = computed(() => products.value.slice(0, 4))

onMounted(() => {
  loadCategories()
  loadProducts({ pageSize: 12 })
})

useSeoMeta({
  title: 'Atelier Gallery — Luxury Women Bags Display Catalog',
  description: 'A curated display catalog of luxury women bag references.',
})
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-black/10">
      <div class="page-shell grid min-h-[720px] items-center gap-12 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:py-0">
        <div class="relative z-10 py-8 lg:pr-10">
          <p class="eyebrow">Private display collection · 2026</p>
          <h1 class="mt-6 max-w-xl text-5xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-7xl lg:text-[86px]">
            Curated for<br>
            <em class="font-serif font-normal text-brass">visual reference.</em>
          </h1>
          <p class="mt-7 max-w-lg text-base leading-7 text-stone-600">
            Browse a focused catalog of luxury women’s bag references, organized
            by brand, style and collection information for display use only.
          </p>
          <div class="mt-9 flex flex-wrap items-center gap-4">
            <NuxtLink to="/products" class="group flex items-center gap-5 bg-ink px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-brass">
              Explore catalog
              <AppIcon name="arrow" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </NuxtLink>
            <a href="#display-guide" class="border-b border-ink py-2 text-xs font-semibold uppercase tracking-[0.15em]">
              Display guide
            </a>
          </div>
          <div class="mt-14 grid max-w-lg grid-cols-3 divide-x divide-black/15 border-t border-black/15 pt-6">
            <div>
              <strong class="block text-2xl font-medium">19</strong>
              <span class="mt-1 block text-[10px] uppercase tracking-widest text-stone-500">Categories</span>
            </div>
            <div class="pl-6">
              <strong class="block text-2xl font-medium">10k+</strong>
              <span class="mt-1 block text-[10px] uppercase tracking-widest text-stone-500">References</span>
            </div>
            <div class="pl-6">
              <strong class="block text-2xl font-medium">Visual</strong>
              <span class="mt-1 block text-[10px] uppercase tracking-widest text-stone-500">Catalog</span>
            </div>
          </div>
        </div>

        <div class="relative h-[540px] lg:h-[650px]">
          <div class="absolute inset-0 bg-[#ddd8cf]" />
          <img
            :src="products[0]?.images[0]"
            alt="Featured luxury handbag"
            class="absolute inset-0 h-full w-full object-cover"
          >
          <div class="absolute bottom-0 left-0 bg-ivory px-6 py-5 sm:min-w-64">
            <p class="eyebrow">Featured edit</p>
            <p class="mt-2 text-sm font-medium">{{ products[0]?.name_en }}</p>
          </div>
          <div class="absolute right-5 top-5 grid h-20 w-20 place-items-center rounded-full border border-white/60 bg-white/20 text-center text-[9px] font-semibold uppercase tracking-widest text-white backdrop-blur">
            Display<br>only
          </div>
        </div>
      </div>
    </section>

    <section class="page-shell py-24">
      <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p class="eyebrow">Browse by house</p>
          <h2 class="mt-4 text-4xl font-medium tracking-tight sm:text-5xl">Distinctive brands,<br>clearly organized.</h2>
        </div>
        <NuxtLink to="/products" class="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em]">
          View all categories <AppIcon name="arrow" class="h-4 w-4" />
        </NuxtLink>
      </div>
      <div class="mt-14 grid border-l border-t border-black/15 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="(category, index) in categories"
          :key="category.slug"
          :to="`/products?category=${category.slug}`"
          class="group flex min-h-44 flex-col justify-between border-b border-r border-black/15 p-7 hover:bg-white"
        >
          <div class="flex items-start justify-between">
            <span class="text-xs text-stone-400">0{{ index + 1 }}</span>
            <AppIcon name="arrow" class="h-5 w-5 -rotate-45 transition-transform group-hover:rotate-0" />
          </div>
          <div>
            <h3 class="text-2xl font-medium">{{ category.nameEn }}</h3>
            <p class="mt-2 text-xs text-stone-500">{{ category.nameCn }} · {{ category.count.toLocaleString() }} items</p>
          </div>
        </NuxtLink>
      </div>
    </section>

    <section class="bg-white py-24">
      <div class="page-shell">
        <div class="flex items-end justify-between">
          <div>
            <p class="eyebrow">Latest additions</p>
            <h2 class="mt-4 text-4xl font-medium tracking-tight">Recently updated references</h2>
          </div>
          <NuxtLink to="/products" class="hidden text-xs font-semibold uppercase tracking-widest sm:block">Browse all</NuxtLink>
        </div>
        <div class="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
        </div>
      </div>
    </section>

    <section id="display-guide" class="page-shell py-24">
      <div class="grid overflow-hidden bg-[#ded8cc] lg:grid-cols-2">
        <div class="p-8 sm:p-14">
          <p class="eyebrow">Catalog guide</p>
          <h2 class="mt-5 max-w-md text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
            Simple browsing,<br>clear product references.
          </h2>
          <p class="mt-6 max-w-md text-sm leading-7 text-stone-600">
            Use the catalog to review images, names, categories and visible
            specifications. The website is a reference display and does not
            include commercial functions.
          </p>
        </div>
        <div class="grid divide-y divide-black/15 border-t border-black/15 lg:border-l lg:border-t-0">
          <div v-for="(step, index) in ['Choose a brand', 'Review item details', 'Save reference information']" :key="step" class="flex items-center gap-6 p-8">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/30 text-xs">0{{ index + 1 }}</span>
            <div>
              <p class="font-medium">{{ step }}</p>
              <p class="mt-1 text-xs text-stone-500">{{ ['Filter the catalog by brand category', 'Check images and specifications', 'Use the information as visual reference only'][index] }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="notice" class="border-t border-black/10 bg-white py-14">
      <div class="page-shell">
        <p class="eyebrow">Important notice</p>
        <p class="mt-4 max-w-3xl text-sm leading-7 text-stone-600">
          This website is used only as a product information display catalog.
          Brand names and images are shown for identification and reference.
          The pages are intended only for visual browsing and information reference.
        </p>
      </div>
    </section>
  </div>
</template>

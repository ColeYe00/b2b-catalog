<script setup lang="ts">
const route = useRoute()
const menuOpen = ref(false)
const { totalCount, hydrate } = useCollectionList()

watch(() => route.fullPath, () => {
  menuOpen.value = false
})

onMounted(hydrate)
</script>

<template>
  <div class="min-h-screen bg-ivory text-ink">
    <div class="bg-ink px-5 py-2 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">
      Curated display catalog · Reference images · Product information
    </div>

    <header class="sticky top-0 z-50 border-b border-black/10 bg-ivory/95 backdrop-blur">
      <div class="page-shell flex h-[74px] items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-3" aria-label="Atelier Gallery home">
          <span class="grid h-9 w-9 place-items-center rounded-full border border-ink">
            <AppIcon name="bag" class="h-[18px] w-[18px]" />
          </span>
          <span>
            <strong class="block text-[15px] tracking-[0.16em]">ATELIER GALLERY</strong>
            <span class="block text-[8px] uppercase tracking-[0.28em] text-stone-500">Product Display Catalog</span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-9 text-xs font-semibold uppercase tracking-[0.13em] md:flex">
          <NuxtLink to="/" class="hover:text-brass">Home</NuxtLink>
          <NuxtLink to="/products" class="hover:text-brass">Catalog</NuxtLink>
          <NuxtLink to="/list" class="relative hover:text-brass">
            Collection
            <span v-if="totalCount" class="absolute -right-5 -top-3 grid h-4 min-w-4 place-items-center rounded-full bg-brass px-1 text-[9px] text-white">
              {{ totalCount }}
            </span>
          </NuxtLink>
          <NuxtLink to="/guide" class="hover:text-brass">Guide</NuxtLink>
          <NuxtLink to="/notice" class="hover:text-brass">Notice</NuxtLink>
        </nav>

        <div class="hidden items-center gap-3 md:flex">
          <button class="flex items-center gap-2 px-3 py-2 text-xs font-medium">
            <AppIcon name="globe" class="h-4 w-4" />
            EN
          </button>
          <NuxtLink to="/products" class="bg-ink px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-brass">
            Browse catalog
          </NuxtLink>
        </div>

        <button class="p-2 md:hidden" aria-label="Toggle menu" @click="menuOpen = !menuOpen">
          <AppIcon name="menu" class="h-6 w-6" />
        </button>
      </div>

      <div v-if="menuOpen" class="border-t border-black/10 bg-ivory px-5 py-5 md:hidden">
        <nav class="flex flex-col gap-4 text-sm font-semibold uppercase tracking-wider">
          <NuxtLink to="/">Home</NuxtLink>
          <NuxtLink to="/products">Catalog</NuxtLink>
          <NuxtLink to="/list">Collection<span v-if="totalCount"> · {{ totalCount }}</span></NuxtLink>
          <NuxtLink to="/guide">Guide</NuxtLink>
          <NuxtLink to="/notice">Notice</NuxtLink>
        </nav>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="border-t border-white/10 bg-ink text-white">
      <div class="page-shell grid gap-10 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p class="text-lg font-semibold tracking-[0.16em]">ATELIER GALLERY</p>
          <p class="mt-4 max-w-sm text-sm leading-6 text-white/55">
            A curated visual catalog for browsing fashion product references,
            organized by brand and collection for display purposes only.
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Explore</p>
          <div class="mt-4 flex flex-col gap-3 text-sm text-white/75">
            <NuxtLink to="/products">All products</NuxtLink>
            <NuxtLink to="/products?category=lv-women-bags">Louis Vuitton</NuxtLink>
            <NuxtLink to="/products?category=chanel-women-bags">Chanel</NuxtLink>
          </div>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Catalog notes</p>
          <div class="mt-4 space-y-3 text-sm text-white/75">
            <p>Reference display only</p>
            <p>Images and names for identification</p>
            <p>No online transaction service</p>
          </div>
        </div>
      </div>
      <div class="border-t border-white/10 py-5 text-center text-[10px] uppercase tracking-[0.18em] text-white/35">
        © 2026 Atelier Gallery. Display catalog only.
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { totalCount, hydrate } = useCollectionList()

onMounted(hydrate)
</script>

<template>
  <NuxtLink
    to="/list"
    aria-label="Open collection list"
    class="fixed bottom-20 right-5 z-40 flex items-center gap-3 rounded-full border border-white/70 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink shadow-soft transition hover:bg-ink hover:text-white md:bottom-24 md:right-8"
  >
    <AppIcon name="bag" class="h-4 w-4" />
    <span class="hidden sm:inline">Collection</span>
    <span class="grid h-5 min-w-5 place-items-center rounded-full bg-brass px-1.5 text-[10px] text-white">
      {{ totalCount }}
    </span>
  </NuxtLink>
</template>

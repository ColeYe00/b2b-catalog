<script setup lang="ts">
import type { CatalogProduct } from '~/types/catalog'

const props = defineProps<{
  product: CatalogProduct
}>()

const { addItem, getQuantity, hydrate } = useCollectionList()
const addQuantity = ref(1)

const categoryLabel = computed(() =>
  props.product.category
    .replace('-women-bags', '')
    .replaceAll('-', ' ')
    .toUpperCase(),
)
const quantityInList = computed(() => getQuantity(props.product.id))

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
  addItem(props.product.id, normalizeAddQuantity(addQuantity.value))
}

onMounted(hydrate)
</script>

<template>
  <article class="group block [content-visibility:auto] [contain-intrinsic-size:320px_520px]">
    <NuxtLink :to="`/products/${encodeURIComponent(product.id)}`" class="block">
      <div class="relative aspect-[4/5] overflow-hidden bg-[#eeece5]">
        <img
          v-if="product.images[0]"
          :src="product.images[0]"
          :alt="product.name_en"
          class="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]"
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1280px) 28vw, (min-width: 1024px) 40vw, 50vw"
        >
        <div class="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between bg-ink/90 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-transform duration-300 group-hover:translate-y-0">
          View reference
          <AppIcon name="arrow" class="h-4 w-4" />
        </div>
      </div>
      <div class="pt-4">
        <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-brass">
          {{ categoryLabel }}
        </p>
        <h3 class="mt-2 line-clamp-1 text-[15px] font-medium text-ink">
          {{ product.name_en }}
        </h3>
        <div class="mt-2 flex items-center justify-between text-xs text-stone-500">
          <span>{{ product.status === 'active' ? 'Available to view' : 'Archived' }}</span>
          <span class="font-medium text-ink">Display only</span>
        </div>
      </div>
    </NuxtLink>

    <div class="mt-4 grid grid-cols-[124px_1fr] gap-3">
      <div class="grid w-[124px] grid-cols-[36px_52px_36px] border border-black/15 bg-white/70">
        <button
          type="button"
          class="grid h-11 place-items-center border-r border-black/10 text-base hover:bg-stone-100"
          aria-label="Decrease quantity"
          @click="decreaseAddQuantity"
        >
          -
        </button>
        <label class="sr-only" :for="`quantity-${product.id}`">Quantity</label>
        <input
          :id="`quantity-${product.id}`"
          :value="addQuantity"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="3"
          class="h-11 w-full min-w-0 bg-transparent px-0 text-center text-sm font-medium tabular-nums outline-none"
          aria-label="Quantity to add"
          @input="updateAddQuantity"
        >
        <button
          type="button"
          class="grid h-11 place-items-center border-l border-black/10 text-base hover:bg-stone-100"
          aria-label="Increase quantity"
          @click="increaseAddQuantity"
        >
          +
        </button>
      </div>
      <button
        type="button"
        class="flex h-11 items-center justify-center gap-2 border border-black/15 bg-white/70 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition hover:border-ink hover:bg-ink hover:text-white"
        @click="addToCollection"
      >
        Add to Collection
        <span v-if="quantityInList" class="rounded-full bg-brass px-2 py-0.5 text-[10px] text-white">
          {{ quantityInList }}
        </span>
      </button>
    </div>
  </article>
</template>

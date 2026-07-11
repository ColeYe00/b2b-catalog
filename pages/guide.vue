<script setup lang="ts">
useSeoMeta({
  title: 'Catalog Guide - Atelier Gallery',
  description: 'How to browse and use the Atelier Gallery display catalog.',
})
</script>

<template>
  <div>
    <section class="border-b border-black/10 bg-white">
      <div class="page-shell py-20">
        <p class="eyebrow">Catalog guide</p>
        <h1 class="mt-5 max-w-3xl text-5xl font-medium leading-tight tracking-tight">
          Browse product references with a simple, focused workflow.
        </h1>
      </div>
    </section>

    <section class="page-shell py-20">
      <div class="grid gap-6 md:grid-cols-3">
        <div class="border border-black/15 p-7">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">01</span>
          <h2 class="mt-5 text-2xl font-medium">Choose a Brand</h2>
          <p class="mt-4 text-sm leading-7 text-stone-600">
            Start from the catalog page and filter by brand category to narrow the item list.
          </p>
        </div>
        <div class="border border-black/15 p-7">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">02</span>
          <h2 class="mt-5 text-2xl font-medium">Review Details</h2>
          <p class="mt-4 text-sm leading-7 text-stone-600">
            Open an item to review images, visible model information, size text, and catalog notes.
          </p>
        </div>
        <div class="border border-black/15 p-7">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">03</span>
          <h2 class="mt-5 text-2xl font-medium">Save a Collection</h2>
          <p class="mt-4 text-sm leading-7 text-stone-600">
            Add useful references to Collection. The saved list stays in this browser.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

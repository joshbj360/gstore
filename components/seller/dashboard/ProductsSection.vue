<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium">Your Products</h2>
      <NuxtLink to="/upload" class="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/80">
        Add Product
      </NuxtLink>
    </div>
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      <NuxtLink v-for="product in products" :key="product.id" :product="product" :to="`/product/${product.slug}`"
        class="block w-full aspect-square relative overflow-hidden">
        <MediaDisplayCard :product-media="product.media?.[0]"
          class="w-full h-full transition-transform duration-300 group-hover:scale-105" />
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import MediaDisplayCard from '~/components/product/productCard/MediaDisplayCard.vue';
import type { IProduct } from '~/models';


defineProps<{ products: IProduct[] }>();
</script>
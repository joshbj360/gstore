<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium">Your Products</h2>
      <NuxtLink to="/upload" class="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/80">
        Add Product
      </NuxtLink>
    </div>
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProductCard from '~/components/product/productCard/ProductCard.vue';

defineProps<{ products: any[] }>();
</script>
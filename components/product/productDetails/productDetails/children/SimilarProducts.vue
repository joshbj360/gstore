<template>
  <!-- This component now assumes the data is already loaded and passed in as a prop. -->
  <div v-if="activeTab === 'similar'" class="p-6 md:p-8">
    <h2 class="text-xl font-semibold mb-4">You Might Also Like</h2>

    <!-- Empty State -->
    <div v-if="!products || products.length === 0" class="text-center py-12 text-gray-500">
      <Icon name="mdi/package-variant-closed-remove" size="48" class="mx-auto mb-4" />
      <p>No similar products found.</p>
    </div>
    
    <!-- Product Grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      <ProductCard 
        v-for="product in products"
        :key="product.id"
        :product="product"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { IProduct } from '@/models';
import ProductCard from '~/components/product/productCard/ProductCard.vue';

// The component is now much simpler. It just accepts the data it needs to display.
const props = defineProps<{
  activeTab: 'details' | 'similar' | 'seller';
  products: IProduct[];
}>();
</script>
<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-medium">Your Products</h2>
      <NuxtLink to="/upload" class="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand/80">
        Add Product
      </NuxtLink>
    </div>
    <div class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      <ProductCard v-for="product in products" :key="product.id" :product="product" @share="openShareModal" />
    </div>
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <SocialMediaPost :product="selectedProduct" />
        <button @click="closeShareModal" class="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-lg">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import SocialMediaPost from './SocialMediaPost.vue';
import type { ProductInterface } from '~/models/interface/products/product.interface';

defineProps<{ products: any[] }>();

const showModal = ref(false);
const selectedProduct = ref<ProductInterface | null>(null);

const openShareModal = (product: ProductInterface) => {
  selectedProduct.value = product;
  showModal.value = true;
};

const closeShareModal = () => {
  showModal.value = false;
  selectedProduct.value = null;
};
</script>

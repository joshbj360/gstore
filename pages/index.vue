<template>
  <MainLayout>
    <div class="pt-[100px] md:pt-[80px] w-full">
      <!-- 
        THE NEW FETCH-FIRST PATTERN:
        - Shows a skeleton while the initial data is pending.
        - Shows an error message if the fetch fails.
        - Only renders the ProductLayout AFTER the data is successfully loaded into the store.
      -->
      <div v-if="pending">
        <ProductGridSkeleton />
      </div>
      <div v-else-if="error">
        <p class="text-center text-red-500 p-8">Failed to load products. Please try again later.</p>
        <p>{{ error.message}}</p>
      </div>
      <ProductLayout v-else />
    </div>
  </MainLayout>
</template>

<script lang="ts" setup>
import { useProductStore } from '~/stores';
import MainLayout from '@/layouts/MainLayout.vue';
import ProductLayout from '@/layouts/ProductLayout.vue';
import ProductGridSkeleton from '@/components/skeletons/ProductGridSkeleton.vue';

const productStore = useProductStore();

// This is the core of the optimization. `useAsyncData` fetches the data on the server
// (or on the client during navigation) BEFORE the page is rendered.
// It calls the store action to populate the product cache.
const { pending, error } = await useAsyncData(
  'initial-products',
  async () => {
      // It's important to clear any previous category filters when visiting the homepage.
      productStore.setCategoryFilter(null);
      // This action is idempotent; it only fetches if the store is empty.
      return productStore.ensureInitialProductsLoaded();
  }
);
</script>
<template>
  <MainLayout>
    <div class="pt-5 md:pt-5">
      <!-- The Skeleton Loader is shown while the initial data is pending -->
      <CategoryPageSkeleton v-if="pending" />

      <!-- The Error state is shown if the fetch fails -->
      <div v-else-if="error" class="text-center py-20">
        <h2 class="text-2xl font-bold text-red-500">Error Loading Category</h2>
        <p class="text-gray-500 mt-2">{{ error.data|| 'The category could not be found.' }}</p>
        <NuxtLink to="/" class="mt-4 inline-block text-[#f02c56] hover:underline">
          Return to Homepage
        </NuxtLink>
      </div>

      <!-- The real content is only rendered AFTER data has successfully arrived -->
      <div v-else-if="categoryDetails">
        <!-- Category Header -->
        <div class="bg-white rounded-xl shadow-sm p-4 mb-8 text-center max-w-6xl mx-auto">
          <h1 class="text-3xl font-bold text-gray-900">{{ categoryDetails.name }}</h1>
          <!-- <p v-if="categoryDetails.description" class="text-gray-600 mt-2 max-w-2xl mx-auto">
            {{ categoryDetails.description }}
          </p> -->
        </div>

        <!-- Product Grid -->
        <ProductLayout />
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore, useCategoryStore } from '~/stores';

// Component Imports
import MainLayout from '@/layouts/MainLayout.vue';
import ProductLayout from '@/layouts/ProductLayout.vue';
import CategoryPageSkeleton from '~/components/skeletons/CategoryPageSkeleton.vue';

const route = useRoute();
const productStore = useProductStore();
const categoryStore = useCategoryStore();
const slug = route.params.slug as string;

// This is the core of the optimization. `useAsyncData` fetches the data
// BEFORE the page is rendered, eliminating the lag.
const { pending, error } = await useAsyncData(
  `category-products-${slug}`,
  async () => {
    // We fetch categories and products in parallel for maximum speed
    await Promise.all([
      categoryStore.fetchCategories(), // Ensures category details are available
      productStore.ensureCategoryProductsLoaded(slug)
    ]);
  },
  { watch: [() => route.params.slug] } // Re-fetches if the slug changes
);

// These computed properties now reactively read the pre-fetched data from the stores
const categoryDetails = computed(() => {
  return categoryStore.categories.find(c => c.slug === slug) || null;
});

// The ProductLayout component will automatically use the `activeProductList` getter,
// which is now filtered by the `currentCategorySlug` set in the store.
</script>

<template>
  <MainLayout>
    <div class="pt-5 md:pt-5">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-20">
        <LoadingSpinner />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="text-center py-20">
        <h2 class="text-2xl font-bold text-red-500">Error Loading Category</h2>
        <p class="text-gray-500 mt-2">{{ error }}</p>
        <NuxtLink to="/" class="mt-4 inline-block text-[#f02c56] hover:underline">
          Return to Homepage
        </NuxtLink>
      </div>

      <!-- Main Content -->
      <div v-else-if="categoryDetails">
        <!-- Category Header -->
        <div class="bg-white rounded-xl shadow-sm p-4 mb-8 text-center">
          <h1 class="text-3xl font-bold text-gray-900">{{ categoryDetails.name }}</h1>
          <p v-if="categoryDetails.description" class="text-gray-600 mt-2 max-w-2xl mx-auto">
            {{ categoryDetails.description }}
          </p>
        </div>

        <!-- Product Grid -->
        <div class="w-full max-w-7xl mx-auto px-1 sm:px-0">
            <!-- The grid now gets its products from the computed property linked to the store -->
            <div v-if="products.length > 0" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
                <ProductCard v-for="product in products" :key="product.id" :product="product" />
            </div>
            <div v-else class="text-center py-12">
                <Icon name="mdi:package-variant-closed-remove" size="48" class="mx-auto text-gray-300 mb-4" />
                <p class="text-gray-500">No products found in this category yet.</p>
            </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import type { CategoryInterface, ProductInterface } from '~/models/interface/products';
import { useProductStore, useCategoryStore } from '~/stores';

// Component Imports
import MainLayout from '@/layouts/MainLayout.vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import LoadingSpinner from '~/components/shared/Loading.vue';

const route = useRoute();
const productStore = useProductStore();
const categoryStore = useCategoryStore();

const isLoading = ref(true);
const error = ref<string | null>(null);

// This computed property now gets the category details directly from the category store's cache
const categoryDetails = computed(() => {
    const slug = route.params.slug as string;
    return categoryStore.categories.find(c => c.slug === slug) || null;
});

// This computed property gets the products for the current category directly from the product store's cache
const products = computed(() => {
    if (categoryDetails.value) {
        return productStore.getProductsByCategory(categoryDetails.value.slug);
    }
    return [];
});

const fetchCategoryData = async (slug: string) => {
  isLoading.value = true;
  error.value = null;
  try {
    // Ensure categories are loaded
    await categoryStore.fetchCategories();


    if (slug) {
        // Tell the product store to filter by this category.
        // The store will handle fetching from the API only if needed.
        await productStore.filterByCategory(slug);
    } else {
        throw new Error('Category not found.');
    }

  } catch (e: any) {
    error.value = e.message || 'Could not find the requested category.';
  } finally {
    isLoading.value = false;
  }
};

// Watch for changes to the route slug and fetch data accordingly
watch(
  () => route.params.slug,
  (newSlug) => {
    if (newSlug && typeof newSlug === 'string') {
      fetchCategoryData(newSlug);
    }
  },
  { immediate: true }
);
</script>

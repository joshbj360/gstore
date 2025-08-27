<template>
  <div class="w-full max-w-6xl mx-auto px-1 sm:px-0" id="ProductLayout">
    <!-- Loader -->
    <div v-if="productStore.isLoading && !initialLoadComplete" class="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
      <Loading class="h-12 w-12 text-[#C42B78]" />
    </div>

    <!-- Error Message -->
    <div v-if="error" class="p-2 mx-1 mb-2 bg-red-50 text-red-600 rounded-lg text-sm">
      {{ error }}
    </div>

    <!-- Product Grid -->
    <div v-if="!emptyState" id="product-grid" class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-1 sm:gap-2 p-1">
      <div 
        v-for="product in displayedProducts" 
        :key="product.id"
        class="animate-fade-in"
      >
        <ProductCard :product="product" class="h-full" />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="emptyState" class="flex flex-col items-center justify-center py-8 px-2 text-center">
      <Icon name="mdi:package-variant-remove" class="h-10 w-10 text-gray-400 mb-2" />
      <p class="text-gray-600 font-medium text-sm">{{ emptyStateMessage }}</p>
      <button
        @click="initializeData"
        class="mt-3 text-[#C42B78] text-sm hover:underline"
      >
        Try Again
      </button>
    </div>

    <!-- Load More Button -->
    <div v-if="showLoadMore" class="mt-4 mb-6 text-center px-1">
      <button
        @click="loadMore"
        :disabled="productStore.isLoading"
        class="inline-flex items-center justify-center px-5 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-full shadow-sm text-white bg-[#C42B78] hover:bg-[#df4949] focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
      >
        <span v-if="!productStore.isLoading">Load More</span>
        <span v-else class="flex items-center">
          <Loading class="h-3 w-3 mr-1 sm:mr-2 sm:h-4 sm:w-4" />
          Loading...
        </span>
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useProductStore } from '#build/imports';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import Loading from '~/components/shared/Loading.vue';
import { useRoute } from 'vue-router';

const productStore = useProductStore();
const route = useRoute();

// State
const initialLoadComplete = ref(false);
const error = ref<string | null>(null);

// Computed
const displayedProducts = computed(() => {
  return productStore.getProductsByCategory(productStore.currentCategory) || [];
});

const showLoadMore = computed(() => {
  return displayedProducts.value.length > 0 && !error.value && productStore.hasMoreProducts;
});

const emptyState = computed(() => {
  return !productStore.isLoading && displayedProducts.value.length === 0;
});

const emptyStateMessage = computed(() => {
  return productStore.currentCategory 
    ? `No products found in ${productStore.currentCategory} category`
    : 'No products found';
});

// Watch for category changes in the URL
watch(
  () => route.query.category,
  async (newCategory) => {
    const categoryName = newCategory as string | null;
    try {
      error.value = null;
      if (categoryName) {
        // If there's a category in the URL, apply the filter
        await productStore.filterByCategory(categoryName);
      } else {
        // If there's NO category in the URL, clear the filter
        productStore.clearCategoryFilter();
      }
    } catch (err) {
      error.value = 'Failed to filter products by category.';
      console.error('Category filter error:', err);
    }
  },
  { immediate: true } // immediate: true ensures this runs on initial load
);


// Initial data load function
async function initializeData() {
  try {
    error.value = null;
    // Initialize will fetch all products if the store is empty
    await productStore.initialize();
  } catch (err) {
    error.value = 'Failed to load products. Please try again.';
    console.error('Initialization error:', err);
  } finally {
    initialLoadComplete.value = true;
  }
}

// Load More
const loadMore = async () => {
  try {
    error.value = null;
    await productStore.fetchMoreProducts();
  } catch (err) {
    error.value = 'Failed to load more products.';
    console.error('Load more error:', err);
  }
};

// Only run initializeData on mount if the products aren't already loaded.
// The watcher will handle the category filtering.
onMounted(() => {
    if (productStore.products.length === 0) {
        initializeData();
    } else {
        initialLoadComplete.value = true;
    }
});
</script>>

<style>
/* Animation for grid items */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out forwards;
}

/* Mobile-specific adjustments */
@media (max-width: 412px) {
  #product-grid {
    gap: 0.25rem;
  }
  
  #ProductLayout {
    padding-left: 0.25rem;
    padding-right: 0.25rem;
  }
  
  .animate-fade-in {
    animation-duration: 0.2s;
  }
}

/* Tablet adjustments */
@media (min-width: 413px) and (max-width: 768px) {
  #product-grid {
    gap: 0.5rem;
  }
}
</style>
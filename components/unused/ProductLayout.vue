<template>
  <div class="w-full" id="ProductLayout">
    <!-- The grid now gets its data directly from the store's reactive getter -->
    <div v-if="displayedProducts.length > 0" id="product-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
      <div 
        v-for="product in displayedProducts" 
        :key="product.slug"
        class="animate-fade-in"
      >
        <ProductCard :product="product" class="h-full" />
      </div>
    </div>

    <!-- Empty State (only shows if the list is truly empty after loading) -->
    <div v-else-if="!productStore.isLoading" class="flex flex-col items-center justify-center py-20 text-center">
      <Icon name="mdi:package-variant-remove" class="h-12 w-12 text-gray-400 mb-4" />
      <p class="text-gray-600 font-medium">{{ emptyStateMessage }}</p>
    </div>

    <!-- Infinite Scroll Trigger -->
    <div ref="loadMoreTrigger" class="h-1 w-full mt-8"></div>
    <div v-if="productStore.isLoading && displayedProducts.length > 0" class="flex justify-center py-8">
        <Loading class="h-8 w-8 text-brand" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useProductStore } from '~/stores';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import Loading from '~/components/shared/Loading.vue';
import { LazySkeletonsProductGridSkeleton } from '#components';

const productStore = useProductStore();

const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// This component is now "dumb". It just reads the active product list from the store.
const displayedProducts = computed(() => productStore.activeProductList);

const emptyStateMessage = computed(() => {
  return productStore.currentCategorySlug
    ? `No products found in this category.`
    : 'No products available at the moment.';
});

const loadMore = async () => {
  if (productStore.isLoading || !productStore.hasMoreProducts) return;
  await productStore.fetchMoreProducts();
};

// Set up the IntersectionObserver for infinite scroll
onMounted(() => {
    const options = { root: null, rootMargin: '200px', threshold: 0.1 };
    observer.value = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            loadMore();
        }
    }, options);
    
    if (loadMoreTrigger.value) {
        observer.value.observe(loadMoreTrigger.value);
    }
});

onUnmounted(() => {
    if(observer.value) {
        observer.value.disconnect();
    }
});
</script>

<style>
@keyframes fadeIn {
 from { opacity: 0; transform: translateY(10px); }
 to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
 animation: fadeIn 0.3s ease-out forwards;
}
</style>
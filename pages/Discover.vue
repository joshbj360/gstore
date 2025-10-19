<template>
  <HomeLayout>
    <div class="min-h-screen bg-gray-50">
      <!-- Discover Header -->
      <section class="text-center py-8 mb-8 bg-white shadow-sm rounded-b-2xl">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Discover More</h1>
        <p class="text-gray-600 max-w-xl mx-auto">
          Explore thousands of curated products from our top sellers, grouped by category and style.
        </p>

        <!-- Category Filters -->
        <div v-if="!categoriesPending" class="mt-6 flex flex-wrap justify-center gap-2">
          <button @click="selectCategory('all')" :class="['category-button', currentCategorySlug === 'all' ? 'active' : '']">
            All
          </button>
          <button v-for="category in categories" :key="category.id" @click="selectCategory(category.slug!)" :class="['category-button', currentCategorySlug === category.slug ? 'active' : '']">
            {{ category.name }}
          </button>
        </div>
      </section>

      <!-- Products Section -->
      <div class="container mx-auto px-4">
        <!-- Loading Skeleton for Products -->
        <div v-if="productsPending" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div v-for="n in 8" :key="n" class="h-72 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        <!-- Error State -->
        <div v-else-if="productsError" class="text-center py-12">
          <p class="text-brand">Something went wrong loading products.</p>
          <button @click="refreshProducts" class="mt-4 px-6 py-2 bg-brand text-white rounded-lg">Reload</button>
        </div>

        <!-- Empty State -->
        <div v-else-if="productsSafe.length === 0" class="text-center py-16">
          <h2 class="text-xl font-semibold text-gray-600 mb-2">No products found</h2>
          <p class="text-gray-500">There are no products in this category yet.</p>
        </div>

        <!-- Product Grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCard v-for="product in productsSafe" :key="product.id" :product="product" />
        </div>

        <!-- Infinite Scroll Trigger -->
        <div ref="loadMoreTrigger" class="h-10 w-full"></div>
        <div v-if="productStore.isLoading" class="flex justify-center py-8">
            <Icon name="eos-icons:loading" size="32" class="text-[#f02c56]" />
        </div>
      </div>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useProductStore, useCategoryStore } from '~/stores';
import HomeLayout from '~/layouts/HomeLayout.vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import type { IProduct, ICategory } from '~/models';

const productStore = useProductStore();
const categoryStore = useCategoryStore();

const currentCategorySlug = ref('all');
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// 1. Fetch Categories on Initial Load
const { data: categories, pending: categoriesPending } = await useLazyAsyncData('categories', 
    () => categoryStore.fetchCategories()
);

// 2. Fetch Products Separately, reacting to category changes
const { data: products, pending: productsPending, error: productsError, refresh: refreshProducts } = await useLazyAsyncData(
    'discover-products',
    () => {
        if (currentCategorySlug.value === 'all') {
            return productStore.ensureInitialProductsLoaded();
        } else {
            return productStore.ensureCategoryProductsLoaded(currentCategorySlug.value);
        }
    },
    { watch: [currentCategorySlug] } // This automatically re-fetches when currentCategorySlug changes
);

// Provide a null-safe computed array for templates (products may be null while loading)
const productsSafe = computed<IProduct[]>(() => products?.value ?? []);

const selectCategory = (slug: string) => {
  currentCategorySlug.value = slug;
};

const loadMore = async () => {
    if (productStore.isLoading || !productStore.hasMoreProducts) return;
    await productStore.fetchMoreProducts();
};

onMounted(() => {
    observer.value = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: '200px' });
    if(loadMoreTrigger.value) observer.value.observe(loadMoreTrigger.value);
});

onUnmounted(() => {
    if(observer.value) observer.value.disconnect();
});
</script>

<style scoped>
.category-button {
    @apply px-4 py-2 rounded-full text-sm font-medium transition-all;
}
.category-button.active {
    @apply bg-brand text-white shadow;
}
</style>

<template>
  <HomeLayout>
    <!-- Page Content -->
    <div class="space-y-8">
        <!-- Page Header -->
        <section class="text-center py-8 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-neutral-100 mb-2">Discover More</h1>
            <p class="text-gray-600 dark:text-neutral-400 max-w-xl mx-auto">
                Browse our full catalog of fresh drops and unique styles from all our top sellers.
            </p>
            
            <!-- Category Filters -->
            <div v-if="!layoutPending" class="mt-6 flex flex-wrap justify-center gap-2 px-4">
              <button @click="selectCategory('all')" :class="['category-button', currentCategorySlug === 'all' ? 'active' : '']">
                All
              </button>
              <button v-for="category in categories" :key="category.id" @click="selectCategory(category.slug!)" :class="['category-button', currentCategorySlug === category.slug ? 'active' : '']">
                {{ category.name }}
              </button>
            </div>
        </section>

        <!-- Product Grid -->
        <section class="px-4">
            <!-- Skeleton Loader -->
            <div v-if="productsPending" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="n in 10" :key="n" class="h-72 bg-gray-100 dark:bg-neutral-800 rounded-lg animate-pulse"></div>
            </div>
             <div v-else-if="productsError" class="text-center py-20 text-brand-dark dark:text-brand-light">
                Failed to load products. Please try again.
            </div>
            <div v-else-if="products.length === 0" class="text-center py-16">
                 <Icon name="mdi:package-variant-closed-remove" size="64" class="mx-auto text-gray-300 dark:text-neutral-700 mb-4" />
                <h2 class="text-xl font-semibold text-gray-800 dark:text-neutral-300 mb-2">No Products Found</h2>
                <p class="text-gray-500 dark:text-neutral-500">There are no products in this category yet.</p>
            </div>
            <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3">
                <ProductCard v-for="product in products" :key="product.id" :product="product" />
            </div>
        </section>

        <!-- Infinite Scroll Trigger -->
        <div ref="loadMoreTrigger" class="h-10"></div>
        <div v-if="productStore.isLoading" class="flex justify-center py-8">
            <Icon name="eos-icons:loading" size="32" class="text-brand" />
        </div>
    </div>
    
    <!-- Sidebar Content (fetched from the layout) -->
    <template #left-sidebar>
        <SideNav :top-sellers="topSellers" :categories="categories" @create-post="() => router.push('/upload')" />
    </template>
    <template #right-sidebar>
        <AllAccessories />
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useProductStore} from '~/stores';
import { useLayoutData } from '@/composables/useLayoutData';
import { useRouter } from 'vue-router';
import HomeLayout from '~/layouts/HomeLayout.vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import SideNav from '~/layouts/children/SideNav.vue';
import AllAccessories from '~/components/accessories/AllAccessories.vue';

const productStore = useProductStore();
const categoryStore = useCategoryStore()
const router = useRouter();

const currentCategorySlug = ref('all');
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// 1. Fetch layout data (categories, top sellers) from our composable
const { data: layoutData, pending: layoutPending } = useLayoutData();
const categories = computed(() => layoutData.value?.categories || []);
const topSellers = computed(() => layoutData.value?.topSellers || []);

// 2. Fetch Products Separately, reacting to category changes
const { data: products, pending: productsPending, error: productsError } = await useLazyAsyncData(
    'discover-products',
    () => productStore.fetchProductsForCategory(currentCategorySlug.value),
    {
        watch: [currentCategorySlug], // This automatically re-fetches when the slug changes
        default: () => [] // Start with an empty array
    }
);

const selectCategory = (slug: string) => {
  currentCategorySlug.value = slug;
};

// 3. Logic for Infinite Scroll
const loadMore = async () => {
    if (productStore.isLoading || !productStore.discoverHasMore) return;
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
    @apply px-4 py-2 rounded-full text-sm font-medium transition-all bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700;
}
.category-button.active {
    @apply bg-brand text-white shadow;
}
</style>


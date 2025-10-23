<template>
  <HomeLayout>
    <!-- Page Content -->
    <div class="space-y-8">
        <!-- Page Header -->
        <section class="text-center py-8 bg-neutral-900 border-b border-neutral-800">
            <h1 class="text-3xl font-bold text-neutral-100 mb-2">{{ categoryName }}</h1>
            <p class="text-neutral-400 max-w-xl mx-auto">
                Discover all products in the {{ categoryName }} category.
            </p>
        </section>

        <!-- Product Grid -->
        <section class="px-4">
            <div v-if="pending" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div v-for="n in 10" :key="n" class="h-72 bg-neutral-800 rounded-lg animate-pulse"></div>
            </div>
             <div v-else-if="error" class="text-center py-20 text-red-400">
                Failed to load products. Please try again.
            </div>
            <div v-else-if="products.length === 0" class="text-center py-16">
                 <Icon name="mdi:package-variant-closed-remove" size="64" class="mx-auto text-neutral-700 mb-4" />
                <h2 class="text-xl font-semibold text-neutral-300 mb-2">No Products Found</h2>
                <p class="text-neutral-500">There are no products in this category yet.</p>
            </div>
            <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
                <ProductCard v-for="product in products" :key="product.id" :product="product" />
            </div>
        </section>

        <!-- Infinite Scroll Trigger -->
        <div ref="loadMoreTrigger" class="h-10"></div>
        <div v-if="isLoadingMore" class="flex justify-center py-8">
            <Icon name="eos-icons:loading" size="32" class="text-[#f02c56]" />
        </div>
    </div>
    
 <!-- Sidebar Content (fetched from the layout) -->

    <template #right-sidebar>
        <!-- You can add content like "Trending Accessories" here -->
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useLayoutData } from '@/composables/useLayoutData';
import HomeLayout from '~/layouts/HomeLayout.vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import SideNav from '~/layouts/children/SideNav.vue';
import type { IProduct } from '~/models';

const route = useRoute();
const productStore = useProductStore();
const apiService = useApiService();

const products = ref<IProduct[]>([]);
const currentPage = ref(1);
const hasMoreProducts = ref(true);
const isLoadingMore = ref(false);
const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// Get the slug from the URL reactively
const slug = computed(() => route.params.slug as string);
// 1. Fetch layout data (categories, top sellers) from our composable
const { data: layoutData } = useLayoutData();
const categories = computed(() => layoutData.value?.categories || []);
const topSellers = computed(() => layoutData.value?.topSellers || []);

// 2. Fetch the initial page of products for this specific category
const { pending, error, refresh } = await useLazyAsyncData(
    `category-${slug.value}`,
    async () => {
        currentPage.value = 1;
        const { products: fetchedProducts, meta } = await apiService.getProductsByCategorySlug_Paginated(slug.value, { page: 1 });
        products.value = fetchedProducts; // Set the initial list
        hasMoreProducts.value = meta.hasMorePages;
        return { products: fetchedProducts, meta };
    },
    { watch: [slug] } // This automatically re-fetches when the route (slug) changes
);

const categoryName = computed(() => {
    if (slug.value === 'all') return 'All Products';
    return categories.value.find(c => c.slug === slug.value)?.name || 'Category';
});

// 3. Logic for Infinite Scroll
const loadMore = async () => {
    if (isLoadingMore.value || !hasMoreProducts.value) return;
    isLoadingMore.value = true;
    try {
        const nextPage = currentPage.value + 1;
        const { products: newProducts, meta } = await apiService.getProductsByCategorySlug_Paginated(slug.value, { page: nextPage });
        
        if (newProducts.length > 0) {
            products.value.push(...newProducts);
            currentPage.value = nextPage;
            hasMoreProducts.value = meta.hasMorePages;
        } else {
            hasMoreProducts.value = false;
        }
    } catch (err) {
        console.error("Failed to load more products:", err);
    } finally {
        isLoadingMore.value = false;
    }
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

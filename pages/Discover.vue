<template>
  <HomeLayout>
    <!-- Page Content -->
    <div class="space-y-8">
        <!-- Page Header -->
        <section class="text-center py-8 bg-neutral-900 border-b border-neutral-800">
            <h1 class="text-3xl font-bold text-neutral-100 mb-2">Discover All Products</h1>
            <p class="text-neutral-400 max-w-xl mx-auto">
                Browse our full catalog of fresh drops and unique styles from all our top sellers.
            </p>
        </section>

        <!-- Product Grid -->
        <section class="px-4">
            <div v-if="pending && !products.length" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div v-for="n in 10" :key="n" class="h-72 bg-neutral-800 rounded-lg animate-pulse"></div>
            </div>
             <div v-else-if="error" class="text-center py-20 text-red-400">
                Failed to load products. Please try again.
            </div>
            <div v-else class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ProductCard v-for="product in products" :key="product.id" :product="product" />
            </div>
        </section>

        <!-- Infinite Scroll Trigger -->
        <div ref="loadMoreTrigger" class="h-10"></div>
        <div v-if="productStore.isLoading" class="flex justify-center py-8">
            <Icon name="eos-icons:loading" size="32" class="text-[#f02c56]" />
        </div>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useProductStore, useCategoryStore} from '~/stores';
import { useApiService } from '~/services/api/apiService';
import HomeLayout from '~/layouts/HomeLayout.vue';
import ProductCard from '~/components/product/productCard/ProductCard.vue';
import SideNav from '~/layouts/children/SideNav.vue';

const productStore = useProductStore();
const categoryStore = useCategoryStore();
const apiService = useApiService();

const loadMoreTrigger = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// This now uses a dedicated product fetch for the discover page.
const { data: pageData, pending, error } = await useLazyAsyncData('discover-page', async () => {
    const [productsData] = await Promise.all([
        productStore.ensureInitialProductsLoaded(), // Fetches the first page of ALL products
  
    ]);
    return { products: productsData };
});

const products = computed(() => productStore.products);

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


<template>
  <HomeLayout>
    <!-- Main Page Content -->
    <div>
        <ProductPageSkeleton v-if="pending" />

        <div v-else-if="error || !product" class="text-center py-20">
            <h2 class="text-2xl font-bold text-red-500">Product Not Found</h2>
            <p class="text-neutral-400 mt-2">This product does not exist or may have been moved.</p>
            <NuxtLink to="/" class="mt-4 inline-block bg-brand text-white px-6 py-2 rounded-md hover:bg-[#d81b36]">
                Back to Homepage
            </NuxtLink>
        </div>

        <!-- 
            This is the main Product Detail Page (PDP) layout.
            It's a 2-column grid on desktop and stacks on mobile.
        -->
        <div v-else class="max-w-6xl mx-auto py-8">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <!-- Left Column: Media Carousel -->
                <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-md overflow-hidden">
                    <Carousel v-if="product.media?.length" :items-to-show="1" wrap-around>
                        <Slide v-for="media in product.media" :key="media.id">
                            <!-- We reuse the MediaDisplay component for consistent video/image handling -->
                            <MediaDisplay 
                                :product-media="media" 
                                :is-playing="true" 
                                class="w-full aspect-square object-cover" 
                            />
                        </Slide>
                        <template #addons><Pagination /></template>
                    </Carousel>
                </div>

                <!-- Right Column: Product Details & Actions -->
                <div class="text-neutral-100">
                    <!-- 
                        We reuse the professional, dark-themed ProductDetails component
                        that you've already built and perfected.
                    -->
                    <ProductDetails 
                        v-if="product.seller"
                        :product="product" 
                        :sellerStore="product.seller" 
                    />
                </div>
            </div>

            <!-- TODO: Add a "Related Products" or "Shop the Look" section here -->
        </div>
    </div>

    <!-- Sidebar Content (fetched from the layout) -->
    <template #left-sidebar>
        <SideNav :top-sellers="topSellers" :categories="categories" />
    </template>
    <template #right-sidebar>
        <!-- The right sidebar can be empty or have other content -->
    </template>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useProductStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useLayoutData } from '@/composables/useLayoutData';
import HomeLayout from '~/layouts/HomeLayout.vue';
import SideNav from '~/layouts/children/SideNav.vue';
import ProductDetails from '~/components/product/productDetails/productDetails/children/ProductDetails.vue';
import MediaDisplay from '~/components/product/productDetails/mediaSection/MediaDisplay.vue';
import ProductPageSkeleton from '~/components/skeletons/ProductPageSkeleton.vue'; // You'll need to create this
import 'vue3-carousel/dist/carousel.css';
import type { IProduct } from '~/models';

const route = useRoute();
const productStore = useProductStore();
const apiService = useApiService();
const slug = route.params.slug as string;

// 1. Fetch layout data (categories, top sellers) from our composable
const { data: layoutData } = useLayoutData();
const categories = computed(() => layoutData.value?.categories || []);
const topSellers = computed(() => layoutData.value?.topSellers || []);

// 2. Fetch all page-specific data (the single product)
// We use a new, more specific action from the product store
const { data: product, pending, error } = await useLazyAsyncData(
  `product-${slug}`,
  () => productStore.getProductBySlug(slug)
);

// 3. Pre-fetch the seller profile
// This watcher ensures the seller data is loaded by the time the ProductDetails component renders.
watch(product, (newProduct) => {
    if (newProduct?.seller?.store_slug) {
        useUserStore().ensureSellerProfileLoaded(newProduct.seller.store_slug);
    }
}, { immediate: true });

</script>

<style>
/* Scoped styles for dark-theme carousel pagination */
.carousel__pagination-button {
    background-color: rgba(120, 120, 120, 0.5) !important;
    border-radius: 50%;
    width: 8px;
    height: 8px;
    padding: 0;
    margin: 0 4px;
}
.carousel__pagination-button--active {
    background-color: rgba(255, 255, 255, 0.9) !important;
}
</style>


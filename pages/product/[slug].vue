<template>
    <div>
        <!-- Skeleton loader is shown while all initial data is pending -->
        <ProductFeedSkeleton v-if="pending" />

        <div v-else-if="error || !products || products.length === 0" class="fixed inset-0 flex items-center justify-center bg-gray-50 p-4">
            <div class="text-center">
                <p class="text-brand mb-4">Could not load product. It may have been moved or deleted.</p>
                <NuxtLink to="/" class="bg-brand text-white px-4 py-2 rounded-md">Go to Homepage</NuxtLink>
            </div>
        </div>

        <!-- 
            UNIFIED ADAPTIVE LAYOUT:
            A single root element that uses responsive classes to adapt.
        -->
        <div v-else class="relative min-h-screen bg-black text-white lg:grid lg:grid-cols-3 lg:gap-8 lg:p-8 lg:bg-gray-100">
            <!-- Swipeable Feed Container -->
            <div ref="swipeContainer" class="h-dvh w-full overflow-y-auto snap-y snap-mandatory lg:col-span-2 lg:rounded-2xl lg:shadow-xl">
                <div v-for="(product, index) in products" :key="product.id"
                    class="h-dvh w-full flex items-center justify-center snap-start relative product-slide"
                    :data-slug="product.slug">
                    
                    <div class="w-full h-full relative flex flex-col">
                        <!-- Mobile-only Header -->
                        <header class="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4 lg:hidden">
                           <div class="flex items-center justify-between">
                                <NuxtLink to="/" class="p-2 rounded-full hover:bg-white/20 transition-colors"><Icon name="mdi:arrow-left" size="24" /></NuxtLink>
                                <div class="flex gap-2">
                                    <button class="p-2 rounded-full hover:bg-white/20 transition-colors"><Icon name="mdi:share-variant" size="22" /></button>
                                    <button class="p-2 rounded-full hover:bg-white/20 transition-colors"><Icon name="mdi:dots-vertical" size="22" /></button>
                                </div>
                            </div>
                        </header>
                        
                        <!-- Media Display Area -->
                        <div class="flex-1 relative min-h-0">
                             <Carousel v-if="product.media?.length" :items-to-show="1" :wrap-around="true" class="w-full h-full" v-model="mediaIndices[index]">
                                <Slide v-for="(media, mIndex) in product.media" :key="media.id">
                                    <div class="w-full h-full relative">
                                        <MediaDisplay 
                                            :product-media="media" 
                                            :is-playing="product.id === currentProduct?.id && mediaIndices[index] === mIndex" 
                                            class="absolute inset-0 w-full h-full" 
                                        />
                                    </div>
                                </Slide>
                                <template #addons><Pagination class="absolute bottom-4 lg:bottom-24" /></template>
                            </Carousel>
                        </div>
                        
                        <!-- Info Overlay (Mobile Only) -->
                        <div class="p-4 flex items-end gap-4 z-10 bg-black/50 shrink-0 lg:hidden">
                            <div class="flex-1 min-w-0">
                                <NuxtLink :to="`/seller/profile/${product.seller?.store_slug}`" class="flex items-center gap-2 mb-2">
                                    <img :src="product.seller?.store_logo || '/default-store-logo.png'" class="w-8 h-8 rounded-full border border-white/50">
                                    <span class="font-semibold text-sm">{{ product.seller?.store_name }}</span>
                                </NuxtLink>
                                <h1 class="text-base font-bold line-clamp-2">{{ product.title }}</h1>
                                <p class="text-xl font-bold mt-1">{{ formatPrice(product.price) }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Desktop Sidebar -->
            <div class="hidden lg:block h-[calc(100vh-4rem)] sticky top-8">
                 <DesktopSidePanel 
                    :product="currentProduct" 
                    :seller-store="currentSellerProfile" 
                />
            </div>

            <!-- Mobile-only Floating Panel & Modals -->
            <div class="lg:hidden">
                <FloatingSidePanel 
                    :product="currentProduct" 
                    @toggle-details="openDetailsPanel(currentProduct)" 
                    @toggle-chat="openChatModal(currentProduct)" 
                />
                <ProductDetailsSidePanel v-if="panelProduct" :is-open="isDetailsPanelOpen" :product="panelProduct" :seller-store="currentSellerProfile" @close="isDetailsPanelOpen = false" />
                <ProductChatModal v-if="panelProduct" :is-open="isChatModalOpen" :product="panelProduct" @close="isChatModalOpen = false" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useProductStore, useUserStore } from '~/stores';
import { useRoute, useRouter } from 'vue-router';
import ProductFeedSkeleton from '~/components/skeletons/ProductFeedSkeleton.vue';
import FloatingSidePanel from '~/components/product/ProductSidePanel.vue';
import MediaDisplay from '~/components/product/productDetails/mediaSection/MediaDisplay.vue';
import DesktopSidePanel from '~/components/product/DesktopSidePanel.vue';
import ProductChatModal from '~/components/chat/ProductChatModal.vue';
import ProductDetailsSidePanel from '~/components/product/ProductDetailSidePanel.vue';
import 'vue3-carousel/dist/carousel.css';
import type { IProduct, ISellerProfile } from '~/models';
import { formatPrice } from '~/utils/formatters';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const productStore = useProductStore();

const slug = route.params.slug as string;
const swipeContainer = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);
const panelProduct = ref<IProduct | null>(null);
const isDetailsPanelOpen = ref(false);
const isChatModalOpen = ref(false);
const mediaIndices = ref<number[]>([]);

// All critical data is now fetched in a single, unified `useAsyncData` call.
const { data, pending, error } = await useLazyAsyncData(
  `product-feed-${slug}`,
  async () => {
    // 1. Fetch the product feed first.
    const feed = await productStore.ensureProductFeedLoaded(slug);
    if (!feed || feed.length === 0) {
      throw createError({ statusCode: 404, message: 'Product feed not found.' });
    }
    
    // 2. Identify the initial product to pre-fetch its seller's profile.
    const initialProduct = feed.find(p => p.slug === slug) || feed[0];
    if (initialProduct?.seller?.store_slug) {
      // 3. Fetch the seller profile. The store handles caching internally.
      await userStore.ensureSellerProfileLoaded(initialProduct.seller.store_slug);
    }
    
    // 4. Return all the data the page needs for its initial render.
    return { products: feed };
  },
  { server: true } // Ensure this runs on the server for the initial load
);

// Computed properties now read from the unified `data` object or the store's reactive state.
const products = computed(() => data.value?.products || []);
const currentProduct = computed(() => productStore.currentProduct);
const currentSellerProfile = computed(() => productStore.currentSellerProfile);

// This watcher pre-loads the seller profile for the *next* product for a smoother UX.
watch(currentProduct, (newProduct) => {
    if (newProduct?.seller?.store_slug) {
        userStore.ensureSellerProfileLoaded(newProduct.seller.store_slug);
    }
}, { immediate: true });

// This watcher correctly initializes the media carousel indices when the `products` data arrives.
watch(products, (newProducts) => {
    if (newProducts) mediaIndices.value = Array(newProducts.length).fill(0);
}, { immediate: true });

/* Intersection Observer Logic */
const setupIntersectionObserver = () => {
  if (observer.value) observer.value.disconnect();
  const options = { root: swipeContainer.value, threshold: 0.7 };
  observer.value = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible) {
          const newSlug = visible.target.getAttribute('data-slug');
          if (newSlug && newSlug !== productStore.currentProductSlug) {
              productStore.currentProductSlug = newSlug;
              router.replace({ params: { slug: newSlug } });
          }
      }
  }, options);
  swipeContainer.value?.querySelectorAll('.product-slide').forEach(el => observer.value?.observe(el));
};

onMounted(() => {
    nextTick(() => {
        if (products.value) {
            const initialIndex = products.value.findIndex(p => p.slug === slug);
            if (initialIndex > -1) {
                productStore.currentProductSlug = slug;
                if (initialIndex > 0 && swipeContainer.value) {
                    swipeContainer.value.scrollTop = swipeContainer.value.clientHeight * initialIndex;
                }
            }
        }
        setupIntersectionObserver();
    });
});

onUnmounted(() => {
    observer.value?.disconnect();
});

// Modal Controls
const openDetailsPanel = (product: IProduct | null) => { if (product) { panelProduct.value = product; isDetailsPanelOpen.value = true; } };
const openChatModal = (product: IProduct | null) => { if (product) { panelProduct.value = product; isChatModalOpen.value = true; } };
</script>

<style>
.h-dvh { height: 100dvh; }
.snap-y { scroll-snap-type: y mandatory; }
.snap-start { scroll-snap-align: start; }
.carousel__pagination-button--active { background-color: #f02c56 !important; }
.carousel__pagination-button { background-color: rgba(255, 255, 255, 0.6) !important; }
.snap-y::-webkit-scrollbar { display: none; }
.snap-y { -ms-overflow-style: none; scrollbar-width: none; }
.product-slide { scroll-snap-align: start; }
</style>


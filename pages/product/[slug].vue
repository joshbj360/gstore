<template>
    <div>
        <ProductFeedSkeleton v-if="pending" />

        <div v-else-if="error || !products || products.length === 0" class="fixed inset-0 flex items-center justify-center bg-gray-50 p-4">
            <div class="text-center">
                <p class="text-red-500 mb-4">Could not load product. It may have been moved or deleted.</p>
                <NuxtLink to="/" class="bg-[#f02c56] text-white px-4 py-2 rounded-md">Go to Homepage</NuxtLink>
            </div>
        </div>

        <div v-else>
            <!-- 
                MOBILE & TABLET LAYOUT:
                This is a full-screen, immersive experience.
            -->
            <div class="relative min-h-screen bg-black text-white lg:hidden">
                <div ref="swipeContainerMobile" class="h-dvh w-full overflow-y-auto snap-y snap-mandatory">
                    <div v-for="(product, index) in products" :key="product.id"
                        class="h-dvh w-full flex items-center justify-center snap-start relative product-slide"
                        :data-slug="product.slug" :data-index="index">
                        
                        <div class="w-full h-full relative flex flex-col">
                            <!-- Header Overlay -->
                            <header class="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/50 to-transparent p-4">
                                <div class="flex items-center justify-between">
                                    <NuxtLink to="/" class="p-2 rounded-full hover:bg-white/20"><Icon name="mdi:arrow-left" size="24" /></NuxtLink>
                                    <div class="flex gap-2">
                                        <button class="p-2 rounded-full hover:bg-white/20"><Icon name="mdi:share-variant" size="22" /></button>
                                        <button class="p-2 rounded-full hover:bg-white/20"><Icon name="mdi:dots-vertical" size="22" /></button>
                                    </div>
                                </div>
                            </header>
                            
                            <!-- Media Display Area (flex-1 allows it to take up available space) -->
                            <div class="flex-1 relative min-h-0">
                                <Carousel v-if="product.media?.length" :items-to-show="1" :wrap-around="true" class="w-full h-full" v-model="mediaIndices[index]">
                                    <Slide v-for="(media, mIndex) in product.media" :key="media.id">
                                        <div class="w-full h-full relative">
                                            <MediaDisplay :product-media="media" :is-playing="product.id === currentProduct?.id && mediaIndices[index] === mIndex" class="absolute inset-0 w-full h-full" />
                                        </div>
                                    </Slide>
                                    <template #addons><Pagination class="absolute bottom-4" /></template>
                                </Carousel>
                            </div>
                            
                            <!-- Info Overlay (shrink-0 prevents it from growing) -->
                            <div class="p-4 flex items-end gap-4 z-10 bg-black/50 shrink-0">
                                <div class="flex-1 min-w-0">
                                    <NuxtLink :to="`/seller/profile/${product.store_slug}`" class="flex items-center gap-2 mb-2">
                                        <img :src="product.seller?.sellerProfile?.store_logo || '/default-store-logo.png'" class="w-8 h-8 rounded-full border border-white/50">
                                        <span class="font-semibold text-sm">{{ product.store_slug }}</span>
                                    </NuxtLink>
                                    <h1 class="text-base font-bold line-clamp-2">{{ product.title }}</h1>
                                    <p class="text-xl font-bold mt-1">{{ formatPrice(product.price) }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <FloatingSidePanel :product="currentProduct" @toggle-details="openDetailsPanel(currentProduct)" @toggle-chat="openChatModal(currentProduct)" />
            </div>

            <!-- 
            DESKTOP LAYOUT:
            The parent is now a fixed height (h-screen) to contain its children.
        -->
        <div class="hidden lg:grid grid-cols-3 gap-8 p-8 h-screen bg-gray-100">
            <!-- Swipeable Feed Container -->
            <div ref="swipeContainerDesktop" class="h-full col-span-2 overflow-y-auto snap-y snap-mandatory rounded-2xl shadow-xl">
                 <div v-for="(product, index) in products" :key="product.id"
                    class="h-full w-full flex items-center justify-center snap-start relative product-slide"
                    :data-slug="product.slug" :data-index="index">
                    <div class="w-full h-full bg-black">
                        <Carousel v-if="product.media?.length" :items-to-show="1" :wrap-around="true" class="w-full h-full" v-model="mediaIndices[index]">
                            <Slide v-for="(media, mIndex) in product.media" :key="media.id">
                                <div class="w-full h-full relative">
                                    <MediaDisplay :product-media="media" :is-playing="product.id === currentProduct?.id && mediaIndices[index] === mIndex" class="absolute inset-0 w-full h-full" />
                                </div>
                            </Slide>
                            <template #addons><Pagination class="absolute bottom-4" /></template>
                        </Carousel>
                    </div>
                </div>
            </div>
            
            <!-- 
                Desktop Sidebar Container
                - `h-full` makes it respect the parent's height.
                - `min-h-0` is a key flex/grid property that allows its child to scroll correctly.
             -->
            <div class="h-full min-h-0">
                 <DesktopSidePanel 
                    :product="currentProduct" 
                    :sellerStore="currentSellerProfile" 
                />
            </div>
        </div>

            <!-- Modals (shared between layouts) -->
            <ProductDetailsSidePanel v-if="panelProduct" :is-open="isDetailsPanelOpen" :product="panelProduct" :sellerStore="currentSellerProfile" @close="isDetailsPanelOpen = false" />
            <ProductChatModal v-if="panelProduct" :is-open="isChatModalOpen" @close="isChatModalOpen = false" />
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
import ProductChatModal from '~/components/chat/ProductChatModal.vue';
import ProductDetailsSidePanel from '~/components/product/ProductDetailSidePanel.vue';
import DesktopSidePanel from '@/components/product/DesktopSidePanel.vue'; // Import the new component
import 'vue3-carousel/dist/carousel.css';
import type { IProduct } from '~/models';

const productStore = useProductStore();
const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const swipeContainer = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);
const isDetailsPanelOpen = ref(false);
const isChatModalOpen = ref(false);
const panelProduct = ref<IProduct | null>(null);
const mediaIndices = ref<number[]>([]);

const slug = route.params.slug as string;

const { data: products, pending, error } = await useAsyncData(
    `product-feed-${slug}`,
    () => productStore.ensureProductFeedLoaded(slug),
    { watch: [() => slug] }
);

const currentProduct = computed(() => productStore.currentProduct);
const currentSellerProfile = computed(() => productStore.currentSellerProfile);

watch(products, (newProducts) => {
    if (newProducts) mediaIndices.value = Array(newProducts.length).fill(0);
}, { immediate: true });

watch(currentProduct, (newProduct) => {
    console.log('Current product changed:', newProduct); // Debugging line
    if (newProduct?.store_slug) userStore.ensureSellerProfileLoaded(newProduct.store_slug);
}, { immediate: true });

const setupIntersectionObserver = () => {
    if (observer.value) observer.value.disconnect();
    const options = { root: swipeContainer.value, threshold: 0.7 };
    observer.value = new IntersectionObserver((entries) => {
        if (isDetailsPanelOpen.value || isChatModalOpen.value) return;
        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (intersectingEntry) {
            const newSlug = (intersectingEntry.target as HTMLElement).dataset.slug;

            // The observer's only jobs are to update the store's pointer and the URL.

            // It no longer triggers a data refetch.

            if (newSlug && newSlug !== productStore.currentProductSlug) {
                productStore.currentProductSlug = newSlug;
                router.replace({ params: { slug: newSlug } });
            }
        }
    }, options);

    observeNewSlides();

};



const observeNewSlides = () => {
    document.querySelectorAll('.product-slide').forEach(slide => {
        if (slide) observer.value?.observe(slide);
    });
};

const openDetailsPanel = (product: IProduct | null) => {
    if (!product) return;
    panelProduct.value = product;
    isDetailsPanelOpen.value = true;
};
const openChatModal = (product: IProduct | null) => {
    if (!product) return;
    panelProduct.value = product;
    isChatModalOpen.value = true;
};

const discountedPrice = (product: IProduct) => {
    return product.discount ? product.price * (1 - product.discount) : product.price;
};

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
};

onMounted(() => {
    nextTick(() => {
        if (products.value) {
            const initialIndex = products.value.findIndex(p => p.slug === slug);
            if (initialIndex > -1) {
                productStore.currentProductSlug = slug; // Set initial slug in store
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
</script>

<style>
/* Using dvh unit for dynamic viewport height */
.h-dvh {
    height: 100dvh;
}
.snap-y { scroll-snap-type: y mandatory; }
.snap-start { scroll-snap-align: start; }
.carousel__pagination-button--active { background-color: #f02c56 !important; }
.carousel__pagination-button { background-color: rgba(255, 255, 255, 0.6) !important; }
.snap-y::-webkit-scrollbar { display: none; }
.snap-y { -ms-overflow-style: none; scrollbar-width: none; }
.product-slide { scroll-snap-align: start; }
</style>

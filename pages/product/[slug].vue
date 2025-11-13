<template>
  <div>
    <!-- HEADER -->
    <div
      class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md  top-0 z-20"
    >
      <button
        @click="router.back()"
        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <Icon name="mdi:arrow-left" size="22" class="text-gray-600 dark:text-neutral-300" />
      </button>

      <div class="flex gap-2">
        <button class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
          <Icon name="mdi:share-variant" size="22" class="text-gray-600 dark:text-neutral-300" />
        </button>
        <button class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
          <Icon name="mdi:bookmark-outline" size="22" class="text-gray-600 dark:text-neutral-300" />
        </button>
      </div>
    </div>

    <!-- LOADING STATE -->
    <ProductPageSkeleton v-if="pending" />

    <!-- ERROR STATE -->
    <div v-else-if="error || !product" class="text-center py-20">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">Product Not Found</h2>
      <p class="text-gray-600 dark:text-neutral-400 mt-2">This product may have been removed.</p>
      <NuxtLink to="/" class="mt-4 inline-block bg-brand text-white px-6 py-2 rounded-lg">
        Back to Homepage
      </NuxtLink>
    </div>

    <!-- MAIN CONTENT -->
    <template v-else>
      <div class="max-w-6xl mx-auto py-6 md:py-10">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- PRODUCT IMAGES -->
          <div class="relative">
            <div class="lg:sticky lg:top-24">
              <div class="rounded-2xl overflow-hidden shadow-lg relative bg-black">
                <Carousel ref="carousel" :items-to-show="1" :wrap-around="true" class="h-full">
                  <Slide v-for="media in product.media" :key="media.id">
                    <MediaDisplay
                      :product-media="media"
                      :is-playing="true"
                      class="w-full h-[350px] md:h-[500px] lg:h-[550px] object-cover"
                    />
                  </Slide>

                  <template #addons>
                    <Pagination />
                  </template>
                </Carousel>
              </div>

              <!-- THUMBNAILS -->
              <div
                v-if="product.media?.length > 1"
                class="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide"
              >
                <img
                  v-for="(thumb, index) in product.media"
                  :key="thumb.id"
                  :src="getMediaThumbnailUrl(thumb)"
                  @click="goToSlide(index)"
                  class="w-20 h-20 rounded-xl object-cover cursor-pointer hover:ring-2 hover:ring-brand transition-all"
                />
              </div>
            </div>
          </div>

          <!-- PRODUCT DETAILS -->
          <div class="flex flex-col">
            <ProductDetails :product="product" :sellerStore="product.seller" class="flex-1" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore, useUserStore } from '~/stores';
import { useApiService } from '~/services/api/apiService';
import { useLayoutData } from '@/composables/useLayoutData';
// HomeLayout import removed
import ProductDetails from '~/components/product/productDetails/productDetails/ProductDetails.vue';
import MediaDisplay from '~/components/product/productDetails/mediaSection/MediaDisplay.vue';
import ProductPageSkeleton from '@/components/skeletons/ProductPageSkeleton.vue';
import 'vue3-carousel/dist/carousel.css';
import type { IProduct } from '~/models';
import { getMediaThumbnailUrl } from '~/utils/formatters';

// THE FIX: definePageMeta is now used to set the layout *and* the wide page flag.
definePageMeta({
    layout: 'home-layout',
    isWidePage: true
});

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const apiService = useApiService();
const userStore = useUserStore();
const slug = route.params.slug as string;

const carousel = ref<any>(null);

// 1. Fetch layout data
const { data: layoutData } = useLayoutData();

// 2. Fetch product data
const { data: product, pending, error } = await useLazyAsyncData(
    `product-${slug}`,
    () => productStore.getProductBySlug(slug)
);

// 3. Pre-fetch the seller profile
watch(product, (newProduct) => {
    if (newProduct?.seller?.store_slug) {
        userStore.ensureSellerProfileLoaded(newProduct.seller.store_slug);
    }
}, { immediate: true });

const goToSlide = (index: number) => {
    carousel.value?.slideTo(index);
};

</script>

<style>
/* ... (your existing carousel styles are fine) ... */
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

.scrollbar-hide {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
</style>
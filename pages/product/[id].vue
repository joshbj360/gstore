<template>
  <div v-if="isLoading && !products.length" class="fixed inset-0 flex items-center justify-center bg-white z-50">
    <LoadingSpinner />
  </div>

  <div v-else-if="error" class="fixed inset-0 flex items-center justify-center bg-gray-50 p-4">
    <div class="text-center">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <NuxtLink to="/" class="bg-[#f02c56] text-white px-4 py-2 rounded-md hover:bg-[#df4949]">
        Go to Homepage
      </NuxtLink>
    </div>
  </div>

  <div v-else class="relative min-h-screen bg-gray-900">
    <NuxtLink to="/"
      class="absolute top-4 left-4 z-40 flex items-center bg-white/80 p-2 rounded-full shadow-md hover:bg-[#f02c56] hover:text-white transition-all"
      aria-label="Back to Homepage">
      <Icon name="mdi:arrow-left" size="20" />
    </NuxtLink>

    <div ref="swipeContainer" class="h-screen w-full overflow-y-auto snap-y snap-mandatory">
      <div 
        v-for="(product, index) in products" 
        :key="product.id"
        class="product-slide h-screen w-full flex items-center justify-center snap-start relative"
        :data-index="index"
        :data-product-id="product.id"
      >
        <div class="w-full h-full relative group">
          <Carousel 
            v-if="product.media?.length" 
            :items-to-show="1" 
            :wrap-around="true" 
            class="w-full h-full"
            v-model="mediaIndices[index]"
          >
            <Slide v-for="(media, mIndex) in product.media" :key="media.url">
              <div class="w-full h-full relative">
                <div class="absolute top-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-2 py-1 rounded-full z-10">
                  {{ mIndex + 1 }} / {{ product.media.length }}
                </div>
                <MediaDisplay 
                  :product-media="media" 
                  class="w-full h-full object-contain" 
                  :is-playing="product.id === currentProduct?.id && mediaIndices[index] === mIndex" 
                />
              </div>
            </Slide>

            <template #addons>
              <Navigation>
                <template #prev>
                  <button
                    class="absolute left-4 top-1/3 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-[#f02c56] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Previous media">
                    <Icon name="mdi:chevron-left" size="24" />
                  </button>
                </template>
                <template #next>
                  <button
                    class="absolute right-4 top-1/3 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-[#f02c56] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Next media">
                    <Icon name="mdi:chevron-right" size="24" />
                  </button>
                </template>
              </Navigation>
              <Pagination class="absolute bottom-24" />
            </template>
          </Carousel>
          
          <div @click="openDetailsPanel(product)" class="absolute bottom-0 left-0 right-0 text-white z-20 p-6 bg-gradient-to-t from-black/70 to-transparent rounded-b-lg cursor-pointer">
            <h3 class="text-lg sm:text-xl font-semibold truncate">{{ product.title || 'Untitled' }}</h3>
            <p class="text-md sm:text-lg font-bold">{{ formatPrice(product.price) }}</p>
          </div>
        </div>
      </div>
      
      <div 
      ref="loadMoreTrigger" 
      class="h-1 w-full"
      :class="{ 'opacity-0': !productStore.hasMoreProducts }"
    ></div>
      <div v-if="isLoadingMore" class="h-24 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    </div>

    <FloatingSidePanel 
      :product="currentProduct" 
      @toggle-details="openDetailsPanel(currentProduct)"
      @toggle-chat="openChatModal(currentProduct)" 
    />

    <ProductDetailsSidePanel 
      v-if="panelProduct"
      :is-open="isDetailsPanelOpen" 
      :product="panelProduct" 
      @close="isDetailsPanelOpen = false" 
    />

    <ProductChatModal 
      v-if="panelProduct"
      :is-open="isChatModalOpen" 
      @close="isChatModalOpen = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { useProductStore } from '~/stores/product.store';
import { useRoute, useRouter } from 'vue-router';

// Component Imports
import LoadingSpinner from '~/components/shared/Loading.vue';
import FloatingSidePanel from '~/components/product/ProductSidePanel.vue';
import MediaDisplay from '~/components/product/productDetails/mediaSection/MediaDisplay.vue';
import ProductChatModal from '~/components/chat/ProductChatModal.vue';
import ProductDetailsSidePanel from '~/components/product/productDetails/ProductDetailSidePanel.vue';
import 'vue3-carousel/dist/carousel.css';
import type { ProductInterface } from '~/models/interface/products/product.interface';

const productStore = useProductStore();
const route = useRoute();
const router = useRouter();

// State
const products = ref<ProductInterface[]>([]);
const currentProductIndex = ref(-1);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const error = ref<string | null>(null);
const swipeContainer = ref<HTMLElement | null>(null);
const observer = ref<IntersectionObserver | null>(null);

// Modal/Panel State
const isDetailsPanelOpen = ref(false);
const isChatModalOpen = ref(false);
const panelProduct = ref<ProductInterface | null>(null);
const mediaIndices = ref<number[]>([]);

// Computed
const currentProduct = computed(() => {
    return currentProductIndex.value > -1 ? products.value[currentProductIndex.value] : null;
});

// --- Core Logic ---

const loadInitialData = async () => {
    isLoading.value = true;
    const productId = Number(route.params.id);
    try {
        const isOrphanLink = productStore.products.length === 0;
        let feed: ProductInterface[] = [];

        if (isOrphanLink) {
            const mainProduct = await productStore.getProductById(productId);
            if (!mainProduct) { error.value = "Product not found."; return; }
            let relatedProducts = await productStore.getSimilarProducts(productId) as ProductInterface[];
            if (!relatedProducts || relatedProducts.length === 0) {
                relatedProducts = await productStore.getProductsByStoreName(mainProduct.store_name);
            }
            feed = [mainProduct, ...relatedProducts.filter(p => p.id !== mainProduct.id)];
        } else {
            feed = [...productStore.products];
        }
        
        products.value = feed;
        mediaIndices.value = Array(feed.length).fill(0);
        const foundIndex = feed.findIndex(p => p.id === productId);
        currentProductIndex.value = foundIndex > -1 ? foundIndex : 0;

        await nextTick();
        setupIntersectionObserver();

    } catch (e) {
        error.value = "Failed to load product data.";
        console.error(e);
    } finally {
        isLoading.value = false;
    }
};

const loadMoreProducts = async () => {
    if (isLoadingMore.value || !productStore.hasMoreProducts) return;
    isLoadingMore.value = true;
    try {
        await productStore.fetchMoreProducts();
        const newProducts = productStore.products.filter(p => !products.value.some(ep => ep.id === p.id));
        products.value.push(...newProducts);
        // We don't need to re-setup the observer, just observe the new slides
        await nextTick();
        observeNewSlides();
    } catch (err) {
        console.error("Failed to load more products", err);
    } finally {
        isLoadingMore.value = false;
    }
};

const setupIntersectionObserver = () => {
    if (observer.value) observer.value.disconnect();

    const options = {
        root: null, // observes intersections relative to the viewport
        threshold: 0.7, // Triggers when 70% of the slide is visible
    };

    observer.value = new IntersectionObserver((entries) => {
        const intersectingEntry = entries.find(entry => entry.isIntersecting);
        if (intersectingEntry) {
            const index = Number((intersectingEntry.target as HTMLElement).dataset.index);
            if (index !== currentProductIndex.value) {
                currentProductIndex.value = index;
                router.replace({ params: { id: products.value[index].id } });
            }
            // Check if the last product is visible to trigger loading more
            if (index === products.value.length - 1) {
                loadMoreProducts();
            }
        }
    }, options);

    observeNewSlides();

    // Scroll to the initial product after setting up the observer
    const initialSlide = swipeContainer.value?.querySelector(`[data-index='${currentProductIndex.value}']`);
    initialSlide?.scrollIntoView();
};

const observeNewSlides = () => {
    const slides = document.querySelectorAll('.product-slide');
    slides.forEach(slide => observer.value?.observe(slide));
};


// --- Helper Functions & Lifecycle ---

const openDetailsPanel = (product: ProductInterface | null) => {
    if (!product) return;
    panelProduct.value = product;
    isDetailsPanelOpen.value = true;
};

const openChatModal = (product: ProductInterface | null) => {
    if (!product) return;
    panelProduct.value = product;
    isChatModalOpen.value = true;
};

const formatPrice = (price: number) => {
    if (isNaN(price)) return 'N/A';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(price / 100);
};

onMounted(loadInitialData);

onUnmounted(() => {
    observer.value?.disconnect();
});
</script>

<style>
.snap-y {
  scroll-snap-type: y mandatory;
}
.snap-start {
  scroll-snap-align: start;
}
.carousel__pagination-button--active {
  background-color: #f02c56 !important;
}
.carousel__pagination-button {
  background-color: rgba(255, 255, 255, 0.6) !important;
}
.snap-y::-webkit-scrollbar {
  display: none;
}
.snap-y {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.product-slide {
  scroll-snap-align: start;
}
</style>
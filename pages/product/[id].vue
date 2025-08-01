<template>
  <div class="relative min-h-screen bg-gray-50">
    <div
      ref="swipeContainer"
      class="h-screen w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory"
    >
      <div
        v-for="(product, index) in products"
        :key="product.id"
        class="h-screen w-full flex items-center justify-center snap-start relative"
        :class="{ hidden: index !== currentIndex }"
      >
        <div class="w-full h-full relative group">
          <Carousel
            v-if="product.media?.length"
            :items-to-show="1"
            :wrap-around="true"
            v-model="mediaIndex[index]"
            class="w-full h-full"
            @slide-start="pauseOtherVideos(index)"
          >
            <Slide v-for="(media, mIndex) in product.media" :key="mIndex">
              <div class="w-full h-full relative">
                <div
                  class="absolute top-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full z-10"
                >
                  Image {{ mIndex + 1 }} of {{ product.media.length }}
                </div>
                <MediaDisplay
                  :product-media="media"
                  :loading="mIndex <= 1 ? 'eager' : 'lazy'"
                  :mute-video="muteVideo[index]"
                  :is-playing="
                    index === currentIndex && mIndex === mediaIndex[index]
                      ? isPlaying[index]
                      : false
                  "
                  class="w-full h-full object-contain"
                  @update:mute-video="updateMute(index, $event)"
                  @update:is-playing="updatePlaying(index, $event)"
                  @loaded="isMediaLoading[index][mIndex] = false"
                  @error="handleMediaError(String(product.id), mIndex, $event)"
                />
                <div
                  v-if="!isMediaLoading[index][mIndex] && index === currentIndex"
                  class="absolute inset-0 flex items-center justify-center bg-black/20"
                >
                  <LoadingSpinner />
                </div>
              </div>
            </Slide>
            <template #addons>
              <Navigation>
                <template #prev>
                  <button
                    class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-[#f02c56] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Previous media"
                  >
                    <Icon name="mdi:chevron-left" size="20" />
                  </button>
                </template>
                <template #next>
                  <button
                    class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full hover:bg-[#f02c56] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Next media"
                  >
                    <Icon name="mdi:chevron-right" size="20" />
                  </button>
                </template>
              </Navigation>
              <Pagination
                class="absolute bottom-16 left-0 right-0 flex justify-center"
              >
                <template #default="{ active, index: dotIndex }">
                  <div
                    class="w-2 h-2 rounded-full mx-1"
                    :class="active ? 'bg-[#f02c56]' : 'bg-white/50'"
                    :aria-label="`Media ${dotIndex + 1}`"
                  ></div>
                </template>
              </Pagination>
            </template>
          </Carousel>
          <div
            class="absolute bottom-8 left-4 right-4 text-white z-20 p-4 bg-gradient-to-t from-black/60 to-transparent rounded-b-lg"
          >
            <NuxtLink :to="`/product/${product.id}`" class="block">
              <h3 class="text-base sm:text-lg font-semibold truncate">
                {{ product.title || "Untitled" }}
              </h3>
              <p class="text-sm sm:text-base">
                {{ formatPrice(product.price) }}
              </p>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div
      class="hidden lg:flex flex-col items-center justify-center absolute top-1/2 right-4 -translate-y-1/2 z-30 space-y-4"
    >
      <button
        @click="swipePrev"
        class="bg-white/90 p-2 rounded-full hover:bg-[#f02c56] hover:text-white transition-all"
        :disabled="currentIndex === 0"
        aria-label="Previous product"
      >
        <Icon name="mdi:chevron-up" size="20" />
      </button>
      <button
        @click="swipeNext"
        class="bg-white/90 p-2 rounded-full hover:bg-[#f02c56] hover:text-white transition-all"
        :disabled="currentIndex === products.length - 1"
        aria-label="Next product"
      >
        <Icon name="mdi:chevron-down" size="20" />
      </button>
    </div>

    <div
      v-if="error"
      class="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <p class="text-red-500 mb-4">{{ error }}</p>
        <button
          @click="retryLoad"
          class="bg-[#f02c56] text-white px-4 py-2 rounded-md hover:bg-[#df4949]"
        >
          Retry
        </button>
      </div>
    </div>

    <ProductDetailsModal
      :product="products[currentIndex]"
      :is-open="isModalOpen"
      :product-id="modalProductId"
      :active-view="'details'"
      :active-tab="'details'"
      :is-in-cart="false"
      @update:is-open="isModalOpen = $event"
    />

    <FloatingSidePanel 
      :product="products[currentIndex]"
      @toggleDetails="toggleDetails(String(products[currentIndex].id))"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useProductStore } from "~/stores/product.store";
import { useRoute, useRouter } from "#imports";
import LoadingSpinner from "~/components/shared/Loading.vue";
import SwipeHintOverlay from "~/components/product/productDetails/SwipeHintOverlay.vue";
import ProductDetailsModal from '@/components/product/productDetails/productDetails/ProductDetailsModal.vue';
import FloatingSidePanel from "~/components/product/ProductSidePanel.vue";
import type { ProductInterface } from "~/models/interface/products/product.interface";
import MediaDisplay from "~/components/product/productDetails/mediaSection/MediaDisplay.vue";
import "vue3-carousel/dist/carousel.css";

const productStore = useProductStore();
const route = useRoute();
const router = useRouter();

const products = ref<ProductInterface[]>([]);
const currentIndex = ref(0);
const mediaIndex = ref<number[]>([]);
const isPlaying = ref<boolean[]>([]);
const muteVideo = ref<boolean[]>([]);
const isMediaLoading = ref<boolean[][]>([]);
const error = ref<string | null>(null);
const isModalOpen = ref(false);
const modalProductId = ref<string | null>(null);

// Initialize from cache
const initializeProducts = async () => {
  try {
    // Use cached products from homepage
    if (productStore.products.length === 0) {
      await productStore.fetchProducts(1, 20);
    }
    products.value = productStore.products;

    // Set initial index based on route
    const productId = route.params.id as string;
    const initialIndex = products.value.findIndex(
      (p) => String(p.id) === productId
    );
    currentIndex.value = initialIndex >= 0 ? initialIndex : 0;

    // Initialize state arrays
    mediaIndex.value = products.value.map(() => 0);
    isPlaying.value = products.value.map(() => true);
    muteVideo.value = products.value.map(() => true);
    isMediaLoading.value = products.value.map(
      (p) => p.media?.map(() => true) || []
    );
  } catch (err) {
    error.value = "Failed to load products. Please try again.";
    console.error("Initialize products error:", err);
  }
};

// Load more products if nearing the end of cache
const loadMoreProducts = async () => {
  try {
    await productStore.fetchMoreProducts();
    products.value = productStore.products;
    mediaIndex.value = products.value.map(() => 0);
    isPlaying.value = products.value.map(() => true);
    muteVideo.value = products.value.map(() => true);
    isMediaLoading.value = products.value.map(
      (p) => p.media?.map(() => true) || []
    );
  } catch (err) {
    error.value = "Failed to load more products.";
    console.error("Load more products error:", err);
  }
};

// Media state handlers
const updatePlaying = (index: number, value: boolean) => {
  isPlaying.value[index] = value;
};

const updateMute = (index: number, value: boolean) => {
  muteVideo.value[index] = value;
};

const pauseOtherVideos = (currentIndex: number) => {
  isPlaying.value = isPlaying.value.map((playing, i) =>
    i === currentIndex ? playing : false
  );
};

const handleMediaError = (
  productId: string,
  mIndex: number,
  event: Event
) => {
  const errorMessage =
    (event as ErrorEvent).error?.message || "Unknown error";
  error.value = `Failed to load media for product ${productId}: ${errorMessage}`;
  const index = products.value.findIndex(
    (p) => String(p.id) === productId
  );
  if (index !== -1 && typeof mIndex === "number")
    isMediaLoading.value[index][mIndex] = false;
};

const retryLoad = () => {
  error.value = null;
  initializeProducts();
};

// Vertical swipe navigation
const swipeContainer = ref<HTMLElement | null>(null);
const swipePrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    router.push(`/product/${products.value[currentIndex.value].id}`);
    pauseOtherVideos(currentIndex.value);
  }
};

const swipeNext = () => {
  if (currentIndex.value < products.value.length - 1) {
    currentIndex.value++;
    router.push(`/product/${products.value[currentIndex.value].id}`);
    pauseOtherVideos(currentIndex.value);
  } else {
    loadMoreProducts();
  }
};

// Touch swipe handling
let touchStartY = 0;
const handleSwipe = (e: WheelEvent | TouchEvent) => {
  if ("deltaY" in e) {
    // Mouse wheel
    if (e.deltaY > 50) swipeNext();
    else if (e.deltaY < -50) swipePrev();
  } else if ("touches" in e) {
    // Touch swipe
    if (e.type === "touchstart") {
      touchStartY = e.touches[0].clientY;
    } else if (e.type === "touchend") {
      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) swipeNext();
        else swipePrev();
      }
    }
  }
};

// Modal toggle
const toggleDetails = (productId: string) => {
  isModalOpen.value = !isModalOpen.value;
  modalProductId.value = isModalOpen.value ? productId : null;
};

// Price formatting
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "narrowSymbol",
  }).format(price / 100);
};

// Lifecycle hooks
onMounted(async () => {
  await initializeProducts();
  if (swipeContainer.value) {
    swipeContainer.value.addEventListener("wheel", handleSwipe, {
      passive: true,
    });
    swipeContainer.value.addEventListener("touchstart", handleSwipe, {
      passive: true,
    });
    swipeContainer.value.addEventListener("touchend", handleSwipe, {
      passive: true,
    });
  }
});

onUnmounted(() => {
  if (swipeContainer.value) {
    swipeContainer.value.removeEventListener("wheel", handleSwipe);
    swipeContainer.value.removeEventListener("touchstart", handleSwipe);
    swipeContainer.value.removeEventListener("touchend", handleSwipe);
  }
});
</script>

<style>
.snap-y {
  scroll-snap-type: y mandatory;
}
.snap-start {
  scroll-snap-align: start;
}
.carousel__viewport {
  height: 100%;
}
.carousel__slide {
  width: 100%;
  height: 100%;
}
.group:hover .opacity-0 {
  opacity: 1;
}
@media (max-width: 640px) {
  .h-screen {
    height: 100vh;
  }
}

.carousel__pagination-button--active {
  background-color: #f02c56 !important;
}

.carousel__pagination-button {
  background-color: rgba(255, 255, 255, 0.5) !important;
}
</style>
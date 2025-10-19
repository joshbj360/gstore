
<template>
  <div class="relative min-h-screen bg-gray-100">
    <header class="sticky top-0 z-10 shadow-sm">
      <div class="container mx-auto px-4 py-3 flex items-center">
        <button
          @click="navigateHome"
          class="flex items-center text-gray-700 hover:text-brand-dark transition-colors"
        >
          <Icon name="mdi:arrow-left" size="24" class="mr-2" />
          <span class="font-medium">Back to Home</span>
        </button>
      </div>
    </header>
    <!-- Video Swipe Container -->
    <div ref="swipeContainer" class="h-screen w-full overflow-hidden relative snap-y snap-mandatory">
      <div v-for="(product, index) in productsWithVideo" :key="product.id" 
           class="h-screen w-full flex items-center justify-center snap-start relative"
           :class="{ 'hidden': index !== currentIndex }">
        <!-- Cloudinary Video Player -->
        <div v-if="product.media?.[0]?.type === EMediaType.VIDEO" class="w-full h-full relative">
          <video
            :id="`video-player-${product.id}`"
            class="w-full h-full object-cover"
            :class="{ 'opacity-0': isLoading[index] }"
            playsinline
            loop
            :muted="muteVideo"
            @error="handleVideoError(product.id, $event)"
            @loadeddata="handleVideoLoaded(index)"
            preload="metadata"
          ></video>
          <!-- Loading Overlay -->
          <div v-if="isLoading[index] && index === currentIndex" 
               class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <LoadingSpinner />
          </div>
          <!-- Video Controls -->
          <div class="absolute top-4 right-4 flex gap-2 z-20">
            <button @click="toggleMute" 
                    class="bg-white/90 p-2 rounded-full hover:bg-brand hover:text-white transition-all"
                    :aria-label="muteVideo ? 'Unmute video' : 'Mute video'">
              <Icon :name="muteVideo ? 'mdi:volume-off' : 'mdi:volume-high'" size="20" />
            </button>
            <button @click="togglePlay(index)"
                    class="bg-white/90 p-2 rounded-full hover:bg-brand hover:text-white transition-all"
                    :aria-label="isPlaying[index] ? 'Pause video' : 'Play video'">
              <Icon :name="isPlaying[index] ? 'mdi:pause' : 'mdi:play'" size="20" />
            </button>
          </div>
          <!-- Product Info Overlay -->
          <div class="absolute bottom-8 left-4 right-4 text-white z-20">
            <NuxtLink :to="`/product/${product.id}`" class="block">
              <h3 class="text-lg font-semibold truncate">{{ product.title }}</h3>
              <p class="text-sm">{{ formatPrice(product.price) }}</p>
            </NuxtLink>
            <div class="flex gap-2 mt-2">
              <button v-for="platform in socialPlatforms" :key="platform.name"
                      @click="shareToSocial(platform.url(product.id, product.title))"
                      class="bg-white/90 p-2 rounded-full hover:bg-brand hover:text-white transition-all"
                      :aria-label="`Share to ${platform.name}`">
                <Icon :name="platform.icon" size="20" />
              </button>
            </div>
          </div>
        </div>
        <!-- Swipe Hint -->
        <SwipeHintOverlay v-if="index === currentIndex" />
      </div>
    </div>
    <!-- Navigation Arrows (Desktop) -->
    <div class="hidden lg:flex absolute top-1/2 left-0 right-0 justify-between px-4 z-30">
      <button @click="swipePrev" 
              class="bg-white/90 p-2 rounded-full hover:bg-brand hover:text-white transition-all"
              aria-label="Previous product">
        <Icon name="mdi:chevron-up" size="24" />
      </button>
      <button @click="swipeNext" 
              class="bg-white/90 p-2 rounded-full hover:bg-brand hover:text-white transition-all"
              aria-label="Next product">
        <Icon name="mdi:chevron-down" size="24" />
      </button>
    </div>
    <!-- Error Modal -->
    <div v-if="error" 
         class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <p class="text-brand mb-4">{{ error }}</p>
        <button @click="retryLoad" 
                class="bg-brand text-white px-4 py-2 rounded-md hover:bg-[#df4949]">
          Retry
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useProductStore } from '~/stores/product.store';
import { EMediaType } from '~/models';
import LoadingSpinner from '~/components/shared/Loading.vue';
import SwipeHintOverlay from '~/components/product/productDetails/SwipeHintOverlay.vue';
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/qualifiers/format';
import { Quality } from '@cloudinary/url-gen/qualifiers/quality';
import type { IProduct } from '~/models';

// Initialize Cloudinary
const cld = new Cloudinary({ cloud: { cloudName: 'dcci05bzj' } }); // Use your Cloudinary cloud name

// Store and state
const productStore = useProductStore();
const productsWithVideo = ref<IProduct[]>([]);
const currentIndex = ref(0);
const isPlaying = ref<boolean[]>([]);
const muteVideo = ref(true);
const isLoading = ref<boolean[]>([]);
const error = ref<string | null>(null);

const router = useRouter()

// Social sharing platforms
const socialPlatforms = [
  { name: 'TikTok', icon: 'ri:tiktok-fill', url: (id: number, title: string) => 
    `https://www.tiktok.com/share?url=${encodeURIComponent(`${window.location.origin}/product/${id}`)}` },
  { name: 'Facebook', icon: 'mdi:facebook', url: (id: number, title: string) => 
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/product/${id}`)}` },
  { name: 'Instagram', icon: 'mdi:instagram', url: (id: number, title: string) => 
    `https://www.instagram.com/?url=${encodeURIComponent(`${window.location.origin}/product/${id}`)}` },
];

// Computed properties
const productsWithVideoComputed = computed(() => {
  return productStore.products.filter(product => 
    product.media?.some(media => media.type === EMediaType.VIDEO)
  );
});

// Fetch products
const loadProducts = async () => {
  isLoading.value = [];
  error.value = null;
  try {
    await productStore.fetchProducts(1, 20);
    productsWithVideo.value = productsWithVideoComputed.value;
    isPlaying.value = new Array(productsWithVideo.value.length).fill(true);
    isLoading.value = new Array(productsWithVideo.value.length).fill(true);
    initializeVideos();
  } catch (err) {
    error.value = 'Failed to load products. Please try again.';
    console.error('Load products error:', err);
  }
};

// Initialize Cloudinary video players
const initializeVideos = () => {
  console.log('Initializing videos for products:', productsWithVideo.value);
  productsWithVideo.value.forEach((product, index) => {
    const videoElement = document.getElementById(`video-player-${product.id}`) as HTMLVideoElement;
    if (videoElement && product.media?.[0]?.url) {
      try {
        // Extract public ID from Cloudinary URL
        const urlParts = product.media[0].url.split('/upload/');
        const publicId = urlParts.length > 1 ? urlParts[1].replace(/\.[^/.]+$/, '') : product.media[0].url;
        const videoUrl = cld.video(publicId)
          .format('auto')
          .quality(Quality.autoLow())
          .toURL();

        console.log('video url', product.media[0].url);
        videoElement.src = product.media[0].url;
        // Delay playback to avoid AbortError
        setTimeout(() => {
          if (index === currentIndex.value) {
            videoElement.play().catch((e) => {
              console.error(`Video ${product.id} failed to play:`, e);
              error.value = `Failed to play video for ${product.title}: ${e.message}`;
              isLoading.value[index] = false;
            });
          }
        }, 100 * index);
      } catch (e) {
        console.error(`Cloudinary video error for ${product.id}:`, e);
        error.value = `Failed to load video for ${product.title}`;
        isLoading.value[index] = false;
      }
    }
  });
};

// Video control handlers
const togglePlay = (index: number) => {
  const videoElement = document.getElementById(`video-player-${productsWithVideo.value[index].id}`) as HTMLVideoElement;
  if (videoElement) {
    if (isPlaying.value[index]) {
      videoElement.pause();
    } else {
      videoElement.play().catch((e) => {
        error.value = `Failed to play video for ${productsWithVideo.value[index].title}: ${e.message}`;
      });
    }
    isPlaying.value[index] = !isPlaying.value[index];
  }
};

const toggleMute = () => {
  muteVideo.value = !muteVideo.value;
  productsWithVideo.value.forEach((product) => {
    const videoElement = document.getElementById(`video-player-${product.id}`) as HTMLVideoElement;
    if (videoElement) videoElement.muted = muteVideo.value;
  });
};

const handleVideoError = (productId: number, event: Event) => {
  const errorMessage = (event as ErrorEvent).error?.message || 'Unknown error';
  error.value = `Failed to load video for product ${productId}: ${errorMessage}`;
  const index = productsWithVideo.value.findIndex(p => p.id === productId);
  if (index !== -1) isLoading.value[index] = false;
};

const handleVideoLoaded = (index: number) => {
  isLoading.value[index] = false;
};

const retryLoad = () => {
  error.value = null;
  loadProducts();
};

// Swipe navigation
const swipeContainer = ref<HTMLElement | null>(null);
const swipePrev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    playCurrentVideo();
  }
};

const swipeNext = () => {
  if (currentIndex.value < productsWithVideo.value.length - 1) {
    currentIndex.value++;
    playCurrentVideo();
  } else {
    loadMoreProducts();
  }
};

const playCurrentVideo = () => {
  isLoading.value[currentIndex.value] = true;
  const videoElement = document.getElementById(`video-player-${productsWithVideo.value[currentIndex.value].id}`) as HTMLVideoElement;
  if (videoElement) {
    setTimeout(() => {
      videoElement.play().catch((e) => {
        error.value = `Failed to play video for ${productsWithVideo.value[currentIndex.value].title}: ${e.message}`;
        isLoading.value[currentIndex.value] = false;
      });
      isPlaying.value[currentIndex.value] = true;
    }, 100);
  }
};

// Load more products
const loadMoreProducts = async () => {
  try {
    await productStore.fetchMoreProducts();
    productsWithVideo.value = productsWithVideoComputed.value;
    isPlaying.value = new Array(productsWithVideo.value.length).fill(true);
    isLoading.value = new Array(productsWithVideo.value.length).fill(true);
    initializeVideos();
  } catch (err) {
    error.value = 'Failed to load more products.';
    console.error('Load more products error:', err);
  }
};

// Social sharing
const shareToSocial = (url: string) => {
  window.open(url, '_blank');
};

// Swipe handling
let touchStartY = 0;
const handleSwipe = (e: WheelEvent | TouchEvent) => {
  if ('deltaY' in e) {
    // Mouse wheel
    if (e.deltaY > 50) swipeNext();
    else if (e.deltaY < -50) swipePrev();
  } else if ('touches' in e) {
    // Touch swipe
    if (e.type === 'touchstart') {
      touchStartY = e.touches[0].clientY;
    } else if (e.type === 'touchend') {
      const touch = e.changedTouches[0];
      const deltaY = touchStartY - touch.clientY;
      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) swipeNext();
        else swipePrev();
      }
    }
  }
};

// Mount and cleanup
onMounted(async () => {
  await loadProducts();
  if (swipeContainer.value) {
    swipeContainer.value.addEventListener('wheel', handleSwipe, { passive: true });
    swipeContainer.value.addEventListener('touchstart', handleSwipe, { passive: true });
    swipeContainer.value.addEventListener('touchend', handleSwipe, { passive: true });
  }
});

onUnmounted(() => {
  if (swipeContainer.value) {
    swipeContainer.value.removeEventListener('wheel', handleSwipe);
    swipeContainer.value.removeEventListener('touchstart', handleSwipe);
    swipeContainer.value.removeEventListener('touchend', handleSwipe);
  }
});

// Price formatting
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol'
  }).format(price / 100);
};
const navigateHome = () => {
  router.push('/');
};
</script>

<style scoped>
.snap-y {
  scroll-snap-type: y mandatory;
}
.snap-start {
  scroll-snap-align: start;
}
@media (max-width: 640px) {
  .h-screen {
    height: 100vh;
  }
}
</style>
```
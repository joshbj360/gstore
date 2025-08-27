<template>
  <div
    class="relative h-full flex items-center justify-center overflow-hidden"
    :class="{
      'w-full h-full': activeView === 'product',
      'hidden lg:w-[calc(100%-540px)]': activeView === 'details',
    }"
  >
    <!-- Action Buttons -->
    <div class="absolute top-0 left-0 right-0 flex justify-between items-center p-4 sm:p-6 z-20">
      <button
        @click="navigateToHome"
        class="rounded-full p-2 bg-white/90 hover:bg-[#C42B78] text-gray-800 hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
        aria-label="Close product view"
      >
        <Icon name="mdi:close" size="16" />
      </button>
      <div v-if="isOwner" class="flex flex-col gap-2">
        <button
          @click="navigateToEdit"
          class="rounded-full p-2 bg-white/90 hover:bg-[#C42B78] text-gray-800 hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
          aria-label="Edit product"
        >
          <Icon name="mdi:pencil" size="16" />
        </button>
        <button
          @click.stop="$emit('delete-product')"
          class="rounded-full p-2 bg-white/90 hover:bg-[#C42B78] text-gray-800 hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
          aria-label="Delete product"
        >
          <Icon name="mdi:delete" size="16" />
        </button>
      </div>
    </div>

    <!-- Main Image -->
    <div class="w-full max-w-[90%] sm:max-w-[500px] p-4 sm:p-6">
      <div
        class="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden"
        @click="handleImageClick"
        role="region"
        aria-label="Product media viewer"
      >
        <ProductMedia
          :product-media="product.media[currentImageIndex]"
          class="w-full h-full"
        />
      </div>

      <!-- Thumbnails -->
      <div class="grid grid-cols-3 gap-2 sm:gap-3 mt-3 sm:mt-4">
        <button
          v-for="(media, index) in product.media"
          :key="media.url + index"
          @click="$emit('set-current-image', index)"
          :class="{
            'border-2 border-[#C42B78] rounded-lg': currentImageIndex === index,
            'border-2 border-gray-200 rounded-lg hover:border-[#C42B78]/50': currentImageIndex !== index,
          }"
          class="w-full aspect-square overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#C42B78]/50"
          :aria-label="`Select media ${index + 1}`"
        >
          <ProductMedia2
            :product-media="media"
            class="w-full h-full"
            loading="lazy"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import { useRouter } from '#imports';
import { useUserStore } from '~/stores/user.store';
import ProductMedia from '~/components/product/productDetails/mediaSection/MediaDisplay.vue';
import ProductMedia2 from '~/components/product/productDetails/mediaSection/MediaDisplay.vue';
import type { ProductInterface } from '~/models/interface/products/product.interface';

const props = defineProps({
  product: {
    type: Object as PropType<ProductInterface>,
    required: true,
  },
  currentImageIndex: {
    type: Number,
    required: true,
  },
  activeView: {
    type: String as PropType<'product' | 'details'>,
    required: true,
  },
});

const emit = defineEmits([
  'set-current-image',
  'show-previous',
  'show-next',
  'delete-product',
]);

const userStore = useUserStore();
const router = useRouter();

const isOwner = computed(() => {
  if (!userStore.isLoggedIn || !userStore.user?.id) return false;
  return userStore.user.id === props.product.sellerId && userStore.isSeller;
});

const navigateToHome = () => {
  router.push('/');
};

const navigateToEdit = () => {
  router.push(`/upload?edit=${props.product.id}`);
};

const handleImageClick = (e: MouseEvent) => {
  if (window.innerWidth >= 1024) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const thirdWidth = rect.width / 3;

    if (clickX < thirdWidth) {
      emit('show-previous');
    } else if (clickX > thirdWidth * 2) {
      emit('show-next');
    }
  }
};
</script>
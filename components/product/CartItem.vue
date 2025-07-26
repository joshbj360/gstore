<template>
  <article
    class="flex flex-col bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100"
    role="listitem"
    :aria-selected="isSelected"
  >
    <!-- Media container with responsive sizing -->
    <div class="relative aspect-[4/3] w-full">
      <!-- Video thumbnail fallback -->
      <template v-if="item.product.media[0]?.type === MediaType.VIDEO && !error">
        <video
          ref="videoRef"
          :src="item.product.media[0].url"
          :muted="muteVideo"
          loop
          playsinline
          class="w-full h-full object-cover rounded-lg"
          @error="handleError"
          @click.stop="togglePlay"
          aria-label="Product video"
        />
        <div class="absolute top-2 right-2 flex gap-2">
          <button
            @click.stop="togglePlay"
            class="bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-[#f02c56] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
            :aria-label="isPlaying ? 'Pause video' : 'Play video'"
          >
            <Icon :name="isPlaying ? 'mdi:pause' : 'mdi:play'" size="16" />
          </button>
          <button
            @click.stop="toggleMute"
            class="bg-white/90 p-1.5 rounded-full shadow-sm hover:bg-[#f02c56] hover:text-white transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
            :aria-label="muteVideo ? 'Unmute video' : 'Mute video'"
          >
            <Icon :name="muteVideo ? 'mdi:volume-off' : 'mdi:volume-high'" size="16" />
          </button>
        </div>
      </template>
      <template v-else-if="item.product.media[0]?.type === MediaType.IMAGE && !error">
        <img
          :src="item.product.media[0].url"
          :alt="`Product image ${item.product.title || item.product.media[0].id || ''}`"
          class="w-full h-full object-cover rounded-lg"
          @error="handleError"
          loading="lazy"
          width="300"
          height="225"
        />
      </template>
      <template v-else>
        <img
          src="https://picsum.photos/id/1000/300/225"
          alt="Placeholder image"
          class="w-full h-full object-cover rounded-lg"
          loading="lazy"
          width="300"
          height="225"
        />
      </template>

      <!-- Selection toggle -->
      <button
        @click.stop="toggleSelection"
        class="absolute top-3 left-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f02c56]"
        :class="isSelected ? 'bg-[#f02c56] border-[#f02c56]' : 'bg-white border-gray-300 hover:border-[#f02c56]'"
        aria-label="Toggle item selection"
      >
        <svg
          v-if="isSelected"
          class="h-3 w-3 text-white"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Deal badge -->
      <span
        v-if="showWelcomeDeal"
        class="absolute top-3 right-3 bg-gradient-to-r from-[#f02c56] to-[#df4949] text-white text-xs font-semibold px-2 py-1 rounded-md shadow-sm"
      >
        Welcome Deal
      </span>

      <!-- View Details Trigger -->
      <button
        @click.stop="emitViewDetails"
        class="absolute bottom-2 right-2 text-xs text-[#f02c56] hover:underline focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
        aria-label="View product details"
      >
        View Details
      </button>
    </div>

    <!-- Product info -->
    <div class="p-4 flex flex-col flex-grow">
      <div class="flex justify-between items-center mb-2">
        <h3 class="text-sm font-semibold line-clamp-2 leading-tight text-gray-900">
          {{ item.product.title }}
        </h3>
        <button
          @click.stop="removeFromCart"
          class="text-gray-400 hover:text-red-500 transition-colors p-1 focus:outline-none focus:ring-2 focus:ring-[#f02c56] focus:ring-offset-2"
          aria-label="Remove item from cart"
        >
          <Icon name="material-symbols:delete-outline" size="20" />
        </button>
      </div>
      <div class="text-lg font-bold text-gray-900">
        ${{ (item.product.price / 100).toFixed(2) }}
      </div>
      <p class="text-[#009A66] text-xs font-medium mt-1">
        Free 11-day delivery over $8.28 • Free Shipping
      </p>
      <div class="mt-2 flex items-center gap-2">
        <span class="text-sm font-medium text-gray-600">Qty:</span>
        <input
          v-model.number="localQuantity"
          type="number"
          min="1"
          class="w-16 p-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#f02c56]/50"
          @change="updateQuantity"
        />
      </div>
    </div>
  </article>
</template>

<script lang="ts" setup>
import type { ProductInterface } from '~/models/interface/products/product.interface';
import { useCartStore } from '~/stores/cart.store';
import { ref, watch } from 'vue';
import type { CartInterface } from '~/models/interface/cart/cart.interface';
import { MediaType } from '~/models/interface/products/media.interface';

const props = defineProps<{
  item: CartInterface,
  selected: boolean,
  showWelcomeDeal?: boolean,
}>();

const emit = defineEmits<{
  (e: 'selected', item: CartInterface): void,
  (e: 'view-details', product: ProductInterface): void,
}>();

const cartStore = useCartStore();
const isSelected = ref(props.selected);
const muteVideo = ref(true);
const error = ref(false);
const isPlaying = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const localQuantity = ref(props.item.quantity || 1);

// Sync with parent selected state
watch(() => props.selected, (newValue) => {
  isSelected.value = newValue;
});

// Sync local quantity with props
watch(() => props.item.quantity, (newValue) => {
  localQuantity.value = newValue || 1;
});

// Toggle selection and emit event
const toggleSelection = () => {
  isSelected.value = !isSelected.value;
  emit('selected', { ...props.item, quantity: localQuantity.value, selectedSizes: props.item.selectedSizes });
};

// Video controls
const toggleMute = () => {
  muteVideo.value = !muteVideo.value;
  if (videoRef.value) {
    videoRef.value.muted = muteVideo.value;
  }
};

const togglePlay = () => {
  if (videoRef.value) {
    if (isPlaying.value) {
      videoRef.value.pause();
    } else {
      videoRef.value.play().catch(() => {
        error.value = true;
      });
    }
    isPlaying.value = !isPlaying.value;
  }
};

const handleError = () => {
  error.value = true;
};

// Quantity update
const updateQuantity = () => {
  if (localQuantity.value < 1) {
    localQuantity.value = 1; // Enforce minimum quantity
  }
  const updatedItem = { ...props.item, quantity: localQuantity.value };
  cartStore.updateCartItem(updatedItem);
  emit('selected', updatedItem); // Sync with parent selection
};

// Remove item from cart
const removeFromCart = () => {
  if (props.item.id && props.item.selectedSizes) {
    cartStore.removeFromCart(props.item.id, props.item.selectedSizes);
  }
};

// Emit view-details event
const emitViewDetails = () => {
  emit('view-details', props.item.product);
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

article {
  transition-property: transform, box-shadow;
  will-change: transform, box-shadow;
}

article:hover {
  transform: translateY(-2px);
}
</style>
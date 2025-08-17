<template>
  <!-- Main container for side panel icons -->
  <div class="fixed right-4 bottom-16 flex flex-col items-center gap-4 z-30">
    
    <!-- Details, Like, Comment, Share Buttons (No Change) -->
    <button
      v-if="product"
      @click="emit('toggle-details')"
      class="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-[#f02c56] hover:text-white transition-all active:scale-95 transform hover:scale-110"
      aria-label="View product details"
    >
      <Icon name="mdi:information-outline" size="24" />
    </button>
    <button
      v-if="product"
      @click="toggleLike"
      class="w-12 h-12 rounded-full bg-white/90 shadow-lg flex flex-col items-center justify-center text-gray-700 hover:bg-[#f02c56] hover:text-white transition-all active:scale-95 transform hover:scale-110"
      :class="{ 'bg-[#f02c56] text-white': isLiked }"
      aria-label="Like product"
    >
      <Icon :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" size="24" />
      <span class="text-xs font-semibold leading-tight mt-0.5">
        {{ likeCountFormatted }}
      </span>
    </button>
    <button
      @click="emit('toggle-chat')"
      class="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-[#f02c56] hover:text-white transition-all active:scale-95 transform hover:scale-110"
      aria-label="Open comments"
    >
      <Icon name="mdi:comment-text-outline" size="24" />
    </button>
    <button
      v-if="product"
      @click="openShareModal"
      class="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-[#f02c56] hover:text-white transition-all active:scale-95 transform hover:scale-110"
      aria-label="Share product"
    >
      <Icon name="mdi:share-variant" size="24" />
    </button>

    <!-- Add to Cart Button (always visible) -->
    <button
      v-if="product"
      @click="handleAddToCart"
      class="relative w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-[#f02c56] hover:text-white transition-all active:scale-95 transform hover:scale-110"
      aria-label="Add to Cart"
    >
      <Icon name="mdi:cart-plus" size="24" />
      <span
        v-if="cartStore.cartCount > 0"
        class="absolute -top-1 -right-1 bg-[#f02c56] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
      >
        {{ cartStore.cartCount }}
      </span>
    </button>

    <!-- 
      MODIFIED CHECKOUT SUMMARY:
      - Removed the "Checkout" text.
      - Price now uses the compact format (e.g., "₦10k").
      - Icon is slightly larger to fill the space.
    -->
    <NuxtLink
      v-if="cartStore.cartCount > 0"
      to="/shipping/checkout"
      class="mt-2 flex flex-col items-center justify-center p-3 rounded-lg bg-white/90 shadow-lg text-[#f02c56] font-bold text-center transition-all transform hover:scale-110"
      aria-label="Proceed to checkout"
    >
      <Icon name="mdi:truck-fast-outline" size="28" />
      <span class="text-sm leading-tight mt-1">{{ formatCompactPrice(cartTotal) }}</span>
    </NuxtLink>
  </div>

  <!-- Share Modal (no changes) -->
  <transition
    enter-active-class="transition-opacity duration-200 ease-out"
    leave-active-class="transition-opacity duration-200 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isShareModalOpen && product"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="isShareModalOpen = false"
    >
      <div class="bg-white rounded-lg p-6 mx-4 w-full max-w-sm" @click.stop>
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
          Share Product
        </h3>
        <div class="flex justify-around">
          <a :href="`https://www.tiktok.com/share?url=${encodeURIComponent(shareUrl)}`" target="_blank" class="p-3 rounded-full hover:bg-gray-100" aria-label="Share on TikTok">
            <Icon name="mdi:tiktok" size="28" class="text-black" />
          </a>
          <a :href="`https://www.instagram.com/?url=${encodeURIComponent(shareUrl)}`" target="_blank" class="p-3 rounded-full hover:bg-gray-100" aria-label="Share on Instagram">
            <Icon name="mdi:instagram" size="28" class="text-pink-600" />
          </a>
          <a :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`" target="_blank" class="p-3 rounded-full hover:bg-gray-100" aria-label="Share on Facebook">
            <Icon name="mdi:facebook" size="28" class="text-blue-600" />
          </a>
        </div>
        <button @click="isShareModalOpen = false" class="mt-6 w-full py-2.5 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-semibold">
          Close
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useCartStore } from "~/stores/cart.store";
import { useUserStore } from "~/stores/user.store";
import type { ProductInterface } from "~/models/interface/products/product.interface";
import { notify } from "@kyvg/vue3-notification";

const props = defineProps<{
  product: ProductInterface | null;
}>();

const emit = defineEmits(["toggle-details", "toggle-chat"]);

const cartStore = useCartStore();
const userStore = useUserStore();
const isShareModalOpen = ref(false);

const shareUrl = computed(() => {
  return props.product
    ? `${window.location.origin}/product/${props.product.id}`
    : "";
});

const isLiked = computed(() => {
  if (!props.product || !userStore.isLoggedIn) return false;
  return false; 
});

const likeCountFormatted = computed(() => {
  const count = props.product?.likeCount || 0;
  return count > 999 ? `${(count / 1000).toFixed(1)}k` : count;
});

const cartTotal = computed(() => {
  return cartStore.cartItems.reduce((total, item) => {
    return total + (item.product.price * item.quantity);
  }, 0);
});

// NEW: Compact price formatting function
const formatCompactPrice = (priceInKobo: number) => {
    if (isNaN(priceInKobo)) return 'N/A';
    const priceInNaira = priceInKobo / 100;
    
    if (priceInNaira >= 1000000) {
        return `₦${(priceInNaira / 1000000).toFixed(1)}m`;
    }
    if (priceInNaira >= 1000) {
        return `₦${(priceInNaira / 1000).toFixed(0)}k`;
    }
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(priceInNaira);
};

const handleAddToCart = () => {
    if (props.product) {
        if (props.product.variants && props.product.variants.length > 0) {
            notify({ type: 'info', text: 'Please select a size in the details panel.' });
            emit('toggle-details');
        } else {
            cartStore.addToCart(props.product);
            notify({ type: 'success', text: `${props.product.title} added to cart!` });
        }
    }
};

const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    navigateTo("/auth/login");
    return;
  }
  if (!props.product) return;
  console.log("Toggling like for product:", props.product.id);
};

const openShareModal = () => {
  if (!props.product) return;
  isShareModalOpen.value = true;
};
</script>
<template>
  <div>
    <div class="fixed right-4 bottom-16 flex flex-col items-center gap-4 z-30">
      
      <button
        v-if="product"
        @click="emit('toggle-details')"
        class="action-button"
        aria-label="View product details"
      >
        <Icon name="mdi:information-outline" size="24" />
      </button>
      
      <button
        v-if="product"
        @click="toggleLike"
        class="action-button flex-col"
        :class="{ 'text-[#C42B78]': isLiked }"
        aria-label="Like product"
      >
        <Icon :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" size="24" />
        <span class="action-label-text">{{ likeCountFormatted }}</span>
      </button>
      
      <button
        @click="emit('toggle-chat')"
        class="action-button"
        aria-label="Open comments"
      >
        <Icon name="mdi:comment-text-outline" size="24" />
      </button>
      
      <button
        v-if="product"
        @click="openShareModal"
        class="action-button"
        aria-label="Share product"
      >
        <Icon name="mdi:share-variant" size="24" />
      </button>

      <button
        v-if="product"
        @click="handleAddToCart"
        class="relative action-button"
        aria-label="Add to Cart"
      >
        <Icon name="mdi:cart-plus" size="24" />
        <span v-if="cartStore.cartCount > 0" class="cart-badge">
          {{ cartStore.cartCount }}
        </span>
      </button>

      <NuxtLink
        v-if="cartStore.cartCount > 0"
        to="/shipping/checkout"
        class="mt-2 flex flex-col items-center justify-center p-3 rounded-lg bg-white/90 shadow-lg text-[#C42B78] font-bold text-center transition-all transform hover:scale-110"
        aria-label="Proceed to checkout"
      >
        <Icon name="mdi:truck-fast-outline" size="28" />
        <span class="text-sm leading-tight mt-1">{{ formatCompactPrice(cartTotal) }}</span>
      </NuxtLink>
    </div>

    <transition name="fade">
      <div v-if="isShareModalOpen && product" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click="isShareModalOpen = false">
        <div class="bg-white rounded-lg p-6 mx-4 w-full max-w-sm" @click.stop>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Share Product</h3>
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
  </div>
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

const shareUrl = computed(() => props.product ? `${window.location.origin}/product/${props.product.id}`: "");
const isLiked = computed(() => false);
const likeCountFormatted = computed(() => {
  const count = props.product?.likeCount || 0;
  return count > 999 ? `${(count / 1000).toFixed(1)}k` : count;
});
const cartTotal = computed(() => {
  return cartStore.cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0);
});

const formatCompactPrice = (priceInKobo: number) => {
    if (isNaN(priceInKobo)) return 'N/A';
    const priceInNaira = priceInKobo / 100;
    if (priceInNaira >= 1000000) return `₦${(priceInNaira / 1000000).toFixed(1)}m`;
    if (priceInNaira >= 1000) return `₦${(priceInNaira / 1000).toFixed(0)}k`;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(priceInNaira);
};

const handleAddToCart = () => {
    if (props.product) {
        if (props.product.variants && props.product.variants.length > 0) {
            notify({ type: 'info', text: 'Please open the details panel to select a size.' });
            emit('toggle-details');
        } else {
            cartStore.addToCart(props.product, props.product.variants[0]);
            notify({ type: 'success', text: `${props.product.title} added to cart!` });
        }
    }
};

const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    navigateTo("/auth/login");
    return;
  }
  // ... like logic
};

const openShareModal = () => {
  if (props.product) isShareModalOpen.value = true;
};
</script>

<style scoped>
.action-button {
  @apply w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-700 hover:bg-[#C42B78] hover:text-white transition-all active:scale-95 transform hover:scale-110;
}
.action-label-text {
  @apply text-xs font-semibold leading-tight mt-0.5;
}
.cart-badge {
  @apply absolute -top-1 -right-1 bg-[#C42B78] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center border-2 border-white;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
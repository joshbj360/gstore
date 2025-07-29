<template>
  <div class="fixed right-2 bottom-16 flex flex-col gap-2.5 z-50 lg:hidden bg-white p-2 rounded-lg shadow-lg">
  

    <!-- Cart Button -->
    <NuxtLink
      to="/cart"
      class="relative w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-[#f02c56]/10 transition-all active:scale-95"
      aria-label="View cart"
    >
      <Icon name="mdi:cart" size="20" />
      <span
        v-if="cartStore.cartCount"
        class="absolute -top-1 -right-1 bg-[#f02c56] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center"
      >
        {{ cartStore.cartCount }}
      </span>
    </NuxtLink>

    <!-- Product Swipe Button -->
    <NuxtLink
      to="/live-shopping"
      class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-[#f02c56]/10 transition-all active:scale-95"
      aria-label="View product swipe page"
    >
      <Icon name="mdi:gesture-swipe" size="20" />
    </NuxtLink>
  </div>

  <!-- Share Modal -->
  <transition
    enter-active-class="transition-opacity duration-200 ease-out"
    leave-active-class="transition-opacity duration-200 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isShareModalOpen"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="isShareModalOpen = false"
    >
      <div
        class="bg-white rounded-lg p-4 mx-4 w-full max-w-sm"
        @click.stop
      >
        <h3 class="text-base font-semibold text-gray-900 mb-3">Share Product</h3>
        <div class="flex justify-around">
          <a
            href="https://www.tiktok.com"
            target="_blank"
            class="p-2 rounded-full hover:bg-[#f02c56]/10"
            aria-label="Share on TikTok"
          >
            <Icon name="mdi:tiktok" size="24" />
          </a>
          <a
            href="https://www.instagram.com"
            target="_blank"
            class="p-2 rounded-full hover:bg-[#f02c56]/10"
            aria-label="Share on Instagram"
          >
            <Icon name="mdi:instagram" size="24" />
          </a>
          <a
            href="https://www.facebook.com"
            target="_blank"
            class="p-2 rounded-full hover:bg-[#f02c56]/10"
            aria-label="Share on Facebook"
          >
            <Icon name="mdi:facebook" size="24" />
          </a>
        </div>
        <button
          @click="isShareModalOpen = false"
          class="mt-4 w-full py-2 bg-[#f02c56] text-white rounded-lg hover:bg-[#df4949]"
        >
          Close
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCartStore } from '~/stores/cart.store';
import { useUserStore } from '~/stores/user.store';
import { useProductStore } from '~/stores/product.store';
import { useRoute } from '#imports';

const cartStore = useCartStore();
const userStore = useUserStore();
const productStore = useProductStore();
const route = useRoute();

const isShareModalOpen = ref(false);
const isChatOpen = ref(false);

// Get current product based on route (e.g., /product/:id)
const currentProduct = computed(() => {
  if (route.path.includes('/product/')) {
    return productStore.currentProduct;
  }
  return null;
});

const isLiked = computed(() => {
  if (!currentProduct.value || !userStore.isLoggedIn) return false;
  // Placeholder: Check if user liked the product (requires Supabase table for likes)
  return false; // Update with actual logic
});

const likeCountFormatted = computed(() => {
  const count = currentProduct.value?.rating || 0; //TODO change this to like count
  return count > 999 ? `${(count / 1000).toFixed(1)}k` : count;
});

const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    navigateTo('/auth/login');
    return;
  }
  if (!currentProduct.value) return;

  // Placeholder: Implement Supabase logic to toggle like
  console.log('Toggling like for product:', currentProduct.value.id);
  // Example: await supabase.from('product_likes').insert({ user_id, product_id });
};

const toggleChat = () => {
  isChatOpen.value = !isChatOpen.value;
  // Emit event to MainLayout.vue to open chat panel or navigate to Chat.vue
  if (isChatOpen.value) {
    navigateTo('/chat'); // Adjust based on your chat implementation
  }
};

const openShareModal = () => {
  if (!currentProduct.value) return;
  isShareModalOpen.value = true;
};
</script>

<style scoped>
/* Button animations */
button,
a {
  transition: transform 0.2s ease, background-color 0.2s ease;
}
button:active,
a:active {
  transform: scale(0.95);
}
</style>
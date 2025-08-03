<template>
  <div class="fixed right-2 bottom-16 flex flex-col gap-2.5 z-50 lg:hidden">
    <button
      v-if="currentProduct"
      @click="emit('toggle-details', currentProduct.id)"
      class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-[#f02c56]/10 transition-all active:scale-95"
      aria-label="View product details"
    >
      <Icon name="mdi:information-outline" size="20" />
    </button>

    <button
      v-if="currentProduct"
      @click="toggleLike"
      class="w-10 h-10 rounded-full bg-white shadow-md flex flex-col items-center justify-center text-gray-600 hover:bg-[#f02c56]/10 transition-all active:scale-95"
      :class="{ 'bg-[#f02c56] text-white': isLiked }"
      aria-label="Like product"
    >
      <Icon :name="isLiked ? 'mdi:heart' : 'mdi:heart-outline'" size="20" />
      <span class="text-xs font-medium leading-tight mt-0.5">
        {{ likeCountFormatted }}
      </span>
    </button>

    <button
      @click="emit('toggle-chat')"
      class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-[#f02c56]/10 transition-all active:scale-95"
      aria-label="Open comments"
    >
      <Icon name="mdi:comment-text-outline" size="20" />
    </button>

    <button
      v-if="currentProduct"
      @click="openShareModal"
      class="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-[#f02c56]/10 transition-all active:scale-95"
      aria-label="Share product"
    >
      <Icon name="mdi:share-variant" size="20" />
    </button>

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


  </div>

  <transition
    enter-active-class="transition-opacity duration-200 ease-out"
    leave-active-class="transition-opacity duration-200 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isShareModalOpen && currentProduct"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click="isShareModalOpen = false"
    >
      <div class="bg-white rounded-lg p-4 mx-4 w-full max-w-sm" @click.stop>
        <h3 class="text-base font-semibold text-gray-900 mb-3">
          Share Product
        </h3>
        <div class="flex justify-around">
          <a
            :href="`https://www.tiktok.com/share?url=${encodeURIComponent(
              shareUrl
            )}`"
            target="_blank"
            class="p-2 rounded-full hover:bg-[#f02c56]/10"
            aria-label="Share on TikTok"
          >
            <Icon name="mdi:tiktok" size="24" />
          </a>
          <a
            :href="`https://www.instagram.com/?url=${encodeURIComponent(
              shareUrl
            )}`"
            target="_blank"
            class="p-2 rounded-full hover:bg-[#f02c56]/10"
            aria-label="Share on Instagram"
          >
            <Icon name="mdi:instagram" size="24" />
          </a>
          <a
            :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}`"
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
import { ref, computed } from "vue";
import { useCartStore } from "~/stores/cart.store";
import { useUserStore } from "~/stores/user.store";
import { useRoute } from "#imports";
import type { ProductInterface } from "~/models/interface/products/product.interface";

const props = defineProps<{
  product: ProductInterface | null;
}>();

const emit = defineEmits(["toggle-details", "toggle-chat"]);

const cartStore = useCartStore();
const userStore = useUserStore();
const route = useRoute();

const isShareModalOpen = ref(false);

const currentProduct = computed(() => {
  return props.product;
});

const shareUrl = computed(() => {
  return currentProduct.value
    ? `${window.location.origin}/product/${currentProduct.value.id}`
    : "";
});

const isLiked = computed(() => {
  if (!currentProduct.value || !userStore.isLoggedIn) return false;
  // Placeholder: Check if user liked the product (requires Supabase table)
  return false; // Update with actual logic
});

const likeCountFormatted = computed(() => {
  const count = currentProduct.value?.likeCount || 0;
  return count > 999 ? `${(count / 1000).toFixed(1)}k` : count;
});

const toggleLike = async () => {
  if (!userStore.isLoggedIn) {
    navigateTo("/auth/login");
    return;
  }
  if (!currentProduct.value) return;
  // Placeholder: Implement Supabase logic for likes
  console.log("Toggling like for product:", currentProduct.value.id);
  // Example: await supabase.from('product_likes').insert({ user_id, product_id });
};

const openShareModal = () => {
  if (!currentProduct.value) return;
  isShareModalOpen.value = true;
};
</script>

<style scoped>
button,
a {
  transition: transform 0.2s ease, background-color 0.2s ease;
}

button:active,
a:active {
  transform: scale(0.95);
}
</style>
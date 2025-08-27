<template>
  <div id="product-card" class="relative bg-white rounded-lg shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    
    <NuxtLink 
      v-if="isOwner"
      :to="`/edit/${product.id}`"
      class="absolute top-2 right-2 z-20 h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-[#C42B78] hover:text-white transition-all opacity-0 group-hover:opacity-100"
      aria-label="Edit Product"
    >
      <Icon name="mdi:pencil-outline" size="18" />
    </NuxtLink>

    <NuxtLink 
        v-if="product.store_name"
        :to="`/seller/profile/${product.store_name}`"
        class="absolute top-2 left-2 z-10 bg-white/80 backdrop-blur-sm text-gray-800 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1"
        :title="`Sold by ${product.store_name}`"
    >
        <Icon name="mdi:store-outline" size="12" />
        <span>{{ product.store_name }}</span>
    </NuxtLink>

    <NuxtLink :to="`/product/${product.id}`" class="block w-full aspect-square relative overflow-hidden">
      <MediaDisplayCard
        :product-media="product.media?.[0]"
        class="w-full h-full transition-transform duration-300 group-hover:scale-105"
      />
    </NuxtLink>

    <div class="p-3">
      <h3 class="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight h-4">
        {{ product.title || 'Untitled Product' }}
      </h3>

      <div class="flex justify-between items-center mt-1">
        <div>
          <p class="text-sm text-[#C42B78]">
            {{ formatPrice(product.price) }}
          </p>
        </div>
        
        <button
          @click.stop="handleAddToCart"
          :disabled="isInCart"
          class="h-7 w-7 flex items-center justify-center rounded-full bg-[#C42B78]/10 text-[#C42B78] hover:bg-[#C42B78] hover:text-white transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          :class="{ 'bg-emerald-500 !text-white': isInCart }"
          aria-label="Add to cart"
        >
          <Icon :name="isInCart ? 'mdi:cart-check' : 'mdi:cart-plus'" class="h-4 w-4" />
        </button>
      </div>

      <div class="mt-1 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <div class="flex items-center gap-1.5">
          <Icon name="mdi:heart-outline" class="h-4 w-4 text-rose-400" />
          <span>{{ likeCountFormatted }} Likes</span>
        </div>
        <div class="flex items-center gap-1.5">
          <Icon name="mdi:package-variant-closed" class="h-4 w-4 text-gray-400" />
          <span>{{ numberSoldFormatted }} Sold</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCartStore, useUserStore } from '~/stores';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import MediaDisplayCard from './MediaDisplayCard.vue';
import { notify } from "@kyvg/vue3-notification";
import { useRouter } from 'vue-router';

const props = defineProps<{
  product: ProductInterface & {
    likeCount?: number;
    numberSold?: number; // Added for the new metric
  };
}>();

const cartStore = useCartStore();
const userStore = useUserStore();
const router = useRouter();

// Checks if the logged-in user is the seller of this product
const isOwner = computed(() => {
    return userStore.isLoggedIn && userStore.user?.id === props.product.sellerId;
});

const isInCart = computed(() => cartStore.cartItems.some(item => item.product.id === props.product.id));

const likeCountFormatted = computed(() => {
  const count = props.product.likeCount || 0;
  return count > 999 ? `${(count/1000).toFixed(1)}k` : count;
});

// Formats the "Number Sold" metric
const numberSoldFormatted = computed(() => {
  const count = props.product.numberSold || 0;
  if (count > 999) return `${(count / 1000).toFixed(1)}k+`;
  if (count > 0) return `${count}`;
  return '0';
});

// Smarter "Add to Cart" that handles products with variants
const handleAddToCart = () => {
  alert(`Adding to cart: ${props.product.id}, product variant: ${props.product.variants[0]?.id}`);
  // Check if the product has variants and how many
  const variants = props.product.variants;

  if (variants && variants.length > 1) {
    // SCENARIO 1: Multiple options exist. Guide user to the product page.
    notify({ type: 'info', text: 'Please open the details panel to select a size.' });
    router.push(`/product/${props.product.id}`);
    
  } else if (variants && variants.length === 1) {
    // SCENARIO 2: Only one option exists. Add it directly to the cart.
    cartStore.addToCart(props.product, variants[0]);
    notify({ type: 'success', text: `${props.product.title} added to cart!` });

  } else {
    // Fallback/Error: The product has no variants listed.
    notify({ type: 'error', text: 'This product is currently unavailable.' });
  }
};

const formatPrice = (price: number) => {
  if (isNaN(price)) return '₦0';
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price / 100);
};
</script>
<template>
  <div class="relative bg-white rounded-md shadow-xs overflow-hidden transition-transform active:scale-[0.98] w-full">
    <!-- Verification Badge - Top Left -->
    <button
      v-if="true"
      @click="showSellerTooltip = !showSellerTooltip"
      @mouseenter="showSellerTooltip = true"
      @mouseleave="showSellerTooltip = false"
      class="absolute top-1.5 left-1.5 z-10 h-5 w-5 rounded-full bg-[#f07d96] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/50"
    >
      <Icon name="mdi:check-decagram" class="h-3.5 w-3.5 text-white" />
      <span class="sr-only">Verified Seller</span>
    </button>

    <!-- Seller Tooltip -->
    <transition
      enter-active-class="transition-opacity duration-150 ease-out"
      leave-active-class="transition-opacity duration-150 ease-in"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="showSellerTooltip"
        class="absolute top-8 left-1.5 z-20 bg-white text-xs font-medium text-gray-800 px-2 py-1 rounded shadow-md whitespace-nowrap"
      >
        {{ product.store_name }}
      </div>
    </transition>

    <!-- Discount Badge - Top Right -->
    <div 
      v-if="showDiscount"
      class="absolute top-1.5 right-1.5 z-10 bg-[#f02c56] text-white text-[11px] font-bold px-1.5 py-0.5 rounded"
    >
      {{ discountPercentage }}% OFF
    </div>

    <!-- Product Image -->
    <NuxtLink 
      :to="`/product/${product.id}`"
      class="block w-full aspect-square relative overflow-hidden"
      aria-label="View product details"
    >
      <ProductMedia 
        :product-media="product.media?.[0]"
        class="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-200"
      />
    </NuxtLink>

    <!-- Product Info -->
    <div class="p-2">
      <!-- Title (2 lines max) -->
      <h3 class="text-[13px] font-medium text-gray-900 line-clamp-2 leading-tight ">
        {{ product.title || 'Untitled' }}
      </h3>

      <!-- Price & Cart Button -->
      <div class="flex justify-between items-center mt-0.5">
        <div>
          <p class="text-[13px] font-bold text-[#f02c56] leading-none">
            {{ formatPrice(discountedPrice) }}
          </p>
          <p 
            v-if="showDiscount"
            class="text-[11px] text-gray-500 line-through mt-0.5"
          >
            {{ formatPrice(product.price) }}
          </p>
        </div>
        
        <button
          @click.stop="handleAddToCart"
          :disabled="isInCart || isOutOfStock"
          class="h-7 w-7 flex items-center justify-center rounded-full  text-[#f02c56] shadow-xs transition-colors disabled:bg-gray-200"
          :class="{ 'bg-emerald-200': isInCart }"
          aria-label="Add to cart"
        >
          <Icon 
            :name="cartButtonIcon"
            class="h-4 w-4"
          />
        </button>
      </div>
    </div>

    <!-- Rating & Likes (Bottom) -->
    <div class="px-2 pb-2 pt-1 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
      <div class="flex items-center gap-1.5">
        <Icon name="mdi:star" class="h-3.5 w-3.5 text-yellow-400" />
        <span>{{ product.rating?.toFixed(1) || '4.5' }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <Icon name="mdi:heart" class="h-3.5 w-3.5 text-rose-400" />
        <span>{{ likeCountFormatted }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCartStore } from '~/stores/cart.store';
import type { ProductInterface } from '~/models/interface/products/product.interface';
import ProductMedia from '~/components/product/productDetails/mediaSection/MediaDisplay.vue'

const props = defineProps<{
  product: ProductInterface & {
    sellerVerified?: boolean;
    likeCount?: number;
    rating?: number;
  };
}>();

const { product } = toRefs(props);
const cartStore = useCartStore();
const showSellerTooltip = ref(false);

// Computed properties
const cartButtonIcon = computed(() => {
  if (isOutOfStock.value) return 'mdi:cart-off';
  return isInCart.value ? 'mdi:cart-check' : 'mdi:cart-plus';
});

const likeCountFormatted = computed(() => {
  const count = product.value.likeCount || 0;
  return count > 999 ? `${(count/1000).toFixed(1)}k` : count;
});

const isInCart = computed(() => cartStore.cartItems.some(item => item.id === product.value.id));
const isOutOfStock = computed(() => product.value.stock <= 0);
const showDiscount = computed(() => product.value.discount && product.value.discount > 0);
const discountPercentage = computed(() => Math.round((product.value.discount || 0) * 100));
const discountedPrice = computed(() => product.value.discount 
  ? product.value.price * (1 - product.value.discount) 
  : product.value.price
);

const handleAddToCart = () => {
  if (isOutOfStock.value) return;
  cartStore.addToCart({
    ...product.value,
    quantity: 1
  } as ProductInterface & { quantity: number });
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'NGN',
    currencyDisplay: 'narrowSymbol'
  }).format(price / 100);
};
</script>
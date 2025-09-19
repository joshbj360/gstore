<template>
  <div id="product-card"
    class="relative bg-white rounded-lg shadow-sm overflow-hidden group transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <!-- Edit button (if owner) -->
    <NuxtLink v-if="isOwner" :to="`/edit/${product.id}`"
      class="absolute top-2 right-2 z-20 h-8 w-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-brand hover:text-white transition-all opacity-0 group-hover:opacity-100"
      aria-label="Edit Product">
      <Icon name="mdi:pencil-outline" size="18" />
    </NuxtLink>

    <!-- DISCOUNT BADGE -->
    <div v-if="showDiscount"
      class="absolute top-2 right-2 z-10 bg-brand text-white text-[10px] font-bold px-2 py-1 rounded-full">
      -{{ discountPercentage.value }}%
    </div>
    
    <!-- Seller label -->
    <NuxtLink v-if="product.store_name" :to="`/seller/profile/${product.store_name}`" class="absolute top-2 left-2 z-10 px-2 py-1 rounded-full flex items-center gap-1
         font-semibold backdrop-blur-sm text-xs sm:text-[10px]" :class="product.isVerified
          ? 'bg-brand/90 text-white'
          : 'bg-white/80 text-gray-800'" :title="`Sold by ${product.store_name}`">

      <Icon name="mdi:store-outline" size="12" aria-hidden="true" />
      <span>{{ product.store_name }}</span>
      <Icon v-if="product.isVerified" name="mdi:check-decagram" class="h-3 w-3 text-white" aria-hidden="true" />
    </NuxtLink>

    <!-- Product image -->
    <NuxtLink :to="`/product/${product.id}`" class="block w-full aspect-square relative overflow-hidden">
      <MediaDisplayCard :product-media="product.media?.[0]"
        class="w-full h-full transition-transform duration-300 group-hover:scale-105" />
    </NuxtLink>

    <!-- Product details -->
    <div class="p-2">
      <!-- Price + Cart -->
      <div class="flex justify-between items-center mt-1">
        
          <p class="text-base font-bold text-gray-800">
            {{ formatPrice(discountedPrice) }}
          </p>
          <p v-if="showDiscount" class="text-xs text-gray-400 line-through -mt-1 pt-1">
            {{ formatPrice(product.price) }}
          </p>
        

        <button @click.stop="handleAddToCart" :disabled="isInCart"
          class="h-8 w-8 flex items-center justify-center rounded-full bg-brand/10 text-brand-dark hover:bg-brand hover:text-white transition-colors disabled:bg-gray-200 disabled:text-gray-400"
          :class="{ 'bg-emerald-500 !text-white': isInCart }" aria-label="Add to cart">
          <Icon :name="isInCart ? 'mdi:cart-check' : 'mdi:cart-plus'" class="h-5 w-5" />
        </button>
      </div>
      <!-- Title -->
<h4 class="text-sm font-semibold text-gray-600 line-clamp-2 leading-snug">
  {{ product.title || 'Untitled Product' }}
</h4>

<!-- Show Metrics only if both are > 10 -->
<div v-if="product.likeCount && product.productSoldCount ? product.likeCount > 10 && product.productSoldCount > 10 : false"
  class="mt-2 pt-1 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
  
  <!-- Likes -->
  <div class="flex items-center gap-1.5">
    <Icon name="mdi:heart-outline" class="h-4 w-4 text-rose-400" />
    <span>{{ likeCountFormatted }} Likes</span>
  </div>

  <!-- Number Sold -->
  <div class="flex items-center gap-1.5">
    <Icon name="mdi:package-variant-closed" class="h-4 w-4 text-gray-400" />
    <span>{{ numberSoldFormatted }} Sold</span>
  </div>
</div>

<!-- Show Description if not enough likes/sold -->
<!-- <p v-else  v-html="product.description || 'No description available.'" class="mt-2 text-xs text-gray-500 line-clamp-1">
</p> -->

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
    numberSold?: number;
    isVerified?: boolean; // 👈 new flag for verified seller
  };
}>();

const cartStore = useCartStore();
const userStore = useUserStore();
const router = useRouter();

const isOwner = computed(() => {
  return userStore.isLoggedIn && userStore.user?.id === props.product.sellerId;
});

const isInCart = computed(() =>
  cartStore.cartItems.some(item => item.product.id === props.product.id)
);

const likeCountFormatted = computed(() => {
  const count = props.product.likeCount || 0;
  return count > 999 ? `${(count / 1000).toFixed(1)}k` : count;
});

const numberSoldFormatted = computed(() => {
  const count = props.product.numberSold || 0;
  if (count > 999) return `${(count / 1000).toFixed(1)}k+`;
  if (count > 0) return `${count}`;
  return '0';
});

// Computed properties for handling discounts
const showDiscount = computed(() => props.product.discount && props.product.discount > 0);
const discountPercentage = computed(() => {
  return {
    value: props.product.price > 0 ? Math.round((props.product.discount || 0) / props.product.price * 100) : 0
  }
});
const discountedPrice = computed(() => {
  return props.product.discount ? props.product.price - props.product.discount : props.product.price;
});

const handleAddToCart = () => {
  const variants = props.product.variants;

  if (variants && variants.length > 1) {
    notify({ type: 'info', text: 'Please open the details panel to select a size.' });
    router.push(`/product/${props.product.id}`);
  } else if (variants && variants.length === 1) {
    cartStore.addToCart(props.product, variants[0]);
    notify({ type: 'success', text: `${props.product.title} added to cart!` });
  } else {
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
